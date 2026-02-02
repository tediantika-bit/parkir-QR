import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Registrasi Service Worker dengan penanganan update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('SW Registered!', reg);
        
        // Cek update SW secara berkala
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Konten baru tersedia, silakan refresh.');
            }
          });
        });
      })
      .catch(err => console.error('SW Registration Failed!', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);