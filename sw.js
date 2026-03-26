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
    
    // Check if the request is destined for our Ngrok URL
    if (url.hostname.includes('ngrok-free.dev') || url.hostname.includes('loca.lt') || url.pathname.startsWith('/stream/')) {
        
        // Clone headers and bypass the warning
        const newHeaders = new Headers(event.request.headers);
        newHeaders.set('ngrok-skip-browser-warning', 'true');
        newHeaders.set('Bypass-Tunnel-Reminder', 'true');
        
        // Prepare a totally transparent modified cross-origin request
        const modifiedRequest = new Request(event.request, {
            headers: newHeaders,
            mode: 'cors', // Trigger preflight so backend can ACK the custom headers
            credentials: 'omit'
        });
        
        event.respondWith(fetch(modifiedRequest).catch(err => {
            console.error('Service Worker stream fetch failed:', err);
            throw err;
        }));
    }
});
