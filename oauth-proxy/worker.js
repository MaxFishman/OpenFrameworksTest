/**
 * GitHub OAuth token-exchange proxy for the openFrameworks web uploader.
 *
 * The browser app sends the ?code it got from GitHub; this worker swaps it for
 * an access token using the OAuth App's client_secret (which must never live in
 * the browser). Deploy once — see oauth-proxy/README.md.
 *
 * Secrets / vars (set via `wrangler secret put` / wrangler.toml [vars]):
 *   CLIENT_ID       - OAuth App client id (also hard-coded in the frontend; fine)
 *   CLIENT_SECRET   - OAuth App client secret  (SECRET)
 *   ALLOWED_ORIGIN  - exact origin of the uploader page, e.g.
 *                     https://maxfishman.github.io  (no path, no trailing slash)
 */
export default {
  async fetch(request, env) {
    const allow = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": allow,
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, cors);

    const code = new URL(request.url).searchParams.get("code");
    if (!code) return json({ error: "missing_code" }, 400, cors);
    if (!env.CLIENT_ID || !env.CLIENT_SECRET) return json({ error: "server_not_configured" }, 500, cors);

    let data;
    try {
      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, code }),
      });
      data = await r.json();
    } catch (e) {
      return json({ error: "exchange_failed", error_description: String(e) }, 502, cors);
    }
    // Pass through only what the client needs; never echo the secret.
    return json(
      { access_token: data.access_token, token_type: data.token_type,
        scope: data.scope, error: data.error, error_description: data.error_description },
      data.access_token ? 200 : 400, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
