const CACHE_NAME = 'smancir-parkir-v1.5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://iili.io/fLQoCep.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching Core Assets');
      // Menggunakan return cache.addAll agar jika satu gagal, instalasi tetap lanjut
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('SW: Removing old cache', cache);
            return caches.delete(cache);
          }
        })
      ).then(() => self.clients.claim());
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategi Khusus untuk Navigasi (Halaman Utama)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html') || caches.match('./');
      })
    );
    return;
  }

  // Strategi Cache First, Fallback to Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Jangan simpan response error ke cache
        if (!fetchRes || fetchRes.status !== 200 || fetchRes.type !== 'basic') {
          return fetchRes;
        }
        
        // Simpan aset baru secara dinamis jika perlu (opsional)
        // const resClone = fetchRes.clone();
        // caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        
        return fetchRes;
      }).catch(() => {
        // Fallback jika benar-benar offline dan tidak ada di cache
        if (event.request.destination === 'image') {
          return caches.match('https://iili.io/fLQoCep.png');
        }
      });
    })
  );
});