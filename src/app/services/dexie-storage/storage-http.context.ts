import { HttpContextToken } from '@angular/common/http';

export interface InterceptorConfig {
  collectionKey: string;
  shouldStore?: boolean;
  shouldReturnStoredValuesOnError?: boolean;
  cacheBuster?: boolean;
}

export const INTERCEPTOR_CONFIG = new HttpContextToken<InterceptorConfig>(() => ({collectionKey: ''}));
