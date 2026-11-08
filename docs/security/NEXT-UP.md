# NEXT UP and PARKED (ask me: "next security tasks"), written 2026-11-08

## Parked: SEC-05 and SEC-06 (built, deployed to dev, checked by hand; do later)

Owner call 2026-11-08: both are treated as closed for the build. What is left is paperwork and proof, done later, in this order:

1. One CI run on main (new tests: tenant-pool callback regression, scope expiry, extended RLS acceptance, `security:central` guards).
2. Enter tracker evidence from that run (commit SHA + passing run URL) for the SEC-05 and SEC-06 controls.
3. Independent audit through the GPT lane (`audit-brief-2026-11-07.md`), then fix findings.
4. Production: nothing done there. Needs the same role split, policies and click-through, with the owner's own review.
5. Known residuals to carry: 33 tables intentionally unscoped (`table-classification.json`), `testa`/`testb` not routed to vNext on dev, nsrit host slow from outside, eight job routes not reviewed one by one.

## Next security tasks, most important first

| # | Task | Why now | Controls | Who |
|---|---|---|---|---|
| 1 | Missing secrets and rotation. The dev pod logs `config.secret_invalid MISSING` for AUTH_ROLE_PROOF_SECRET, AUTH_EMAIL_VERIFICATION_SECRET, TPO_RECRUITER_OTP_HMAC_SECRET, LOG_ALERT_ACCOUNT_HASH_KEY and three DB10 keys; rotate the GCP key and the prod DB password still open from 2026-11-03 | A missing signing or HMAC key silently weakens features that depend on it; the open keys are the largest real-world risk | SEC-09 | Owner for rotation, Claude for config |
| 2 | Gate 0: CI red on main, branch protection, second code owner, 2 Dependabot alerts | Nothing is trustworthy while CI is red and anyone can push to main | SEC-18 (002, 004), SEC-23 | Owner decides, GPT lanes fix |
| 3 | Privileged login: MFA for Super Admin and College Admin, step-up already exists for actions, account enumeration, recovery | Super Admin is the highest-value account; today it is two OTP codes | SEC-01, SEC-02 | Claude builds, GPT audits |
| 4 | Object-level authorization on the 1,086 service-enforced handlers: per-route permission names and cross-college tests on every method | Biggest code surface; RLS now backstops college isolation but not same-college role abuse | SEC-03, SEC-08 | GPT lanes (volume), Claude reviews |
| 5 | File uploads: private R2 bucket does not exist, no malware scanner | Documents (marksheets, IDs) are sensitive and currently unprotected | SEC-11, SEC-10 | Owner creates bucket, Claude builds scanner path |
| 6 | Audit trail and detection: central audit log of who did what, alerting on denied/step-up/scope events (the new `action.audit`, `admin_scope.audit` lines go nowhere yet) | Without it a breach cannot be seen or reconstructed | SEC-19, SEC-20 | Claude |
| 7 | Backup and recovery proof: restore test on a disposable copy, retention, RPO/RTO written down (no on-demand backups, owner rule) | Before any production customer | SEC-21 | Owner decision, Claude plan |
| 8 | Browser security: CSP blocks Google Fonts on every page (console), nonce-based scripts instead of `unsafe-inline` | Visible bug plus a weak policy | SEC-12 | Claude |
| 9 | Pen test and enterprise readiness pack | After 1 to 8 | SEC-24, SEC-25 | Owner decision |

Recommended start: 1 (small, unblocks several controls), then 3 and 4 in parallel, with 2 whenever the owner is ready to touch repository settings.

## Progress 2026-11-08 (autonomous run; owner items are in OWNER-ACTIONS.md)

Done: 1 dev secrets (17 generated, production readiness fails closed on missing ones), CSP font fix and nonce CSP verified on dev (flag `CSP_NONCE=on`), 6 durable audit trail (append-only table, wired into route(), actions, login, scope, internal denials; on dev), Gate 0 diagnosed, SEC-01/02/07/09/11/12/16/21 assessed, evidence docs for the unauthenticated sweep (533 GET and 782 mutating routes: no unauthenticated data), the cross-college API probe and the role-by-route matrix, which found and fixed a learner-readable staff dashboard and several 500-for-403 responses. Waiting on the owner: items 1 (rotation), 2 (repo settings), 5 (bucket and scanner), 7 (restore test). Still open for me: 3 privileged-login MFA design (needs decisions 8 and 9), 4 per-handler permission names (volume).

Later 2026-11-08: all 616 `uses:` lines in 224 workflows pinned to commit SHAs (SEC-18; Dependabot's github-actions ecosystem keeps them current); Gate 0 partly worked (unit failures 134 to about 95, lint errors fixed, see GATE0-CI-RED.md); role-route matrix script with committed baseline (`scripts/verify/role-route-matrix.mjs`, `docs/security/role-matrix-baseline.json`); personal data inventory (`data-inventory.md`); incident response runbook draft; SEC-15, SEC-17 assessments; audit anomaly tripwire; TPO companies route 400 instead of 500; `INBOUND_MAIL_HMAC_SECRET` and two more secrets now validated.

## Progress 2026-11-08 (evening, owner away, "do not stop till done")

- **Gate 0:** all 78 originally failing unit files and every originally failing integration file pass locally; the CI database job was replayed step by step on a local PostgreSQL; the `source-contracts` prototype contract, `ux:guard`, `ux:consistency` and `security:central` pass. Two real UI regressions were fixed on the way (mentor board sprint-group class, college placements all-drive total). Details and the LF-worktree recipe: `GATE0-CI-RED.md`.
- **Tracker draft:** `tracker-updates-pending.json` now maps 238 controls (area assessments mapped by hand in `scripts/security/area-mappings.json`). Merge only after a passing CI run: fill commit SHA and run URL, then `node scripts/tracker.mjs --check`.
- **Built:** new-device detection at sign-in (`auth.new_device` audit event, SEC-02-011); four platform-admin routes now name `admin-scope.select` centrally; CI step that scans the production build output for secrets (`scripts/security/scan-built-bundles.mjs`, SEC-09/12).
- **Still needs a deploy to dev to be seen there:** new-device event and the four route changes (images are built by GitHub Actions; deploy recipe in memory `deployment-approach`).
- **Remaining after CI is green:** tracker merge and checklist regeneration, independent audit, then the owner items in `OWNER-ACTIONS.md`.
