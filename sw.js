const CACHE_NAME = 'smancir-parkir-v1.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://iili.io/fLQoCep.png'
];

// Install Event - Caching Assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Memaksa SW baru menjadi aktif segera
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(), // Mengambil kendali client segera
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('SW: Clearing old cache', cache);
              return caches.delete(cache);
            }
          })
        );
      })
    ])
  );
});

// Fetch Event - Network First with Cache Fallback + Navigation Fallback
self.addEventListener('fetch', (event) => {
  // Strategi Khusus untuk Navigasi (Mencegah 404 saat buka App dari Home Screen)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      })
    );
    return;
  }

  // Strategi Cache First untuk aset statis
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Jika offline dan aset tidak ada di cache
        if (event.request.destination === 'image') {
          return caches.match('https://iili.io/fLQoCep.png');
        }
      });
    })
  );
});