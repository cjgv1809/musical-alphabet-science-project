/* Service worker: la app funciona sin conexión tras la primera visita.
 *
 * - Instalación: guarda la página y los archivos que ella enlaza
 *   (los de /assets/ llevan hash en el nombre, así que nunca cambian).
 * - Archivos con hash: primero la caché (inmutables).
 * - Navegación y demás: primero la red, y si falla, la caché.
 * Al publicar una versión nueva, sube VERSION para limpiar cachés viejas.
 */
const VERSION = 'v1';
const CACHE = `notas-que-hablan-${VERSION}`;

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const base = self.registration.scope;
      const respuesta = await fetch(base, { cache: 'reload' });
      const html = await respuesta.clone().text();
      await cache.put(base, respuesta);
      // Rutas relativas (./assets/xxx.js) resueltas contra el alcance.
      const recursos = [...html.matchAll(/(?:src|href)="(\.?\/?(?:assets\/|favicon|manifest|icon)[^"]*)"/g)]
        .map((m) => new URL(m[1], base).href);
      await cache.addAll([...new Set(recursos)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((n) => n.startsWith('notas-que-hablan-') && n !== CACHE)
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/assets/')) {
    // Inmutable (hash en el nombre): caché primero.
    evento.respondWith(
      caches.match(peticion).then(
        (guardado) =>
          guardado ||
          fetch(peticion).then((red) => {
            const copia = red.clone();
            void caches.open(CACHE).then((c) => c.put(peticion, copia));
            return red;
          }),
      ),
    );
    return;
  }

  // Resto: red primero (versión fresca) con la caché como respaldo.
  evento.respondWith(
    fetch(peticion)
      .then((red) => {
        const copia = red.clone();
        void caches.open(CACHE).then((c) => c.put(peticion, copia));
        return red;
      })
      .catch(() => caches.match(peticion).then((g) => g || caches.match(self.registration.scope))),
  );
});
