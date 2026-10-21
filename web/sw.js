/*! openFrameworks web: coi-serviceworker (v0.1.7 logic, MIT, Guido Zuidhof et al.)
    + versioned offline cache, so the sketch installs as a PWA and runs offline. */
let coepCredentialless = false;
const VERSION = "__SW_VERSION__";
const CACHE = "of-cache-" + VERSION;

if (typeof window === 'undefined') {
    // ---- service worker side ----
    self.addEventListener("install", (event) => event.waitUntil((async () => {
        // precache the app shell WITH the isolation headers, so an offline
        // navigation is cross-origin-isolated (SharedArrayBuffer works offline)
        try {
            const cache = await caches.open(CACHE);
            const resp = await fetch("./", { cache: "reload" });
            if (resp && resp.status === 200) await cache.put("./", withCoi(resp));
        } catch (e) { /* offline during install: ignore */ }
        await self.skipWaiting();
    })()));
    self.addEventListener("activate", (event) => event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k.startsWith("of-cache-") && k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })()));

    self.addEventListener("message", (ev) => {
        if (!ev.data) return;
        if (ev.data.type === "deregister") {
            self.registration.unregister()
                .then(() => self.clients.matchAll())
                .then(clients => clients.forEach(c => c.navigate(c.url)));
        } else if (ev.data.type === "coepCredentialless") {
            coepCredentialless = ev.data.value;
        }
    });

    // add the cross-origin-isolation headers that SharedArrayBuffer/threads need
    const withCoi = (response) => {
        if (response.status === 0) return response;
        const h = new Headers(response.headers);
        h.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
        if (!coepCredentialless) h.set("Cross-Origin-Resource-Policy", "cross-origin");
        h.set("Cross-Origin-Opener-Policy", "same-origin");
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: h });
    };

    self.addEventListener("fetch", function (event) {
        const r = event.request;
        if (r.cache === "only-if-cached" && r.mode !== "same-origin") return;
        const request = (coepCredentialless && r.mode === "no-cors")
            ? new Request(r, { credentials: "omit" }) : r;
        const url = new URL(r.url);
        const sameOriginGet = url.origin === self.location.origin && r.method === "GET";

        event.respondWith((async () => {
            // Same-origin assets: cache-first within this version (fast + offline).
            if (sameOriginGet && r.mode !== "navigate") {
                const cache = await caches.open(CACHE);
                const hit = await cache.match(r);
                if (hit) return hit;
                try {
                    const resp = withCoi(await fetch(request));
                    if (resp.status !== 0) cache.put(r, resp.clone());
                    return resp;
                } catch (e) { return Response.error(); }
            }
            // Navigations: cache-first on the precached shell (keeps the isolation
            // headers and works offline); the cache is busted on every deploy via
            // VERSION, so updates still arrive.
            if (sameOriginGet && r.mode === "navigate") {
                const cache = await caches.open(CACHE);
                const hit = await cache.match(r) || await cache.match("./");
                if (hit) return hit;
                try {
                    const resp = withCoi(await fetch(request));
                    if (resp.status !== 0) cache.put("./", resp.clone());
                    return resp;
                } catch (e) { return Response.error(); }
            }
            // Everything else (cross-origin / non-GET): just add the headers.
            try { return withCoi(await fetch(request)); }
            catch (e) { return Response.error(); }
        })());
    });

} else {
    // ---- page side: register this file as the service worker, reload once (coi logic) ----
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        const coepDegrading = (reloadedBySelf == "coepdegrade");

        const coi = {
            shouldRegister: () => !reloadedBySelf,
            shouldDeregister: () => false,
            coepCredentialless: () => true,
            coepDegrade: () => true,
            doReload: () => window.location.reload(),
            quiet: false,
            ...window.coi
        };

        const n = navigator;
        const controlling = n.serviceWorker && n.serviceWorker.controller;

        if (controlling && !window.crossOriginIsolated) {
            window.sessionStorage.setItem("coiCoepHasFailed", "true");
        }
        const coepHasFailed = window.sessionStorage.getItem("coiCoepHasFailed");

        if (controlling) {
            const reloadToDegrade = coi.coepDegrade() && !(coepDegrading || window.crossOriginIsolated);
            n.serviceWorker.controller.postMessage({
                type: "coepCredentialless",
                value: (reloadToDegrade || coepHasFailed && coi.coepDegrade()) ? false : coi.coepCredentialless(),
            });
            if (reloadToDegrade) {
                window.sessionStorage.setItem("coiReloadedBySelf", "coepdegrade");
                coi.doReload("coepdegrade");
            }
            if (coi.shouldDeregister()) {
                n.serviceWorker.controller.postMessage({ type: "deregister" });
            }
        }

        if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return;
        if (!window.isSecureContext) {
            !coi.quiet && console.log("COOP/COEP Service Worker not registered, a secure context is required.");
            return;
        }
        if (!n.serviceWorker) {
            !coi.quiet && console.error("COOP/COEP Service Worker not registered, perhaps due to private mode.");
            return;
        }

        n.serviceWorker.register(window.document.currentScript.src).then(
            (registration) => {
                !coi.quiet && console.log("COOP/COEP Service Worker registered", registration.scope);
                registration.addEventListener("updatefound", () => {
                    !coi.quiet && console.log("Reloading page to make use of updated COOP/COEP Service Worker.");
                    window.sessionStorage.setItem("coiReloadedBySelf", "updatefound");
                    coi.doReload();
                });
                if (registration.active && !n.serviceWorker.controller) {
                    !coi.quiet && console.log("Reloading page to make use of COOP/COEP Service Worker.");
                    window.sessionStorage.setItem("coiReloadedBySelf", "notcontrolling");
                    coi.doReload();
                }
            },
            (err) => { !coi.quiet && console.error("COOP/COEP Service Worker failed to register:", err); }
        );
    })();
}
