# Uploader — how it works

The uploader lets students publish their openFrameworks sketch to their own
GitHub account in a few clicks. **There is nothing for the teacher to set up** —
it's a static page with no server. Just share the link:

**https://maxfishman.github.io/OpenFrameworksTest/uploader/**

(There's also a "Publish your sketch" button on the demo page that links here.)

## What a student does

1. **Connect GitHub** — the page opens a pre-filled "new token" link on GitHub
   with the right permissions already ticked (`public_repo`, `workflow`). They
   click **Generate token**, copy it, and paste it in.
2. **Name the project** and **drop in their files** — a whole project folder, a
   `.zip`, or individual files. Code is sorted into `src/`, assets into
   `bin/data/`, automatically.
3. **Create my project** — the app makes a public repo on their account with
   their files plus the build workflow, turns on GitHub Pages, and starts the
   build. They get links to the build and their live site.

## About the token

- It's a standard GitHub **personal access token** with only `public_repo` and
  `workflow` scope. It is kept in the browser tab (`sessionStorage`) and sent
  only to `api.github.com` — never to any other server. Closing the tab forgets
  it; students can also delete it anytime at
  github.com/settings/tokens.
- Tell students to pick a short expiration (e.g. 7 days) when generating it.

## Notes

- **"Couldn't auto-enable Pages"** — if a student sees this at the end, the app
  shows a one-click link to the repo's Settings → Pages; they set Source to
  "GitHub Actions" and re-run the build. (Usually it enables automatically.)
- The workflow committed into each student repo is the current `web.yml` from
  this repo, bundled at build time, so everyone gets the latest build pipeline.
