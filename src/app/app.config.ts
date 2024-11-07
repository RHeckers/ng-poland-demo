import { APP_INITIALIZER, ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { storageInterceptor } from './services/dexie-storage/storage.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
import { OfflineManagerService } from './services/dexie-storage/offline-synchronization.service';
import { StorageService } from './services/dexie-storage/dexie.storage';

export function initSynchronousFactory() {
  return () => {
    console.log('Init OfflineManagerService');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initSynchronousFactory,
      deps: [OfflineManagerService, StorageService],
      multi: true
    },
    provideRouter(routes),
    provideHttpClient(withInterceptors([storageInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
