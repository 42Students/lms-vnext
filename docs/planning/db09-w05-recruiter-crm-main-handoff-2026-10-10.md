# W05 / Chat 5 — DB09 recruiter CRM continuation handoff

**Lane:** W05, GitHub issue #25.
**Code destination:** `42Students/lms-vnext@main`; all changes in this batch were committed directly to main.
**Legacy backend:** `42Students/lms@prod-2026 21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.
**Legacy frontend:** `42Students/lms2-fe@prod-2026 e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.
**Baseline main when W05 began:** `7a3da73d3598b5a208040c50789074492eb1d860`.

## This batch — source-backed implemented code

1. Extended `src/modules/placements/tpo-crm-validation.ts` with college-scoped lead update and exact duplicate-contact lookup validation. Identity fields (owner, role, invite hash, recruiter ID, manual stage) cannot be forged in an edit body. An explicit null clears one contact; omission preserves it.
2. Extended `src/modules/placements/tpo-crm-service.ts` with read/edit/check lead operations, locked per-lead update preserving at least one contact, database partial-unique violation classification, source reset, safe serialization excluding invite token hash, full follow-up list, newest-200 activity timeline, active-first follow-up ordering, and idempotent manual Contacted transition with system audit activity.
3. Added `GET /api/placements/tpo/leads/check`, `GET|PATCH /api/placements/tpo/leads/[leadId]`, `GET /api/placements/tpo/leads/[leadId]/follow-ups` and `POST /api/placements/tpo/leads/[leadId]/contacted`. Their handlers all remain behind `DB09_TPO_API_READY=DB09_VERIFIED`.
4. Added source-aware TPO recruiter lead Table/basic Board and detail routes (`/tpo/recruiters`, `/tpo/recruiters/[leadId]`) and a TPO navigation item. UI includes scoped server route guard, missing DB error, create/duplicate-preview, search and manual stage filter, edit, log activity, follow-up create/mark done, Not Now, Mark Contacted and empty/retry states.
5. Added Vitest input-validation and disposable PostgreSQL integration test cases for the new behaviors, contact race, tenant denial, timeline cap, follow-up priority and stage idempotency; expanded the migration-gate static suite to cover all new routes.
6. Updated four W05-owned rows of the shared UI matrix to PARTIAL (not DONE), updated TPO page checklist notes, and posted dependencies to W01/#21, W04/#24 and W06/#26.

**Scope note:** These are NOT equivalent to the full legacy `/tpo/recruiters` feature. Historical `/tpo/leads` labels in older docs should be treated as renamed/retired source paths only after a complete route redirect audit. Derived Invited/Joined/Drive Planned/Recruited states have intentionally **not** been faked. The UI uses only stored manual stages until DB08 and recruiter grants supply verified facts.

## Testing — distinguish authored from executed

- **Authored:** 4 new Zod validation tests, 6+ new isolated-PostgreSQL workflow/race/integrity scenarios (individual assertions exceed this count), updated static API migration-gate assertions.
- **Executed:** a 9-assertion static repository inspection using GitHub file contents; 9/9 passed for file presence, route gates, role guards and authored test markers. This is **not** TypeScript compilation, Vitest, PostgreSQL integration or browser evidence.
- **Not executed:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:db09:pg`, Playwright, desktop/mobile, GCP Cloud SQL replay.
- **CI:** GitHub Actions `verify` observed failing with no job-step logs (runner did not expose executed steps). No green assertions made.
- **Database parity:** DB09 has 31 source table candidates/279 field candidates; **0 of 279 semantic mappings runtime-verified**. Staged DB09 Drizzle modules exist, but their migration sequence remains W01-controlled and absent. Do not set `DB09_TPO_API_READY=DB09_VERIFIED` until all required migration and test checks pass.

## Adversarial risks / next W05 work

1. **W01 blocker:** register generated DB09 table migrations and schema registry with unique journal revision; replay on disposable Postgres; verify partial uniqueness and append-only/same-college triggers. Recheck active TPO membership **inside** the mutation transaction to close role-revocation TOCTOU. No W05 migration journal edits.
2. **Recruiter invitations:** add safe token issuance/rotation/expiry, preview (GET must not consume), one-time accept with concurrent CAS, no lead enumeration, existing recruiter pending acceptance, company/college trust, unsubscribed/not-now suppression. W05 owns protocol, W01 identity/account contract, W06 idempotent email delivery.
3. **Leads board/table:** exact derived status from access/drives/outcomes, owner/source/follow-up/quiet filters, export with privacy, saved views, Companies aggregate, company detail, bulk owner/stage/undo, invite and import preview/rollback. W04 supplies derived Drive/offer facts.
4. **TPO other non-drive pages:** Home/Needs You, Calendar, Students roster analytics (not applicant execution), Reports, Messages, Settings, Audit, Notifications presentation, Profile and More.
5. **HR non-drive pages:** Today, college chooser, calendar, messages, Company/Team, profile, invite acceptance and reports; verify scoped recruiter capabilities and revoke status.
6. **UI safety:** browser testing for modal focus trapping and Esc, mobile/responsive, stale refresh vs hard error, change of active college while form is open, 503 release gate, user-facing duplicate errors and timezone conversion of scheduled follow-up.
7. **Performance:** paginated database search instead of loading all recruiter leads, followed by query-backed filters/aggregates and streaming bounded lists.
8. **Data source ledger:** review remaining DB09 source candidate fields and mark semantic mapping verified only after matching live vNext behavior, constraint and producer/consumer test evidence.

## Ownership guardrails

W01 owns `drizzle/**`, `src/db/schema/index.ts`, common auth/tenant context, CI and GCP infra. W04 owns DB08 placement Drive/job/application/offer. W06 owns shared notification outbox/SMS delivery. W05 owns recruiter CRM and non-Drive TPO/HR UI; no overlapping direct code edits.

## Next immediate W05 item

Implement **recruiter invitation lifecycle** with source-backed privacy and one-time-token race protections, alongside isolation tests; first resolve identity grant and shared notification delivery contracts with W01/W06. In parallel, implement recruiter lead stage/owner persistence and UI partial gaps without crossing W04 Drive ownership.


## Additional W05 invite-policy batch

Committed `src/modules/placements/tpo-recruiter-invite-policy.ts` and
`tests/unit/tpo-recruiter-invite-policy.test.ts`. The policy now implements
cryptographically random 32-byte base64url tokens, SHA-256 hash-only persistence
contract, constant-time hash equality, 7-day expiry, rotation invalidating prior
links, blocked joined/unsubscribed/Not-Now leads, identical public INVALID
errors, and eligible day-four reminder rules. The companion tests are **authored
but not executed**. There is **no public issue/preview/accept API** and no
recruiter grant mutation yet; keep invite UI disabled until W01 identity
agreement, DB09 migration and W06 transport/outbox coordination. Two safety
deviations from the inspected legacy are explicit: a Not-Now lead cannot
receive a newly minted token (legacy generated a link that preview would
reject); validity ends exactly at expiration rather than allowing the single
boundary instant. Both fail closed.


## Authored browser tests (after initial handoff)

`tests/e2e/tpo-recruiter-crm.spec.ts` contains three Playwright
scenarios using seeded TPO membership: migration-closed 503 state
(no false empty list), mocked list+board+duplicate-warning/disabled create,
and mocked detail timeline + manual Contacted action refresh.
**These tests were not executed**. They require `E2E_AUTH_SECRET`,
authenticated seed accounts, a Next web server, and Chromium.
Mocked browser data proves UI state handling only; production DB09
schema, authorization, and invite acceptance still need true end-to-end
tests after migrations. Keep `docs/parity/tpo.md` closure checkboxes open.
