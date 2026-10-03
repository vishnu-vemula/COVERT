import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

/**
 * Firebase ships `getReactNativePersistence` only in its React Native build, and
 * the package's public typings don't declare it. This declares the real export.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
