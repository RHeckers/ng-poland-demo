// offline-manager.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './dexie.storage';
import { EMPTY, from, mergeMap, of, concatMap, catchError, retry, Subject, tap, firstValueFrom, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfflineManagerService {
  private readonly storageService = inject(StorageService);
  private readonly http = inject(HttpClient);

  private syncing = false;

  public syncOfflineRequestsStarted = new Subject<void>();
  public syncOfflineRequestsFinishedSuccesfully = new Subject<boolean>();

  onlineEvent = window.addEventListener('online', () => {
    this.subscribetoSync();
  });

  constructor() {
    this.subscribetoSync();
  }

  subscribetoSync() {
    this.syncOfflineMutations().pipe(tap(() => this.syncOfflineRequestsStarted.next())).subscribe({
      complete: () => {
        console.log('Offline requests synchronized.');
        this.syncOfflineRequestsFinishedSuccesfully.next(true);
      },
      error: (error) => {
        console.error('Error synchronizing offline requests:', error);
        this.syncOfflineRequestsFinishedSuccesfully.next(false);
      }
    });
  }

  syncOfflineMutations() {
    if (this.syncing) return EMPTY;

    this.syncing = true;

    return from(this.storageService.getOfflineMutations()).pipe(
      mergeMap(offlineMutations => {
        if (offlineMutations.length === 0) {
          this.syncing = false;
          return of(null);
        }

        console.log('==>', offlineMutations);
        // Process mutations one after another to preserve order
        return of(...offlineMutations).pipe(
          concatMap(mutation => this.sendMutation(mutation)),
          catchError(error => {
            this.syncing = false;
            return of(error);
          })
        );
      })
    );
  }

  private sendMutation(mutation: any) {
    const { id, method, url, body, collectionKey } = mutation;

    console.log('sendMutation ==>', mutation);

    return this.http.request(method, url, { body }).pipe(
      catchError(error => {
        console.error(`Error sending mutation ${id}:`, error);
        throw error;
      }),
      mergeMap((response: any) => {
        // If the mutation was successful, remove it from storage
        return from(this.storageService.deleteOfflineMutation(id)).pipe(
          catchError(error => {
            throw error;
          }),
          mergeMap(() => {
            if (response?.body) {
              return from(this.storageService.applyMutation(
                collectionKey,
                response.body.id,
                method,
                response.body));
            }
            return of(null);
          })
        );
      })
    );
  }
}
