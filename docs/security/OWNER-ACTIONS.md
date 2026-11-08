# OWNER ACTIONS: what is waiting for you (ask me: "owner actions"), 2026-11-08

Everything else on the security list that does not need you is done or running (see `NEXT-UP.md`). Each line says what to do and why it is yours.

## Credentials and money (only you can do these)

1. **Rotate the GCP key `a9dd3b20eb41` and the production DB password** (open since 2026-11-03).
2. **New ZeptoMail token** (the old one was revoked; email delivery is off everywhere until a new one exists), set as `ZEPTOMAIL_TOKEN` in `vnext-integrations`.
3. **Create the private R2 bucket `lms-vnext-private`** and set `R2_PRIVATE_BUCKET` (uploads answer `STORAGE_NOT_CONFIGURED` without it) and decide the malware scanner: ClamAV in the cluster (about 1 GB memory) or a hosted one (SEC-11).
4. **Cloud SQL: require SSL** (`ssl_mode=ENCRYPTED_ONLY`) on instance `forty-two-prod-1`; the client then needs the server CA (SEC-07-006).
5. **Restore test budget**: one restore into a disposable Cloud SQL instance and RPO/RTO targets (SEC-21). I will not create billable resources.

## Repository settings

6. **Branch protection on main and a second code owner** (SEC-18-002, SEC-18-004); the ruleset is disabled by you since 2026-11-05.
7. **CI red on main (Gate 0)**: diagnosed in `GATE0-CI-RED.md` for the GPT lanes (about 300 tests use two-role actors since the one-role rule). Needs lane time, not a decision.

## Product decisions I should not make for you

8. **Account enumeration at sign-in** (SEC-01-003): unknown contacts get 404 `NOT_REGISTERED`; the secure answer is the same "code sent" for everyone, at the cost of typo users waiting for a code. Today it matches the old LMS wording.
9. **Session policy**: shorter lifetimes for College Admin and TPO (Super Admin already 30 min idle, 8 h absolute); new-device alerts; bind a session to a device (SEC-02-005, 011, 012).
10. **HSTS `includeSubDomains` and preload** on the production domain (affects the legacy subdomains) (SEC-12).
11. **Block `/api/internal/*` from the public internet at the ingress** (needs an ingress change; today they answer 403 without the secret) (SEC-16).
12. **Audit trail retention** (proposal: 400 days online, then cold storage) (SEC-19).
13. **Pen test** timing and scope (SEC-24).

## Production (nothing from this program has touched it)

14. Production needs, with your own review and not from automation: the role split (`role-split.sql` steps), migrations 0333 to 0341, the 17 generated secrets, `DB_TENANT_SCOPE`, `SECURITY_SHARED_STORE`, `SECURITY_AUDIT_DB`, `PGOPTIONS=-c app.rls_mode=enforce`, then the click-through and sweeps that were run on dev.

## Parked proof work (SEC-05 and SEC-06)

15. One CI run on main, tracker evidence from it, and the independent GPT audit (`audit-brief-2026-11-07.md`).

## Added later 2026-11-08

16. **Is the NSRIT data on dev real?** The vNext dev database holds NSRIT (154 members) loaded from the legacy LMS dev database. If those are real students, dev needs production-grade protection and a data-processing basis, or the data should be replaced with synthetic data (SEC-10-016, SEC-22).
17. **Key rotation rules** for the outbound encryption key (rotation strands sealed payloads until key versions exist): decide whether to schedule versioning work (SEC-10-015).

## Added evening 2026-11-08

18. **Package DB19-P28 conflict.** `docs/tracker.json` marks package DB19-P28 and its parent DB-019 as done, while `tests/db019-p28-tracker-field-review.test.mjs` insists both are not done (the field review is still `PENDING`). Whoever owns the DB-019 package must decide which is right and change the other; the workflow "DB19-P28 tracker privacy, race and registered PostgreSQL acceptance" stays red until then.
19. **Optional new secret `COMPANY_SHARE_PROOF_SECRET`** (32+ characters, distinct from every other secret). Company share access proofs now use it when set and fall back to `AUTH_SECRET` otherwise, so nothing breaks if you skip it, but one leaked session secret would still also forge share proofs until you add it to the `vnext-keys` secret.
20. **After CI is green on main:** run `node scripts/security/merge-tracker-pending.cjs --sha <commit> --run-url <actions run url>` (dry run first; add `--apply` to write) to move 219 assessed controls into the tracker. It can never produce VERIFIED. Verification still needs the independent review.

## Added late 2026-11-08

21. **Turn on replay protection for machine routes when the callers are ready:** set `INTERNAL_REPLAY_PROTECTION=on` only after every scheduler and worker sends `x-lms-timestamp` (epoch seconds) and a one-time `x-lms-nonce` (16 to 64 URL-safe characters). The code is built and tested (`src/security/internal-route-core.ts`); the switch is off, so nothing changes today. Nothing in the cluster calls these routes on dev yet.
22. **Publish a security contact (SEC-24-013):** a `/.well-known/security.txt` needs an address you monitor. I did not invent one. Tell me the address and I add the file.
23. **Egress policy for production:** `deploy/k8s/dev/lms-vnext-egress-policy.yaml` is applied and checked on dev (database, DNS and public HTTPS only; metadata server and private ranges blocked). Production needs the same file with its own database address and your own review.
24. **Proof CI runs:** another lane pushes to main every few seconds, and each push cancels the pending CI run before it starts. To prove a commit, push it to a branch and run `gh workflow run ci.yml --ref <branch>`; that branch has its own concurrency group.
