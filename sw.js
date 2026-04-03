self.addEventListener('install', (event) => {
    // Activate worker immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all pages immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/stream/')) {
        event.respondWith(fetch(event.request).catch(err => {
            console.error('Service Worker stream fetch failed:', err);
            throw err;
        }));
    }
});
