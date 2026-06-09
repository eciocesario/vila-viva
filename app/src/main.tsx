import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { initSentry } from '@/lib/sentry';
import { initPostHog } from '@/lib/posthog';
import { queryClient } from '@/lib/queryClient';
import { persistOptions } from '@/lib/persistQuery';

initSentry();
initPostHog();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>,
);
