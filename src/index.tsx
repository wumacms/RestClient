import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from 'react-error-boundary';
import { GlobalFallback } from './components/GlobalErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={GlobalFallback} onReset={() => window.location.reload()}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
