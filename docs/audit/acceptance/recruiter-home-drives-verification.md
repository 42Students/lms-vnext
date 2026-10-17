# Recruiter Home Drives — chat-7 acceptance evidence

Source contracts for previously-fixed and reviewed UI flows. The orchestrator runs tests and approves runtime/database behavior; source-only evidence is not a runtime pass.

| ID | Status | Evidence (file + gap-named test) |
|---|---|---|
| REC-home-drives-02 | DONE | `src/modules/placements/hr-today-action-queue-model.ts`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-02 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-03 | DONE | `src/app/(authenticated)/hr/home/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-03 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-14 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-14 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-15 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-15 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-17 | DONE | `src/components/hr/hr-unsent-drive-alert.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-17 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-18 | DONE | `src/app/(authenticated)/hr/drives/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-18 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-20 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-20 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-24 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-24 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-25 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-25 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-26 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-26 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-28 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-28 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-29 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-29 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-35 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-35 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-36 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-36 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-39 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-39 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-40 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-40 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-42 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-42 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-48 | DONE | `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-48 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-49 | DONE | Accessible `ConfirmDialog` pre-send bulk summary (no native confirm), guarded retry retains failed candidates; `tests/unit/chat-7-graceful-actions.test.ts` — `GR-35 REC-home-drives-49 previews bulk results in a keyboard-reachable confirmation dialog`;  `src/components/placements/recruiter-result-controls.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-49 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-R01 | DONE | `src/modules/placements/hr-tpo-notification-service.ts`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-R01 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-R08 | DONE | `src/modules/placements/recruiter-drive-search-service.ts`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-R08 preserves the verified recruiter drive behavior`. Authored, not executed. |
| REC-home-drives-56 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-acceptance.test.ts` — `REC-home-drives-56 preserves the verified recruiter drive behavior`. Authored, not executed. |

Remaining gaps (including private applicant disclosure and ZIP export) require full behavior and permission verification. Uploaded resume ZIP and job-description files need private object storage/malware scanning, so those are BLOCKED pending infrastructure.

| REC-home-drives-23 | BLOCKED | Private, scanned PDF/Word job-description storage is not configured. \`tests/unit/chat-7-storage-blockers.test.ts\` — \`REC-home-drives-23 secure file provider pending\`. |
| REC-home-drives-43 | BLOCKED | Resume ZIP requires access to private scanner-attested source files. \`tests/unit/chat-7-storage-blockers.test.ts\` — \`REC-home-drives-43 secure file provider pending\`. |
| REC-home-drives-55 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-tab-legacy.test.ts` — `REC-home-drives-55 orders overview, applicant, round, offer, request and discussion tabs`. Counts from authorized job aggregates; tests authored, not run. |

## Round 5 — graceful recruiter requests and bulk results
`src/components/placements/recruiter-result-controls.tsx` now uses shared `apiFetch` for single and multi-candidate writes, preserving unsuccessful selections; `src/components/hr/hr-drive-draft-form.tsx` retains the draft on errors and never prints raw server codes; `src/components/hr/recruiter-request-cancel-button.tsx` uses a confirmation dialog and shared friendly errors. `tests/unit/recruiter-home-drives-chat7-round5-graceful.test.ts` includes `REC-home-drives-12/-22/-29/-49` and `GR-04/-35/-90`. Tests not run.

| REC-home-drives-11 | DONE | `src/app/(authenticated)/hr/home/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-11 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-31 | DONE | `src/modules/placements/hr-drive-round-presets.ts`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-31 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-34 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-34 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-50 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-50 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-54 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-54 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-55 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-55 confirms the audited source behavior`. Source implementation checked; tests authored, not run. |

| REC-home-drives-R07 | NOT-A-GAP | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`; `tests/unit/recruiter-home-drives-chat7-r7.test.ts` — `REC-home-drives-R07 confirms the audited source behavior`. Owner decision requires IST everywhere, so differing traveler-local zone is intentional. |

| REC-home-drives-27 | DONE | `src/modules/placements/hr-drive-draft-model.ts`; `tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts` — `REC-home-drives-27 matches the reviewed contract`. Test authored, not executed. |

| REC-home-drives-30 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts` — `REC-home-drives-30 matches the reviewed contract`. Test authored, not executed. |

| REC-home-drives-32 | DONE | `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts` — `REC-home-drives-32 matches the reviewed contract`. Test authored, not executed. |

## Chat-14 reassignment — batch 1 (authored; tests not executed)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-11 | DONE | `src/app/(authenticated)/hr/home/error.tsx` now shows legacy account recovery with Retry; existing no-college screen remains scoped; named test |
| REC-home-drives-31 | PARTIAL — OPEN | `HR_DRIVE_ROUND_PRESETS` legacy labels verified; Hire again heading/copy still under review; named test |
| REC-home-drives-54 | DONE | Existing role-scoped `not-found.tsx` shows exact legacy missing-drive copy; named test |
| REC-home-drives-R07 | NOT-A-GAP | Owner decision IST everywhere takes precedence over viewer-local legacy formatting; `hr/home/page.tsx` and portfolio format IST; named test |

## Chat-14 reassignment — batch 2 (tests authored, not run)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-16 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx` stable-sorts unanswered requests first and highlights those cards; named test in `tests/unit/recruiter-chat14-round2.test.ts` |
| REC-home-drives-27 | DONE | `hrDriveDraftSchema` enforces role title with `Enter a role title`; description and location optional; named unit schema test |
| REC-home-drives-30 | DONE | `src/components/hr/hr-drive-draft-form.tsx` post-confirmation feedback says `Sent to the placement cell for review`; preserves failed request drafts; named test |
| REC-home-drives-31 | DONE | `hr-drive-draft-form.tsx` now uses `Hire again` lowercase title, and existing three legacy round presets verified; named tests |
| REC-home-drives-32 | DONE | `hr-drive-draft-form.tsx` browser beforeunload and accessible `Discard this drive draft?` in-app confirmation, including brand-new drafts; named test |
| REC-home-drives-52 | PARTIAL — OPEN | Offers now 15/page and `EXPIRED` filter, with persisted scoped count in `hr-job-read-service.ts`. Selection/PENDING/REVOKED are not `placement_offers` statuses, so require separate source; named unit test |

## Chat-14 reassignment — combined final evidence (tests not run)

| Gap | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-16 | DONE | Unanswered placement-cell requests sort first and cards visibly highlighted without changing remaining order; `recruiter-placement-portfolio.tsx` and `recruiter-chat14-round2.test.ts`. |
| REC-home-drives-27 | DONE | `hr-drive-draft-model.ts` title minimum 3 returns `Enter a role title`; description/location remain optional, valid CTC required; round2 Zod test. |
| REC-home-drives-30 | DONE | Confirmed request feedback now `Sent to the placement cell for review`; failed saves retain draft/idempotency; round2 test. |
| REC-home-drives-31 | DONE | `Hire again` caption and existing legacy round presets; round1/round2 tests. |
| REC-home-drives-32 | DONE | In-app accessible `Discard this drive draft?` plus `Leave without these changes?` and beforeunload for new/edit/copy; round2 test. |
| REC-home-drives-33 | OPEN | Trusted-domain or approval-off auto-approval must reuse transactional TPO job creation, real approval settings and audit; current request submit still correctly waits for placement-cell decision. Do not bypass TPO review or invent settings. |
| REC-home-drives-34 | DONE | Drive page has role title, status labels, college/CTC/location/mode/applicants/offers/rounds/deadline subtitle and scoped Back to Drives; round3 named source test. |
| REC-home-drives-38 | OPEN | Implemented explicit active-company/college `shareColumnDefaults` gate for Roll no. with scoped applicant disclosure. Additional branch, verified grades, skill matching, resume/GitHub/portfolio consent and link policies remain unimplemented; round3 test covers the safe slice. |
| REC-home-drives-41 | DONE | Private 1–5 rating and <=1000-character note per recruiter+application with per-author auth, write/upsert/clear, scoped applicant check and no-store, UI and tests. SQL proposed in `docs/proposed-migrations/recruiter-private-candidate-ratings.sql`; page gracefully warns until registered. |
| REC-home-drives-45 | DONE | Implemented truthful `The placement cell has not shared the applicants yet` empty; complete legacy stage-button counts require consent-aware stage sources beyond shared-only shortlist. Do not expose rejected/private students. |
| REC-home-drives-46 | DONE | Added round status Not scheduled / Scheduled / Completed, Added by you, IST date/venue, change/remove link. Legacy inline modal, results and slots counters still missing; round3 test covers implemented facts. |
| REC-home-drives-47 | OPEN | Recruiter round editor still limited to PUBLISHED jobs; approved DRAFT requests must atomically update both request rounds and draft-job rounds, not rewrite one and leave the other stale. |
| REC-home-drives-50 | DONE | Offers table now uses Candidate, Type, CTC LPA, readable Status, Reply by, Joining; no unauthorized preissue offers falsely synthesized. `recruiter-chat14-round3.test.ts`. |
| REC-home-drives-52 | DONE | 15/page, EXPIRED filter and correct scoped counts implemented. SELECTED/PENDING_VERIFICATION and REVOKED do not exist in `placement_offers` status check; require separate TPO selections/issue audit data source; round2 test. |
| REC-home-drives-53 | DONE | Focusable-visibility refresh with stale-data banner and manual Retry, plus error fallback safe copy; `recruiter-drive-focus-refresh.tsx` + round3 test. |
| REC-home-drives-R03 | OPEN | Current `recruiter-service.ts` sees all company jobs under the recruiter grant, not only per-user assigned drives. Persisted per-job recruiter owner/assignment is needed before restricting every URL/summary/notification consistently; no insecure UI-only hide. |
| REC-home-drives-R07 | NOT-A-GAP | Owner rule IST everywhere overrides viewer-local legacy; round1 tests confirm recruiter Today and portfolio India Standard Time. |

## Chat-14 reassignment closure audit (2026-10-17)

Source-only evidence: tests below were authored or verified by source inspection, **not executed**. Actual database runtime closure for private reviews requires orchestrator registration of the proposed migration.

| ID | Status | Evidence: implementation; named test |
| --- | --- | --- |
| REC-home-drives-11 | DONE | `src/app/(authenticated)/hr/home/error.tsx`; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-home-drives-11 offers the legacy account load recovery and Retry action`. |
| REC-home-drives-16 | DONE | `src/components/placements/recruiter-placement-portfolio.tsx` prioritizes unanswered placement-cell requests; `tests/unit/recruiter-chat14-round2.test.ts` — `REC-home-drives-16 sorts placement-cell unanswered requests before recent or deadline rows`. |
| REC-home-drives-27 | DONE | `src/modules/placements/hr-drive-draft-model.ts` restores required role/CTC and optional description/location; `tests/unit/recruiter-chat14-round2.test.ts` — `REC-home-drives-27 validates only the role title and required CTC among editable prose fields`. |
| REC-home-drives-30 | DONE | `src/components/hr/hr-drive-draft-form.tsx` confirmed request result with Go to Drives/Request another; `tests/unit/recruiter-chat14-round2.test.ts` — `REC-home-drives-30 records the legacy formal-request success sentence only after confirmed persistence`. |
| REC-home-drives-31 | DONE | `src/modules/placements/hr-drive-round-presets.ts`, `src/components/hr/hr-drive-draft-form.tsx`; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-home-drives-31 keeps exact legacy round preset labels`. |
| REC-home-drives-32 | DONE | `src/components/hr/hr-drive-draft-form.tsx` beforeunload and accessible discard/leave guards; `tests/unit/recruiter-chat14-round2.test.ts` — `REC-home-drives-32 protects all unsent drafts with an accessible discard confirmation`. |
| REC-home-drives-33 | OPEN | Auto-approve policy/trusted-domain and company-listing side effects are absent from `src/modules/placements/recruiter-drive-request-service.ts`. Pending requests persist and notify TPO. |
| REC-home-drives-34 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` supports safe returnTo/legacy drive framing; `tests/unit/recruiter-chat14-round3.test.ts` — `REC-home-drives-34 retains scoped returnTo and job title, status and applicant-count framing`. |
| REC-home-drives-38 | OPEN | `src/modules/placements/hr-job-read-service.ts` now masks roll and email unless relationship share defaults explicitly authorize each; verified UG/10th/12th academic percentages now also share-gated; remaining branch, phone, skill match, resume/portfolio and per-share snapshots. `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-38 never exposes roll number or email without an active relationship share column` (partial only). |
| REC-home-drives-41 | DONE | `src/db/schema/placement-recruiter-candidate-ratings.ts`, `src/modules/placements/recruiter-private-rating-service.ts`, scoped `private-rating/route.ts`, `src/components/hr/recruiter-private-rating-editor.tsx`, job applicant drawer; `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-41 validates and authorizes private reviews without company-wide notes`; registration proposal `docs/proposed-migrations/recruiter-private-candidate-ratings.sql`. Deployment awaits numbered migration. |
| REC-home-drives-45 | OPEN | Existing shared/shortlisted/withdrawn views use vNext shortlist privacy; full legacy stage filters and context-specific empty copy remain. |
| REC-home-drives-46 | OPEN | Round status/author/date exist in job details; remaining counters and exact inline editor interaction not built. `tests/unit/recruiter-chat14-round3.test.ts` covers partial status only. |
| REC-home-drives-47 | DONE | `src/modules/placements/hr-round-editor-service.ts` allows owned DRAFT and PUBLISHED, denies closed/unowned and protects used rounds; pending formal requests edited through own draft form; `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-47 permits recruiter-owned unpublished rounds without reopening closed drives`. |
| REC-home-drives-50 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` legacy-readable offer columns/status/joining words; `tests/unit/recruiter-chat14-round3.test.ts` — `REC-home-drives-50 uses readable, scoped offer columns and employment outcomes`. |
| REC-home-drives-52 | OPEN | Offer pagination is 15 with EXPIRED but pre-issue SELECTED/PENDING_VERIFICATION and revoked separate ledger not joined; `tests/unit/recruiter-chat14-round2.test.ts` — `REC-home-drives-52 pages actual persisted offers by 15 and includes expired offers` (partial only). |
| REC-home-drives-53 | DONE | `src/components/hr/recruiter-drive-focus-refresh.tsx` data-quality warning/focus refresh; `tests/unit/recruiter-chat14-round3.test.ts` — `REC-home-drives-53 refreshes a stale recruiter drive after tab focus without hiding data errors`. |
| REC-home-drives-54 | DONE | `src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx` exact legacy safe missing-drive copy; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-home-drives-54 displays the legacy missing-drive message without disclosing other colleges`. |
| REC-home-drives-R03 | DONE | `src/modules/placements/recruiter-job-ownership.ts` owned author/approved-request predicate, enforced in lists, workspaces, rounds, slots, results, notes, Hire again; `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-R03 denies a colleague's direct workspace, rounds, slots and results`. |
| REC-home-drives-R07 | NOT-A-GAP | Owner requires IST globally, so viewer-local legacy time rendering is intentionally not ported; `tests/unit/recruiter-chat14-round1.test.ts` — `REC-home-drives-R07 intentionally uses IST for all LMS recruiter's dates by owner decision`. |

### Chat-14 follow-up 2026-10-17 · REC-home-drives-46 and REC-home-drives-52

| ID | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-46 | DONE | `src/modules/placements/hr-job-read-service.ts` counts only `placement_round_candidate_slots.confirmed_at` for confirmed venue slots; `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` shows staged/applied/confirmed counts alongside legacy inline Change/Remove and its existing legacy toasts. `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-46 shows only placement-cell confirmed slot counts, not recruiter internal bookings`. |
| REC-home-drives-52 | DONE | `src/modules/placements/hr-job-read-service.ts` reads the authoritative `placement_drive_selections` ledger (0115) under the same shared-applicant boundary, paginated 15 per page, with selected/verified/cancelled separated from issued/accepted/declined/withdrawn/expired `placement_offers`. `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` uses explicit non-offer selection labels. `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-52 separates pre-issue selections and cancellations from real issued offers`. This does not mislabel a cancelled selection as a revoked issued offer (the offer status schema does not include REVOKED). |

### REC-home-drives-45 completed and REC-home-drives-38 expanded (2026-10-17)

| ID | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-45 | DONE | `src/modules/placements/hr-job-applicants-model.ts` restores eight named legacy stage chips; `src/modules/placements/hr-job-read-service.ts` calculates stage-predicate totals and pages from `placement_round_results`, issued offers and confirmed joining, all inside existing TPO-shortlisted audience restrictions; `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` renders stage-specific counts and notes overlapping milestones. `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-45 filters historical milestones only within TPO-shared applicants`. |
| REC-home-drives-38 | OPEN | Scope widened to college-share-approved phone and uniquely identified active program/department branch, with verified academic percentages. Still no secure resume/GitHub/portfolio/document and skill-match contract. `tests/unit/recruiter-chat14-round4-ownership-private-review.test.ts` — `REC-home-drives-38 shares enrolled branch/phone only when college columns allow each`. |
