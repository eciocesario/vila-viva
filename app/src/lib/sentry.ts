import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.MODE !== 'production') return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: 'staging',
    tracesSampleRate: 0.1,
    ignoreErrors: ['Network request failed', 'AbortError'],
  });
}
