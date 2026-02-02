import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// Registrasi Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Gunakan path relatif sederhana yang didukung luas oleh browser
    const swPath = './sw.js';

    navigator.serviceWorker.register(swPath)
      .then(reg => {
        console.log('✅ PWA: Service Worker terdaftar. Scope:', reg.scope);
        
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ PWA: Konten baru tersedia, silakan muat ulang halaman.');
              }
            };
          }
        };
      })
      .catch(err => {
        if (err.name === 'SecurityError') {
          console.info('ℹ️ PWA: Registrasi SW dibatasi di lingkungan sandbox (seperti Preview Editor). Fitur PWA akan aktif sepenuhnya saat di-deploy ke hosting HTTPS (GitHub Pages, Vercel, dll).');
        } else {
          console.error('❌ PWA: Registrasi SW gagal:', err);
        }
      });
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