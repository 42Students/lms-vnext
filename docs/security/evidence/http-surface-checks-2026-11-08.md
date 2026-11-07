# HTTP surface checks on dev, 2026-11-08 (SEC-02-014, SEC-12, SEC-15)

Manual evidence from the signed-in browser and curl, dev only.

- **Caching:** authenticated pages (`/dashboard`) and the login page answer `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`; API responses answer `private, no-store, max-age=0` plus `Cross-Origin-Resource-Policy: same-origin`. After logout the browser has nothing cacheable to show.
- **CORS:** an `OPTIONS` preflight from `https://evil.example` to `/api/colleges` returns 204 with no `Access-Control-Allow-Origin` (cross-origin pages cannot read responses); `connect-src 'self'` stops the app itself from calling other origins.
- **Content-Security-Policy with nonce (flag `CSP_NONCE=on`):** `/login`, `/home`, `/enterprises`, `/privacy-policy` and the signed-in dashboard load, hydrate and show no CSP violations; every inline script carries the request nonce (JSON-LD blocks are data); the three scripts without a nonce are chunks loaded by trusted scripts (`strict-dynamic`).
- **Secrets in the browser bundle:** the 14 scripts of `/privacy-policy` (672 KB) contain none of: AWS key ids, PEM private keys, the names of the registry secrets, `postgres://` URLs, JWT-shaped strings, the database subnet (`10.180.`). Only one page's bundle was scanned; scan the build output in CI for full coverage.
- **Open redirect:** `safeReturnTo` accepts only same-origin absolute paths (rejects `//`, backslashes, `/api/`, `/login`, `/`); read, not exercised.
- **Test harness routes:** `/e2e/*` answered 200 with a loading shell on the production build; now 404 in any production build (proxy rule).
- **Internal routes:** reachable from the internet, 403 without the secret (see SEC-16 assessment).
