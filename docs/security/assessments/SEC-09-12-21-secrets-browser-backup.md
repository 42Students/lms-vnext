# SEC-09 secrets, SEC-12 browser, SEC-21 backup and recovery: assessment (2026-11-08)

Method: code read, dev pod logs, response headers read from the dev app, project memory of the Cloud SQL settings (2026-10-14). Nothing is VERIFIED.

## SEC-09 secrets and keys

| Fact | Evidence |
|---|---|
| One registry names every machine secret and key (18) with kind, length and distinctness rules; startup logs `config.secret_invalid` with the name only | `src/security/secret-registry.ts`, `src/instrumentation.ts` |
| Dev was missing 17 of 18 (everything except `AUTH_SECRET`); fixed 2026-11-08 with generated values in secret `vnext-keys` (names and lengths only were printed); pod logs now show zero invalid secrets | kubectl, pod log |
| Production readiness now FAILS CLOSED: with `APP_ENV=production` a missing or weak required secret makes `/ready` answer 503 `configuration: "invalid"`, so a rolling update keeps the old healthy replicas and a bad config never takes traffic (names are logged, not returned). Unit test `tests/unit/readiness.test.ts` | `src/modules/system/readiness-runtime.ts` |
| CI rejects committed credentials and credential artifacts (workflows "no new committed credentials", "reject committed credential artifacts", both green) | GitHub Actions |
| Secrets live in Kubernetes Secrets (`vnext-db`, `vnext-db-migrator`, `vnext-auth`, `vnext-keys`, `vnext-integrations`); never in git; not printed | cluster |
| Open, owner-only: rotate the GCP key `a9dd3b20eb41` and the production DB password (from 2026-11-03); ZeptoMail token was revoked (email delivery is off until a new one exists); the R2 key is the legacy object-scoped key | memory `secrets-status-2026-11-03` |
| Not done: rotation runbook per secret, a rotation test, a scheduled age report. Rotating `AUTH_SECRET` signs everyone out; rotating `DB10_OUTBOUND_ENCRYPTION_KEY_BASE64` needs re-encryption of sealed payloads (no key versioning yet) | code read |

Proposed: SEC-09 registry and fail-closed config IMPLEMENTED_UNVERIFIED; rotation and key versioning GAP.

## SEC-12 browser and frontend

Headers on every dev response (read 2026-11-07): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` (camera, microphone, geolocation, payment, usb denied), `Strict-Transport-Security: max-age=31536000`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `X-Permitted-Cross-Domain-Policies: none`, `Content-Security-Policy` (`default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'`, `font-src 'self' data:`).

- Fixed 2026-11-08: the CSP blocked a Google Fonts import on every page (console error); the import is removed (it was already blocked, so nothing looked different).
- Built, off by default: nonce-based script policy (`CSP_NONCE=on`, `src/proxy.ts`, `buildContentSecurityPolicy`). Removes the practical effect of `'unsafe-inline'` for scripts. Must be checked in a browser on statically rendered pages before it is switched on anywhere.
- Gaps: `style-src 'unsafe-inline'`; no `includeSubDomains` or preload on HSTS (owner decision, it affects the legacy subdomains of the production domain); no Trusted Types; no `Cross-Origin-Resource-Policy`; no subresource integrity (nothing third-party is loaded except the YouTube iframe API).
- Cookies: `HttpOnly`, `Secure` in production, `SameSite=lax` (see SEC-02).

## SEC-21 backup and recovery

Known (Cloud SQL `forty-two-prod-1`, recorded 2026-10-14): automatic daily backups, 7-day point-in-time recovery, deletion protection on, single zone, SSL not required. Rule from the owner: no on-demand backups (cost). Not known and not done: a restore test into a disposable instance (costs money, owner decision), RPO and RTO targets, retention for audit rows (`security_audit_events` has none yet), a documented recovery runbook, and a backup of object storage (R2). The vNext dev database is a separate database on the same instance.

Proposed: SEC-21 PARTIAL (backups exist, nothing proved). Owner decisions: restore test budget, RPO/RTO, SSL enforcement on the instance (also SEC-07-006).
