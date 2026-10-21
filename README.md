# openFrameworks → Web (WebAssembly) on GitHub Pages

You write normal openFrameworks C++. You push to GitHub. A few minutes later your
sketch is running in the browser at a public URL. No local toolchain, no manual build.

**Live demo:** https://maxfishman.github.io/OpenFrameworksTest/

---

## Table of contents

1. [How it works (the big picture)](#how-it-works-the-big-picture)
2. [What's in this repo](#whats-in-this-repo)
3. [Quick start: convert your own project](#quick-start-convert-your-own-project)
4. [Enabling GitHub Pages (one-time)](#enabling-github-pages-one-time)
5. [Controls in the demo](#controls-in-the-demo)
6. [Writing code that works on the web](#writing-code-that-works-on-the-web)
7. [What the workflow does, step by step](#what-the-workflow-does-step-by-step)
8. [Troubleshooting](#troubleshooting)
9. [Advanced: addons, pinning versions, caching](#advanced-addons-pinning-versions-caching)
10. [FAQ](#faq)

---

## How it works (the big picture)

Normally, building an openFrameworks app for the web means installing Emscripten,
downloading openFrameworks, compiling the whole framework, and then compiling your
sketch — all on your own machine. That's a lot of setup.

Instead, this repo hands all of that to a **GitHub Actions workflow** — a script that
GitHub runs for you on its own servers:

```
you push C++ to GitHub
        │
        ▼
GitHub Actions runs .github/workflows/web.yml
        │
        ├─ downloads openFrameworks 0.12.1
        ├─ starts the Emscripten compiler (in Docker)
        ├─ compiles openFrameworks for the web
        ├─ drops YOUR src/ into an openFrameworks project
        ├─ compiles your sketch → WebAssembly (.wasm) + JavaScript + HTML
        └─ publishes the result to GitHub Pages
        │
        ▼
your sketch is live at https://<you>.github.io/<repo>/
```

The only files **you** maintain are your source code in `src/` (and optional assets in
`bin/data/`). The workflow supplies everything else.

---

## What's in this repo

```
.
├── .github/
│   └── workflows/
│       └── web.yml        ← the build-and-deploy workflow (the important part)
├── src/
│   ├── main.cpp           ← creates the window and starts the app
│   ├── ofApp.h / ofApp.cpp← your sketch (setup / draw / input)
│   └── mover.hpp / mover.cpp ← a helper class used by the demo
└── README.md              ← you are here
```

That's it — there is **no** `bin/`, no openFrameworks copy, no Makefile in the repo.
The workflow adds those during the build so you never commit them.

---

## Quick start: convert your own project

There are two easy ways to get the workflow into your own project.

### Option A — Use this repo as a template (recommended)

1. On this repo's GitHub page, click **“Use this template” → “Create a new repository.”**
   (If that button isn't available, just fork it, or use Option B.)
2. Clone your new repo, delete the demo code in `src/`, and drop in **your own**
   `src/` files (`main.cpp`, `ofApp.h`, `ofApp.cpp`, plus any other classes).
3. If your sketch loads images, fonts, sounds, etc., put them in `bin/data/`
   (create the folder if it doesn't exist).
4. Commit and push to the `main` branch.
5. Do the [one-time Pages setup](#enabling-github-pages-one-time).
6. Wait for the build (watch the **Actions** tab). When it's green, open your site.

### Option B — Add the workflow to an existing repo

1. Copy the single file `.github/workflows/web.yml` from this repo into the **same
   path** in your repo.
2. Make sure your C++ lives in a top-level `src/` folder and assets (if any) in
   `bin/data/`.
3. Commit, push to `main`, then do the [Pages setup](#enabling-github-pages-one-time).

> **Important:** your project must follow the standard openFrameworks layout —
> `src/` for code, `bin/data/` for assets. The workflow looks for exactly those
> folders. Don't commit your own `bin/`, `obj/`, Makefiles, or an openFrameworks copy.

---

## Enabling GitHub Pages (one-time)

The workflow builds your page on every push, but GitHub won't _publish_ it until you
turn Pages on and point it at GitHub Actions. Do this once per repo:

1. Go to your repo → **Settings** → **Pages**.
2. Under **“Build and deployment” → “Source,”** choose **“GitHub Actions.”**
3. That's it. Push again (or re-run the workflow) and it will deploy.

Your site will be at:

```
https://<your-github-username>.github.io/<your-repo-name>/
```

> The **first** time you visit, the page may reload itself once. That's normal — see
> [“Why does the page reload once?”](#faq).

---

## Controls in the demo

| Key / action            | What it does                                  |
| ----------------------- | --------------------------------------------- |
| **`f`**                 | Toggle fullscreen                             |
| **“Fullscreen” button** | Same as `f` (built into the page)             |
| **`r`**                 | Restart the sketch (re-randomizes the movers) |

Fullscreen in the browser has to be triggered by a real user action (a key press or
click) and routed through Emscripten — you can't force it from code at startup.
See `ofApp::toggleFullscreen()` in `src/ofApp.cpp` for how the `f` key does it.

---

## Writing code that works on the web

Most openFrameworks code “just works,” but the web is not a desktop. Keep these in
mind:

- **Target openFrameworks 0.12.1.** That's the version the workflow downloads. Code
  that relies on newer or older APIs may not compile. (You can change the version —
  see [Advanced](#advanced-addons-pinning-versions-caching).)
- **Window setup.** `src/main.cpp` uses `ofGLWindowSettings` and starts in
  `OF_WINDOW` mode. That's correct for the web. Desktop-only window features
  (multi-monitor, native fullscreen at launch) don't translate directly.
- **Fullscreen.** Use a key/click to toggle it. This repo wires `f` and the page's
  **Fullscreen** button; both scale the canvas to fill the screen.
- **File loading is relative to `bin/data/`.** Put assets there and load them with
  plain relative paths, e.g. `img.load("photo.png")`.
- **No blocking / no threads-by-default.** Don't write infinite loops or block the
  main thread — the browser needs to breathe each frame. (openFrameworks' threaded
  features need special headers; this workflow already adds them, see below.)
- **Resizing.** The browser canvas can change size. The demo handles
  `windowResized()` by re-allocating its FBO — a good pattern to copy.

---

## What the workflow does, step by step

This is `.github/workflows/web.yml` in plain English. You don't need to understand
every line to use it, but it helps when debugging.

1. **Trigger.** Runs on every push to `main`, and can be run manually from the
   **Actions** tab (“Run workflow”).
2. **Get your sketch.** Checks out your repo into a folder called `sketch/`.
3. **Get openFrameworks 0.12.1.** Clones the framework into `of/`.
4. **Download the web libraries.** openFrameworks ships prebuilt web dependencies;
   this fetches them.
5. **Start Emscripten.** Launches the `emscripten/emsdk:4.0.4` compiler inside Docker.
6. **Build openFrameworks for the web.** Compiles the whole framework once (this is
   the slowest step).
7. **Set up your project.** Copies your `src/` and `bin/data/` into an openFrameworks
   app folder, and adds the standard web `Makefile`/`config.make`. It also:
   - drops a tiny placeholder file into `bin/data/` (the packager errors on a
     completely empty data folder);
   - adds a small `reallocarray` compatibility shim (this Emscripten version omits a
     function the prebuilt libraries expect).
8. **Build your sketch.** Compiles your code to `.wasm` + `.js` + `.html`.
9. **Make it work on GitHub Pages.** openFrameworks web builds use threads, which
   need special HTTP headers (`SharedArrayBuffer`). GitHub Pages can't send those, so
   the workflow adds [`coi-serviceworker`](https://github.com/gzuidhof/coi-serviceworker)
   to supply them in the browser. It also injects a small CSS rule so fullscreen
   actually fills the screen.
10. **Package & deploy.** Uploads the finished page and publishes it to GitHub Pages.

The final page lives (inside the build) at
`of/apps/myApps/sketch/bin/em/sketch/` — useful to know if you read the build logs.

---

## Troubleshooting

Open the **Actions** tab, click the failing run, and read the logs — the error is
almost always in the **“Build the sketch for the web”** step.

| Symptom                                            | Likely cause & fix                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Build fails with C++ compile errors**            | A bug in _your_ `src/` code, or an API that doesn't exist in oF 0.12.1. Fix the code the compiler points at.                             |
| **Build fails, but compiles fine on your desktop** | You're probably on a different openFrameworks version locally. Match 0.12.1, or pin the workflow to your version (see Advanced).         |
| **Page is blank / stuck on “Downloading…”**        | Open the browser's **developer console** (F12) for the real error. Often a missing asset path or a crash in `setup()`.                   |
| **Assets (images/fonts/sounds) don't load**        | They must be in `bin/data/` and loaded with relative paths. Confirm the file is committed and the name/case matches exactly.             |
| **Fullscreen does nothing**                        | It must be triggered by a key/click (try `f` or the button), not called automatically. If you customized this, see `toggleFullscreen()`. |
| **Deploy step fails**                              | GitHub Pages isn't enabled, or isn't set to “GitHub Actions.” Do the [one-time setup](#enabling-github-pages-one-time).                  |
| **Page reloads itself once on first visit**        | Expected — `coi-serviceworker` installs, then reloads so the threading headers apply.                                                    |
| **Addons don't work**                              | The workflow doesn't copy `addons.make` by default. See Advanced.                                                                        |
| **Build takes ~10–15 minutes**                     | Normal — it compiles all of openFrameworks from scratch each run. See caching in Advanced.                                               |

---

## Advanced: addons, pinning versions, caching

You only need this section if you're pushing past the basics.

### Using addons

The default workflow copies your `src/` and `bin/data/` but **not** an `addons.make`
file, so addon-based projects won't build as-is. `ofxEmscripten` (the web windowing
addon) is included automatically; other addons require changes:

1. Make sure the addon source is available to the build (commit it into the repo, or
   add a step that clones it into `of/addons/`).
2. In the **“Set up the sketch project”** step of `web.yml`, also copy your
   `addons.make`:
   ```yaml
   if [ -f sketch/addons.make ]; then cp sketch/addons.make of/apps/myApps/sketch/; fi
   ```
3. Note that **not all desktop addons work on the web** (anything using native
   system APIs, certain hardware, etc.). Test and expect some to be unsupported.

### Pinning / changing the openFrameworks version

The version is set in the **“Get openFrameworks …”** step:

```yaml
git clone --depth 1 --branch 0.12.1 https://github.com/openframeworks/openFrameworks.git of
```

Change `0.12.1` to another release tag to match the version you develop against. Keep
the Emscripten image (`emscripten/emsdk:4.0.4`) compatible with it.

### Speeding up builds with caching

Every run rebuilds openFrameworks from scratch, which is slow. For a class with many
students, you can add [`actions/cache`](https://github.com/actions/cache) to cache the
compiled framework between runs. This is optional and a nice exercise once you're
comfortable with the basics.

---

## FAQ

**Do I need to install anything on my computer?**
No. You can edit files directly on GitHub if you want. For comfortable local
development, install openFrameworks 0.12.1 and use your normal IDE — but the _web_
build only ever happens on GitHub's servers.

**Can I test locally before pushing?**
You can run your sketch as a normal desktop openFrameworks app locally. The web build
is produced by the workflow; there's no separate local web step in this setup.

**Why does the page reload once?**
openFrameworks web builds use threads, which the browser only allows with special
security headers. GitHub Pages can't send them, so a tiny helper
(`coi-serviceworker`) installs itself and reloads the page so the headers take effect.
It only happens on the first load.

**Is my sketch public?**
If your repo is public and Pages is on, anyone with the URL can view it. For a private
repo, GitHub Pages deployment requires a paid GitHub plan.

**Where do I change the window size?**
In `src/main.cpp`: `settings.setSize(1024, 768);`. On the web the canvas is then
scaled to fit the page / fullscreen.

**How long until my changes are live?**
A full build is roughly 10–15 minutes, plus a short propagation delay after deploy.
Watch the **Actions** tab for progress.

---

Happy sketching — push some C++ and watch it run in a browser. 🎨
