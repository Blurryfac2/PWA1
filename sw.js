// Asignar nombre y versión de la caché
const CACHE_NAME = 'v1_cache_MarcoAntonioPWA';

// Archivos a cachear en la aplicación
const urlsToCache = [
    './',
    './styles.css',
    './main.js',
    './manifest.json',
    './img/facebook.png',
    './img/instagram.png',
    './img/twitter.png',
    './img/favicon-1024.png',
    './img/favicon-512.png',
    './img/favicon-384.png',
    './img/favicon-256.png',
    './img/favicon-192.png',
    './img/favicon-128.png',
    './img/favicon-96.png',
    './img/favicon-64.png',
    './img/favicon-32.png',
    './img/favicon-16.png'
];


// Evento install
// Instalación del service worker y guardado de recursos estáticos en caché
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache)
                    .then(() => self.skipWaiting());
            })
            .catch(err => console.log('❌ No se ha registrado el caché', err))
    );
});

// Evento activate
// Activar y limpiar cachés viejas
self.addEventListener('activate', e => {
    const cacheWhitelist = [CACHE_NAME];

    e.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!cacheWhitelist.includes(cacheName)) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Evento fetch
// Intercepta las peticiones y usa la caché si está disponible
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request)
            .then(res => {
                if (res) {
                    return res; // Devuelve desde caché
                }
                return fetch(e.request); // O descarga si no está en caché
            })
    );
});
