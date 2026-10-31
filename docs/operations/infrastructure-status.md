# Infrastructure status (development)

Last reviewed 2026-10-14. Everything below runs on existing shared infrastructure; nothing new is billed.

## Runtime

| Piece | Where | Notes |
| --- | --- | --- |
| Web | Deployment `lms-vnext`, namespace `lms-dev-2026`, GKE `forty-two-prod` | Manifest: `deploy/k8s/dev/lms-vnext-deployment.yaml`. Non-root, read-only root filesystem, all capabilities dropped, seccomp default. 1 replica. |
| Database | Cloud SQL Postgres 14 `forty-two-prod-1`, database `lms_vnext` | Shared with the legacy dev app. Private IP only. |
| Sign-in retention | CronJob `vnext-auth-purge`, daily 02:47 IST | `deploy/k8s/dev/auth-purge-cronjob.yaml`; `npm run auth:purge`. Removes login challenges older than 1 day and dead sessions older than 30 days. |
| Network | `deploy/k8s/dev/lms-vnext-networkpolicy.yaml` | Only Google's load balancer ranges can reach the pod on 8080; a direct call from another pod in the namespace times out (tested 2026-10-14). The cluster runs Dataplane V2 so policies are enforced. |
| SMS / email | Exotel, ZeptoMail | Provider credentials must be injected via managed runtime secrets, never committed to Git. |
| Private files | Cloudflare R2 (see `docs/architecture/private-object-storage.md`) | **Bucket not created yet.** |

## Database safety (read-only check, 2026-10-14)

- Automated daily backups, last 7 kept, all recent ones successful.
- Point-in-time recovery on, 7 days of logs.
- Deletion protection on.
- Single zone (no failover), 1 vCPU / 3.75 GB shared with the legacy dev app, SSL not enforced (traffic is private-network only).
- A restore drill has not been run. A restore creates a billable clone, so it needs an explicit go-ahead.

## Security controls in place

- Same-origin (CSRF) guard on every state-changing route, enforced by `tests/unit/api-origin-guard.test.ts`.
- CSP, HSTS, frame, MIME and referrer headers (`src/security/headers.ts`); `no-store` on `/api/auth/*`.
- Sign-in: keyed-HMAC one-time codes, 5-minute life, shared 5-try budget, single use, send cap enforced under a per-contact lock, per-IP throttle.
- Platform administrators need both the SMS and the email code; they cannot sign in with a single factor.
- A college host serves only that college, on login and on every authenticated request, including the memberships API.
- Structured sign-in audit events (`auth-audit` component): started, succeeded (user id), rejected (reason code), with a hashed IP tag and no contacts or codes.
- No production dependency advisories (`npm audit --omit=dev`).

## Known gaps and decisions

1. **Private R2 bucket** — create `lms-vnext-private` (private, no public domain) or provide a token with bucket-create rights, then set `R2_PRIVATE_BUCKET`. The legacy bucket is public and is refused by the code.
2. **Malware scanner** — nothing calls `recordPrivateObjectScanVerdict` yet, so uploaded files stay pending and are never served (safe default).
3. **ZeptoMail credential** — independently verify key rotation and runtime-secret deployment before enabling production delivery.
4. **Account enumeration** — sign-in tells callers whether a contact is registered, suspended or an administrator (matches the legacy product). Switch to uniform responses if the policy changes.
5. **Send-cap lockout** — mitigated: a caller only exhausts their own per-requester budget. A coordinated attack from 2 or more addresses can still use the contact's overall 8 sends per 10 minutes.
6. **Per-IP request throttle is per process** — fine for 1 replica. Sign-in send caps are already database-enforced (per contact+requester 5, per contact 8, per address 20 per 10 minutes); move the remaining per-IP counters to the database before scaling out.
7. **Cluster API access** — the cluster only accepts approved IPs; the developer machine's address was added and must be removed when work ends.
8. **Custom college domains** — deferred. Plan Cloudflare for SaaS before about 8 custom-domain colleges (a Google load balancer holds at most 15 certificates and dev already uses 10).
