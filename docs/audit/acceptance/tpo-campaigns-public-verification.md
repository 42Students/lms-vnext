# TPO campaigns-public

## Chat-2 gap closure current round

| ID | Status | Evidence |
|---|---|---|
| TPO-campaigns-public-09 | DONE (source, tests not run) | Bad batch IDs cause Next.js 404 before Zod parse/DB access, in `campaigns/[batchId]/page.tsx`. Named test `tests/unit/chat2-campaign-history-routes.test.ts`. |
| TPO-campaigns-public-10 | PARTIAL — OPEN | Emails title, truthful empty message, sent/skipped labels in `campaigns/page.tsx`. Delivery receipt vs successful delivery semantics remain explicit, and other copy gaps remain. Named unit test in same file. |

| TPO-campaigns-public-24 | DONE (source, unrun) | `PublicJoinPreviewRetry` now says exact "We couldn't load this page" and Retry; invalid link remains distinct. Named `tests/unit/chat2-public-join-states.test.ts`. |
| TPO-campaigns-public-30 | DONE (source, unrun) | Company join route shares verified distinct error/retry state, plus success/invalid copy; named test. |
| TPO-campaigns-public-R03 | DONE (source, unrun) | ALREADY_JOINED uses "You already have access to {college}", server `signInEmail` preserved; named test. |
| TPO-campaigns-public-R01 | DONE (source verified) | Real `join-service` stores normalized optional mobile in registered `placement_recruiter_public_contacts`; refuses to accept with a phone when storage is missing, no silent drop; named test. |
| TPO-campaigns-public-R02 | PARTIAL — OPEN | Existing per-code error copy and phone/network guards verified, but field-specific placement pending; named test. |
| TPO-campaigns-public-R07 | DONE (source verified) | Existing registrable work-domain matching and subdomain guards, with named test. |

| TPO-campaigns-public-35 | DONE (source, unrun) | Unknown host / explicitly unpublished college page returns real Next 404, with legacy unavailable text in `src/app/placements/not-found.tsx`; transient read outage remains separate. Named `tests/unit/chat2-public-placements-page.test.ts`. |
| TPO-campaigns-public-36 | PARTIAL — OPEN | Replaced platform eyebrow, college heading and footer with legacy public placements framing; exact Recruit from us body still subject to legacy verification, named test. |

| TPO-campaigns-public-16 | DONE (source, tests not run) | Unsubscribe confirmation now guarded client POST with inline retry instead of raw JSON navigation; unknown used tokens get non-enumerating success response. Named `tests/unit/chat2-unsubscribe-graceful.test.ts`. |
| TPO-campaigns-public-R09 | DONE (source, tests not run) | Missing storage and network failures preserve confirmation page and show retry rather than raw JSON; same named test. |

| TPO-campaigns-public-R10 | DONE (source; unrun) | Engagement audience count by segment is now one tenant-scoped aggregate SQL query instead of unbounded JS roster, and selected preview uses SQL IN with <=100 IDs; named `tests/unit/chat2-engage-sql-audience-preview.test.ts`. |

| TPO-campaigns-public-22 | DONE (source; unrun) | Shared business-email policy now blocks personal/disposable/academic/IP hosts, adds distinct client hints and bounded server-side MX validation with retryable unavailable state before sending OTP. Named `tests/unit/chat2-business-email-safety.test.ts`. |

| TPO-campaigns-public-33 | DONE (source; migration pending) | About placements is a bounded 4000-char, persisted, actor-scoped, audited college page section, editor with Save, public pre-wrap; `docs/proposed-migrations/tpo-public-page-content.sql`; `tests/unit/chat2-public-content-metrics.test.ts`. |
| TPO-campaigns-public-34 | DONE (source; migration pending) | Seven real metric choices and ordered selection, preview, LPA/percentage formatting and suppression hints from live aggregates, no identity exposure. Same migration/test. |

| TPO-campaigns-public-R04 | DONE (source, tests unrun) | Recruiter first requests an email code without company-name guess; upon successful mailbox delivery response reveals an existing matching active company, displays You are joining as X, or asks Company name on the Join form when unknown. Named `tests/unit/chat2-public-join-known-company.test.ts`. |

## Chat-2 follow-up — invitation form and preview regressions

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-campaigns-public-24 | DONE (source; tests unrun) | Exact college transient preview error and **Retry** link, distinct from expired invitation; `src/components/placements/public-join-preview-retry.tsx`; `tests/unit/chat2-public-join-states.test.ts` **TPO-campaigns-public-24 shows the college-link loading error and exact retry**. |
| TPO-campaigns-public-30 | DONE (source; tests unrun) | Same preview retry model for company join with scope-specific path; `tests/unit/chat2-public-join-states.test.ts` **TPO-campaigns-public-30…**. |
| TPO-campaigns-public-R06 | PARTIAL — OPEN | Join form retains one-time-code autocomplete, keyboard Enter submit and now visibly names the verification step **One more step**; `src/components/placements/public-recruiter-join-form.tsx`, `tests/unit/chat2-join-form-state.test.ts` **supports Enter submit, editable details and one-time-code autocomplete**. Provider-dependent delivery remains outside unit verification. |

Tests have not been run.

## Chat-2 continuation — campaign delivery and copy

| TPO-campaigns-public-04 | PARTIAL — OPEN | Real TPO email campaign dispatch now inserts a college-scoped `messaging_delivery_batches` record when the DRAFT is claimed, and writes bounded opaque recipient receipts plus actual statuses after provider attempts; `src/modules/messaging/tpo-campaign-dispatch-service.ts`, `tests/unit/chat2-campaign-batch-persistence.test.ts` **TPO-campaigns-public-04 commits a college-scoped batch before sending…**. Provider configuration, aborted attempts, and non-campaign delivery history still need acceptance. No sends attempted here. |
| TPO-campaigns-public-10 | DONE (source; tests not run) | Emails history now has exact recovery title **Couldn't load emails**, legacy sent/skipped/failed tags, **No emails sent from Engage yet**, and `HH:mm D MMM YYYY` IST timestamps; `src/modules/messaging/tpo-campaign-history-copy.ts`, `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx`, `src/app/(authenticated)/tpo/recruiters/campaigns/error.tsx`; `tests/unit/chat2-campaign-history-legacy-copy.test.ts` **TPO-campaigns-public-10 renders…** and **TPO-campaigns-public-10 retains…**. |
| TPO-campaigns-public-12 | DONE (source; tests not run) | Draft campaign page presents up to 500 recipient lead names with truthful statuses and links, never addresses/opaque recipient keys. Transaction verifies current college and persisted placement permission; `src/modules/messaging/tpo-campaign-draft-service.ts`, `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx`; `tests/unit/chat2-campaign-recipient-status-parity.test.ts` **TPO-campaigns-public-12 only reads names and delivery status inside the current college…**. |
| TPO-campaigns-public-36 | DONE (source; tests not run) | Public placements page now uses the college name or **College placements** exactly, removes invented Placements at wording and keeps verified Recruit from us form and Thank you; `src/app/placements/page.tsx`, `tests/unit/chat2-public-placements-heading-parity.test.ts` **TPO-campaigns-public-36 renders only the college's actual name…**. |


## Chat-2 UNCONFIRMED decisions — 2026-10-17
| ID | Decision | Evidence |
| --- | --- | --- |
| TPO-campaigns-public-17 | DONE (source; test unrun) — a verified recipient must be able to opt out even from an old emailed campaign. Legacy signed tokens remain HMAC-verified, purpose-specific and matched to the real locked college/campaign/recipient before any mutation; expiry no longer prevents a consent withdrawal. Global unrelated opt-out tokens keep their own separate policy. | `src/modules/messaging/tpo-campaign-recipient-token.ts`; `tests/unit/chat2-unconfirmed-campaign-decisions.test.ts` **TPO-campaigns-public-17 retains safe signed unsubscribe…**. |
| TPO-campaigns-public-25 | DONE (source; test unrun) — prefer audited explicit link enable/disable and single-token replacement to short unexpected expiries. Current registered schema requires expiry, so use its maximum supported date while still checking enabled, revocation and college/domain scopes. | `src/modules/placements/tpo-public-join-link-service.ts`; named **TPO-campaigns-public-25 gives the public link an explicit audited on/off/replacement lifecycle…** in `tests/unit/chat2-unconfirmed-campaign-decisions.test.ts`. |
| TPO-campaigns-public-R08 | DONE (source; test unrun) — a verified public/company-link registration records `joinMethod`, `scope`, self-service origin and `bypassesDriveReview:false` in its immutable activity event. The recruiter grant remains narrowly scoped to `DRIVES`; neither a public join nor a trusted badge silently publishes requests without approval. | `src/modules/placements/public-join/join-service.ts`, `recruiter-drive-request-service.ts`; named **TPO-campaigns-public-R08 records verified join provenance…** in `tests/unit/chat2-unconfirmed-campaign-decisions.test.ts`. |


## Chat-2 OPEN-gap public privacy deviation
| ID | Decision | Evidence |
| --- | --- | --- |
| TPO-campaigns-public-37 | NOT-A-GAP (privacy-preserving intentional deviation) — keep opt-in publication fresh and hide counts for cohorts or measures below five rather than exposing identifiable placement/salary details; SELECTED policy is not guessed from offers. This is safer than a legacy live aggregate with insufficient suppression. | `src/modules/placements/public-metric-release.ts`, `src/modules/placements/public-page/read-service.ts`; `tests/unit/chat2-safe-deviations-open-gap-decisions.test.ts` named **TPO-campaigns-public-37 releases no identifying small-cohort aggregate…**. |


## Chat-2 remaining provider-dependent campaign increments
| ID | Status | Evidence |
| --- | --- | --- |
| TPO-campaigns-public-04 | PARTIAL — OPEN | Campaign send now creates persisted college delivery batch and per-recipient provider receipt records with actual delivery statuses, `tests/unit/chat2-campaign-open-increments.test.ts` **TPO-campaigns-public-04…**. Separate invite/legacy non-campaign provider history is not fully present; do not represent email counts as universal. |
| TPO-campaigns-public-23 | PARTIAL — OPEN | Verified college/public recruiter link join generates audited event, scoped TPO bell, increments persisted join count and does not infer a preview as an open. Same named **TPO-campaigns-public-23…** test. External welcome-email delivery requires a configured provider and open counting requires a distinct verified beacon. |
