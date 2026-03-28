// Basic Service Worker to flag the app as a PWA (Installable)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('pwa-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/static/styles.css',
        '/static/app.jsx',
        '/static/icon.png',
        'https://unpkg.com/react@18/umd/react.development.js',
        'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
        'https://unpkg.com/@babel/standalone/babel.min.js',
        'https://unpkg.com/lucide@latest'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(e.request);
    })
  );
});
