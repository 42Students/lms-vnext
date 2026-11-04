# Browser-error telemetry: forwarded-IP trust hardening (2026-11-04)

**Scope:** only `POST /api/client-errors` and its optional secondary IP quota.  
**Canonical tracker:** `docs/tracker.json` remains authoritative; this dated packet is implementation evidence, not a status tracker or release sign-off.  
**Catalogue links:** SEC-17-013 (proxy header trust), SEC-08-015 (endpoint abuse limits), SEC-19-021 (privacy/minimization). These controls are **not closed** by this slice.

## Observed defect and change

Prior to this batch, when `TRUSTED_CLIENT_IP_HEADERS=true`, telemetry preferred `X-Real-IP` and otherwise took the *first* `X-Forwarded-For` hop. That position can be supplied by an untrusted caller. An attacker could choose the alleged IP used for telemetry's secondary per-IP budget. This did not by itself bypass the existing authenticated per-user quota.

The endpoint now uses `trustedClientErrorIp`, which reuses the shared authentication IP parser: it reads the **second-to-last hop** of the configured Google load-balancer chain, checks the rightmost proxy hop, canonicalizes IPv4/IPv6, and ignores both `X-Real-IP` and any spoofed leading values. Malformed, oversized, missing and single-hop chains produce `null`, omitting the optional IP quota while retaining the server-authenticated per-user quota. The trust feature remains disabled unless the deployment explicitly sets `TRUSTED_CLIENT_IP_HEADERS=true`.

### Commits on main

- `79aa9fef796b83dc15993141870079fe25f29cb6` — independent optional telemetry-IP parser.
- `ab8af1f4035899d3dfa964a73ab7ea025d6ec9a1` — route now uses the shared parser instead of caller-supplied header precedence.
- `3cb74089b7a4d649e71fe46c18ef456285883579` — six regression cases covering disabled trust, spoofed leading hops, forged `X-Real-IP`, missing/single-hop ingress, malformed hops, canonical IPv6 and large headers (nine individual assertions).

## Verification and limits

- **Executed:** nine isolated Node 22 cases using TypeScript-transpiled copies of the touched pure parser and the existing shared IP selection algorithm; **9/9 passed**. This is a developer smoke test, **not a repository Vitest run** or signed CI evidence.
- **Authored, not verified in repository CI:** `tests/unit/client-error-ip-security.test.ts`. The companion existing `tests/unit/auth-ip-rate-limit.test.ts` was not rerun. No complete `npm ci`, `npm run typecheck`, browser or deployed HTTP verification is claimed.
- **Required next proof:** on current `main`, run `npx vitest run tests/unit/client-error-ip-security.test.ts tests/unit/auth-ip-rate-limit.test.ts` plus TypeScript and affected CI, retaining an exact run URL.
- **Deployment prerequisite:** verify, using real ingress configuration and a staging request capture, that the application cannot be reached directly, that the load balancer appends the expected two trusted XFF hops, and that any extra ingress does not rewrite that chain. Without that network trust boundary, even right-side header parsing is not authoritative.
- **Residual:** rate buckets are process-local, so a shared edge/distributed limiter is still needed for multi-replica protection. The per-user quota is independent of client IP.

**Release verdict for this slice: PARTIAL source hardening, not production certified.**
