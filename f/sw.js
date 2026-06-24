// SYNAPSE Service Worker — PWA offline support
const CACHE_NAME = 'synapse-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/features.html',
    '/css/shared.css',
    '/js/navbar-auth.js',
    '/js/synapse-canvas.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});
