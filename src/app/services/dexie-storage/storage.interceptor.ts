// my-interceptor.ts
import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpResponse,
  HttpRequest,
  HttpEvent,
  HttpHandlerFn
} from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { StorageService } from './dexie.storage';
import { INTERCEPTOR_CONFIG, InterceptorConfig } from './storage-http.context';

export const storageInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);
  const config: InterceptorConfig = req.context.get(INTERCEPTOR_CONFIG) || {};

  const {
    shouldStore = false,
    shouldReturnStoredValuesOnError = false,
    cacheBuster = false,
    collectionKey = null
  } = config;

  const isOnline = navigator.onLine;
  const method = req.method.toUpperCase();

  // Handle cache busting
  if (cacheBuster && isOnline && collectionKey) {
    return from(storageService.clearCollection(collectionKey)).pipe(
      switchMap(() => next(req))
    );
  }

  // Handle requests based on method
  if (collectionKey) {
    if (method === 'GET') {
      return handleGetRequest(req, next, storageService, isOnline, shouldStore, shouldReturnStoredValuesOnError, collectionKey);
    } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return handleMutationRequest(req, next, storageService, isOnline, collectionKey);
    }
  }

  // Default case for other methods or when collectionKey is not provided
  return next(req);
};

// Adjusted handleGetRequest function
function handleGetRequest(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  storageService: StorageService,
  isOnline: boolean,
  shouldStore: boolean,
  shouldReturnStoredValuesOnError: boolean,
  collectionKey: string
): Observable<HttpEvent<any>> {
  const { hasId, id } = extractIdFromUrl(req.url);

  if (!isOnline) {
    return handleOfflineOrErrorGet(collectionKey, storageService, req, id);
  }

  // Online scenarios
  return next(req).pipe(
    switchMap(event => {
      if (shouldStore && event instanceof HttpResponse) {
        const storageMethod = hasId ?
          storageService.applyMutation(collectionKey, (event as HttpResponse<any>).body.id, req.method, event.body) :
          storageService.saveCollectionData(collectionKey, (event as HttpResponse<any>).body);

        return from(storageMethod).pipe(map(() => event));
      }
      return of(event);
    }),
    catchError(error => {
      if (shouldReturnStoredValuesOnError) {
        return handleOfflineOrErrorGet(collectionKey, storageService, req, id);
      }
      return throwError(() => error);
    })
  );
}

function handleOfflineOrErrorGet(collectionKey: string, storageService: StorageService, req: HttpRequest<any>, id?: number) {
  const storageMethod = id ? storageService.getCollectionItem(collectionKey, id) : storageService.getCollectionData(collectionKey);

  return from(storageMethod).pipe(
    switchMap(data => {
      if (data) {
        const response = new HttpResponse({
          body: data,
          status: 200,
          statusText: 'OK',
          url: req.url
        });
        return of(response);
      }
      return throwError(() => new Error('No internet and no stored data'));
    })
  );
}

// Adjusted handleMutationRequest function
function handleMutationRequest(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  storageService: StorageService,
  isOnline: boolean,
  collectionKey: string
): Observable<HttpEvent<any>> {
  const mutationRequest = {
    method: req.method,
    url: req.urlWithParams,
    body: req.body,
    headers: req.headers,
    collectionKey
  };

  if (!isOnline) {
    return from(storageService.storeOfflineMutation(mutationRequest)).pipe(
      switchMap(() => {
        // Update local collection
        return from(storageService.applyMutation(collectionKey, mutationRequest.body.id, req.method, mutationRequest.body)).pipe(
          map(() => {
            return new HttpResponse({
              status: 202,
              statusText: 'Accepted for offline processing',
              url: req.url
            })
          })
        );
      })
    );
  }

  // Online scenario
  return next(req).pipe(
    switchMap(event => {
      if (event instanceof HttpResponse) {
        // Update local collection with the response
        return from(storageService.applyMutation(collectionKey, (event as HttpResponse<any>).body.id, req.method, event.body)).pipe(
          map(() => event)
        );
      }
      return of(event);
    })
  );
}

function extractIdFromUrl(url: string): { hasId: boolean; id: any } {
  const urlSegments = url.split('/');
  const lastSegment = urlSegments[urlSegments.length - 1];

  // Check if the last segment is a number (ID)
  const id = parseInt(lastSegment, 10);
  if (!isNaN(id)) {
    return { hasId: true, id };
  }

  return { hasId: false, id: null };
}
