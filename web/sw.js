/*! openFrameworks web: a service worker that (1) adds the cross-origin-isolation
    headers SharedArrayBuffer/threads need (GitHub Pages can't), and (2) caches the
    sketch with a per-deploy version so it installs as a PWA and runs offline. */
const VERSION = "__SW_VERSION__";
const CACHE = "of-cache-" + VERSION;

if (typeof window === 'undefined') {
    // ---------- service worker side ----------
    function withCoi(response) {
        if (response.status === 0) return response;
        const h = new Headers(response.headers);
        h.set("Cross-Origin-Embedder-Policy", "require-corp");
        h.set("Cross-Origin-Resource-Policy", "cross-origin");
        h.set("Cross-Origin-Opener-Policy", "same-origin");
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
    }

    self.addEventListener("install", (event) => event.waitUntil((async () => {
        // precache the shell WITH the isolation headers so an offline navigation
        // is still cross-origin-isolated (SharedArrayBuffer works offline)
        try {
            const cache = await caches.open(CACHE);
            const r = await fetch("./", { cache: "reload" });
            if (r && r.status === 200) await cache.put("./", withCoi(r));
        } catch (e) { /* offline during install: ignore */ }
        await self.skipWaiting();
    })()));

    self.addEventListener("activate", (event) => event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith("of-cache-") && k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })()));

    self.addEventListener("fetch", (event) => {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") return;
        const url = new URL(r.url);
        const sameOriginGet = url.origin === self.location.origin && r.method === "GET";
        event.respondWith((async () => {
            // Navigations: cache-first on the precached shell (keeps headers + offline);
            // cache is busted on every deploy via VERSION, so updates still arrive.
            if (sameOriginGet && r.mode === "navigate") {
                const cache = await caches.open(CACHE);
                const hit = await cache.match(r) || await cache.match("./");
                if (hit) return hit;
                try { const resp = withCoi(await fetch(r)); if (resp.status !== 0) cache.put("./", resp.clone()); return resp; }
                catch (e) { return Response.error(); }
            }
            // Other same-origin assets: cache-first within this version (fast + offline).
            if (sameOriginGet) {
                const cache = await caches.open(CACHE);
                const hit = await cache.match(r);
                if (hit) return hit;
                try { const resp = withCoi(await fetch(r)); if (resp.status !== 0) cache.put(r, resp.clone()); return resp; }
                catch (e) { return Response.error(); }
            }
            // Cross-origin / non-GET: just add the headers.
            try { return withCoi(await fetch(r)); } catch (e) { return Response.error(); }
        })());
    });

} else {
    // ---------- page side: register, then reload once the SW controls the page ----------
    (() => {
        const n = navigator;
        if (!("serviceWorker" in n) || !window.isSecureContext) return;

        // Clear the one-shot reload guard whenever we land already isolated, so a future
        // deploy (new controller) can trigger exactly one more reload.
        if (window.crossOriginIsolated) sessionStorage.removeItem("ofswReloaded");

        // When the worker takes control (first install, or a new version activating),
        // reload so the served document carries the isolation headers.
        n.serviceWorker.addEventListener("controllerchange", () => {
            if (sessionStorage.getItem("ofswReloaded")) return;
            sessionStorage.setItem("ofswReloaded", "1");
            window.location.reload();
        });

        const src = (document.currentScript && document.currentScript.src) || "sw.js";
        n.serviceWorker.register(src).then((reg) => {
            // Backup nudge if a worker is already active but hasn't claimed us yet.
            if (!window.crossOriginIsolated && reg.active && !n.serviceWorker.controller && !sessionStorage.getItem("ofswReloaded")) {
                sessionStorage.setItem("ofswReloaded", "1");
                window.location.reload();
            }
        }).catch((e) => console.error("Service Worker registration failed:", e));
    })();
}
