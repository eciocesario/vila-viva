import posthog from 'posthog-js';

export function initPostHog() {
  if (import.meta.env.MODE !== 'production') return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!key) return; // No-op if not configured

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
  });
}

export function track(event: string, props?: Record<string, unknown>) {
  if (import.meta.env.MODE !== 'production') return;
  posthog.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (import.meta.env.MODE !== 'production') return;
  posthog.identify(userId, props);
}
