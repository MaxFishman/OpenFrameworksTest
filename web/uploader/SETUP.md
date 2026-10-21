# Uploader setup (one-time, by the teacher)

The uploader lets students sign in with GitHub and publish their openFrameworks
sketch with one click. It needs three things wired up once. Budget ~15 minutes.

The pieces:

```
student's browser ──(login code)──▶  Cloudflare Worker  ──▶ GitHub (swaps code for token)
   (uploader page)  ◀──(token)──────  (holds the secret)
   then calls the GitHub API directly to create the repo + commit files
```

You need: a GitHub account (the course account is fine) and a free Cloudflare
account (for the Worker).

---

## Step 1 — Register a GitHub OAuth App

1. Go to **https://github.com/settings/developers → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** `openFrameworks Uploader` (anything)
   - **Homepage URL:** `https://maxfishman.github.io/OpenFrameworksTest/uploader/`
   - **Authorization callback URL:** `https://maxfishman.github.io/OpenFrameworksTest/uploader/`
     (must match exactly — same URL as the homepage)
3. Click **Register application**.
4. Copy the **Client ID**.
5. Click **Generate a new client secret**, copy it now (you won't see it again).

---

## Step 2 — Deploy the token-exchange Worker (Cloudflare)

From the `oauth-proxy/` folder:

```bash
npm install -g wrangler        # once
cd oauth-proxy
wrangler login                 # opens the browser

# set the public values (or edit wrangler.toml):
#   CLIENT_ID      -> the Client ID from step 1
#   ALLOWED_ORIGIN -> https://maxfishman.github.io   (origin only, no path)
# edit wrangler.toml now, then:

wrangler secret put CLIENT_SECRET      # paste the client secret from step 1
wrangler deploy
```

`wrangler deploy` prints your Worker URL, e.g.
`https://of-oauth.yourname.workers.dev`. Copy it.

> Any host that runs a tiny serverless function works (Vercel, Netlify, Deno
> Deploy). The Worker is ~40 lines in `oauth-proxy/worker.js` if you prefer to
> port it.

---

## Step 3 — Point the uploader at your app + Worker

Edit **`web/uploader/index.html`**, find the `CONFIG` block near the bottom, and set:

```js
const CONFIG = {
  CLIENT_ID: "<Client ID from step 1>",
  PROXY_URL: "<Worker URL from step 2>",   // no trailing slash
  SCOPES: "public_repo workflow",
};
```

Commit and push to `main`. The build publishes the uploader to
**https://maxfishman.github.io/OpenFrameworksTest/uploader/** — share that link
with students.

---

## How students use it

1. Open the uploader link → **Sign in with GitHub** (they approve once).
2. Name the project, drag in their `src/` files (and any `bin/data/` assets).
3. **Create my project** → they get links to the build and their live site.

Behind the scenes the app creates a public repo on *their* account containing
their files plus the current `web.yml`, enables Pages, and the build publishes
their sketch — exactly like this repo.

---

## Notes & troubleshooting

- **Permissions requested:** `public_repo` (create/push public repos) and
  `workflow` (commit the `.github/workflows/web.yml` file). Nothing private.
- **Tokens** live only in the student's browser `sessionStorage` and are sent
  only to GitHub and your Worker — never stored anywhere else.
- **"GitHub blocked the workflow file"** → the `workflow` scope wasn't granted;
  the student should sign out and back in.
- **Pages didn't enable** → rare timing issue; the student can turn it on under
  their repo's Settings → Pages → Source: GitHub Actions, then re-run the build.
- **Changing the uploader URL** (e.g. a different repo) means updating the OAuth
  App's callback URL and `ALLOWED_ORIGIN` to match.
