/* Minimal service worker for the uploader: installable PWA + offline shell.
   The GitHub API and token exchange always go to the network (never cached). */
const VERSION = "__SW_VERSION__";
const CACHE = "of-uploader-" + VERSION;

if (typeof window === 'undefined') {
    self.addEventListener("install", (event) => event.waitUntil((async () => {
        try { const c = await caches.open(CACHE); await c.add("./"); } catch (e) {}
        await self.skipWaiting();
    })()));

    self.addEventListener("activate", (event) => event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith("of-uploader-") && k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })()));

    self.addEventListener("fetch", (event) => {
        const r = event.request;
        const url = new URL(r.url);
        // only handle same-origin GETs; API calls to github.com pass straight through
        if (url.origin !== self.location.origin || r.method !== "GET") return;
        event.respondWith((async () => {
            const cache = await caches.open(CACHE);
            if (r.mode === "navigate") {
                try { const net = await fetch(r); cache.put("./", net.clone()); return net; }
                catch (e) { return (await cache.match("./")) || (await cache.match(r)) || Response.error(); }
            }
            const hit = await cache.match(r);
            if (hit) return hit;
            try { const net = await fetch(r); if (net && net.ok) cache.put(r, net.clone()); return net; }
            catch (e) { return Response.error(); }
        })());
    });

} else {
    if ("serviceWorker" in navigator && window.isSecureContext) {
        const src = (document.currentScript && document.currentScript.src) || "sw.js";
        navigator.serviceWorker.register(src).catch(function () {});
    }
}
