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
| REC-home-drives-33 | DONE | Trusted-domain or approval-off auto-approval must reuse transactional TPO job creation, real approval settings and audit; current request submit still correctly waits for placement-cell decision. Do not bypass TPO review or invent settings. |
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
| REC-home-drives-33 | DONE | Auto-approve policy/trusted-domain and company-listing side effects are absent from `src/modules/placements/recruiter-drive-request-service.ts`. Pending requests persist and notify TPO. |
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


### Chat-14 UNCONFIRMED owner decisions — 2026-10-18

| Gap ID | Decision | Evidence |
| --- | --- | --- |
| REC-home-drives-09 | NOT-A-GAP for the legacy *pending Home card*: a recruiter must claim college access through an expiring public-join link and a verified work-email OTP. Never auto-grant access because a recruiter merely opens Today. Existing account email is reused; revoked access cannot be silently revived. | `public-join/join-service.ts`; test `REC-home-drives-09 treats pending invitations as unverified until an OTP-secured join`. |
| REC-home-drives-19 | NOT-A-GAP: no distinct legacy DRIVE_WORK enable switch exists; all recruiter drive-read paths require an active recruiter grant and exact relationship/college permission, and a revoked/expired grant must fail closed rather than show a drive list. | `permissions/policy.ts`, recruiter grant expiry; test `REC-home-drives-19 requires an active recruiter grant for all drive-read capabilities`. |
| REC-home-drives-44 | DONE with intentional safer divergence: export only the consented shared applicants and a maximum of 200; quote CSV cells, defend spreadsheet formulas, and disclose truncation. An unlimited client-side dump and unconsented contact columns would contradict college sharing rules. | `hr-applicant-export-model.ts`, recruiter applicants export endpoint; test `REC-home-drives-44 bounds and CSV-quotes recruiter exports rather than exposing all students`. |
| REC-home-drives-R02 | NOT-A-GAP for auto-apply by default: applying PASS results to a learner's academic placement record is a placement-cell decision; recruiter controls may stage but cannot skip authoritative TPO verification based solely on a trusted relationship. If a future per-drive policy is registered, explicitly re-audit transactional authority and non-PASS outcomes. | `result-service.ts`, recruiter result controls; test `REC-home-drives-R02 keeps placement-cell verification authoritative by default`. |

### REC-home-drives-33 — registered trusted-domain approval (2026-10-18)

| Gap ID | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-33 | DONE (code authored; runtime tests pending) | `src/modules/placements/recruiter-drive-request-service.ts` loads `placement_tpo_college_settings.recruiter_drive_needs_approval` and `placement_tpo_trusted_domains` in the submitting transaction, enforces exact employer domain and registered verified grant, writes draft job with `createRecruiterApprovedDraftJob` and atomically updates request DRAFT and TPO/recruiter activity notifications. The same writer replaces duplicated TPO manual approval logic; work-mode ambiguities or missing season stay in manual queue; never auto-publishes. `src/modules/placements/recruiter-drive-autoapproval-policy.ts` and `tests/unit/recruiter-chat14-autoapprove-contract.test.ts` tests named `REC-home-drives-33`. |

### REC-home-drives-38 secure applicant evidence (2026-10-18)

| Gap ID | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-38 | BLOCKED — private file signing/malware scanner | `src/modules/placements/hr-job-read-service.ts` now projects only explicitly shared roll/email/phone, uniquely scoped active department, verified educational marks, learner-declared skills and approved HTTPS project/GitHub/portfolio links; TPO company visibility `showProjectLinks` and relationship `shareColumnDefaults` must both allow project links. `src/modules/placements/recruiter-applicant-shared-links-model.ts`, `src/modules/placements/hr-applicant-drawer-model.ts` and `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` are covered by `tests/unit/recruiter-chat14-shared-links.test.ts`. A signed, permission-rechecking resume endpoint is still blocked by private object storage and malware-verified receipt integration, so no resume bytes or object keys are leaked. An algorithmic skill-match percentage and per-share snapshot should not be invented; only learner-declared skills appear, explicitly labeled as such. |

### REC-home-drives-38 signed private resume completion (2026-10-18)

| Gap ID | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-38 | DONE (runtime scanner and R2 credentials required) | `src/modules/placements/recruiter-applicant-resume-service.ts` re-authorizes employer job/relationship, only active TPO-SHORTLISTED applications and shareColumnDefaults `resume`, selects unrevoked, unexpired CLEAN `profile_private_document_receipts`, checks storage HEAD privileged scanner attestation with `verifyPrivateDocumentReceipt`, then `createPrivateReadGrant` verifies generation and SHA and returns a signed 2-minute HTTPS URL but never an object key. `src/app/api/placements/recruiter/jobs/[jobId]/applicants/[applicationId]/resume-grant/route.ts` is origin-guarded POST and no-store with indistinguishable denial. `src/components/placements/recruiter-resume-download.tsx` requests only on click and does not save URLs. Linked via `hr-job-read-service.ts`, `hr-applicant-drawer-model.ts` and recruiter job page. `tests/unit/recruiter-chat14-resume-access.test.ts` four tests named REC-home-drives-38. Provider-backed integration still requires privately configured R2 and privileged scanner; no claim that a real grant was tested. |

### Chat-14 recruiter hardening and regression repair — 2026-10-18

| Gap ID | Status | Evidence |
| --- | --- | --- |
| REC-home-drives-33 | DONE — regression hardened | Fixed undefined `approvedJobId` and `autoReason` references introduced by concurrent main changes: requests are first inserted as `REQUEST`, then moved to `DRAFT` only after successful authoring, preserving audit metadata `{autoReason, approvedJobId}`; unsupported combined internship/fulltime employment is rejected safely before violating persisted job/role constraints. `recruiter-chat14-autoapprove-contract.test.ts` asserts five atomicity/replay/notice cases. |
| REC-home-drives-38 | DONE — disclosure hardened | The college-wide `showCgpaExact` and `showTenthTwelfth` visibility controls now gate verified academic values *in addition* to employer `shareColumnDefaults`. Missing settings fail closed. `recruiter-chat14-round4-ownership-private-review.test.ts` verifies these gates. |
| REC-home-drives-41 | DONE — authorization hardened; migration registration pending | Read and write both require `SUBMITTED` *and* `SHORTLISTED` applications. The private-rating route returns a clear, no-store 503 when its proposed table is not registered, but never exposes the readiness state to a caller lacking an active recruiter profile. |

## Chat-6 final sprint (11-item queue)

| Gap ID | Status | Test and source acceptance |
|---|---|---|
| REC-home-drives-04 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-04.test.ts` — `REC-home-drives-04 greeting and action-count copy are time-zone deterministic`; recruiter-today-greeting-model.ts formats morning/afternoon/evening in IST with exact name and task count; hr/home/page.tsx consumes its title and subtitle. |
| REC-home-drives-05 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-05.test.ts` — `REC-home-drives-05 first-run and all-clear states preserve legacy three-step guide`; hr/home/page.tsx checks zero drives and zero pending requests before showing three onboarding steps; distinct all-clear content shown when tasks are empty. |
| REC-home-drives-06 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-06.test.ts` — `REC-home-drives-06 week feed includes scoped round slot deadline and result events`; recruiter-today-week-events-model.ts combines calendar events with due results, bounds to eight days, orders and caps eight, and keeps scoped deep links. |
| REC-home-drives-07 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-07.test.ts` — `REC-home-drives-07 live drive highlight counts only college-shared applicants`. Live-drive model isolates selected employer, selected college and published non-archived drives; page uses authorized shared-applicant counts without inferring private submissions. |
| REC-home-drives-08 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-08.test.ts` — `REC-home-drives-08 partial failure preserves usable cards with a retry action`. Independent settled reads, partial warning, retry link, bounded recent-drive notice and route-error reset are implemented; browser stale-refresh remains unverified. |
| REC-home-drives-10 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-10.test.ts` — `REC-home-drives-10 legacy task deep links map onto authorized recruiter workspaces`. Drive detail converts historical results/interviews, selections, messages and requests tabs to authorized current routes after scoped job read; invalid job IDs still fail safely. |
| REC-home-drives-37 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-37.test.ts` — `REC-home-drives-37 shared-candidate funnel protects privacy and computes stage percentages`. Pure funnel computes six hiring stages with per-applied and per-previous percentages, and explicitly represents non-existent assessment/interview stages as unknown. |
| REC-home-drives-R04 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-r04.test.ts` — `REC-home-drives-R04 closed drives keep read-only history and hide write actions`. buildHrDriveOverview marks CLOSED as read-only; recruiter drive page shows the two legacy closed-drive notices, hides round editor/slots write links, and keeps historical rounds and offers readable. |
| REC-home-drives-R05 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts` — `REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before restoring the opener` and `REC-home-drives-R05 keeps next and previous applicant shortcuts inside the selected native dialog`. `src/components/hr/recruiter-applicant-review-drawer.tsx` renders the shared `src/components/ui/drawer.tsx` modal `<dialog>`; browser-native `showModal()` confines Tab/Shift+Tab, `onCancel` handles Escape, and `onClose` restores opener focus. `src/components/placements/recruiter-focused-review-shortcuts.tsx` retains scoped N/P navigation without a duplicate focus trap. Applicant selection and close route remain authorized and URL-owned. |
| REC-home-drives-R06 | DONE (source verified; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-r06.test.ts` — `REC-home-drives-R06 legacy tab query alias maps live waiting closed and all without changing q`. hr/drives/page.tsx maps tab=all/live/waiting/closed through legacyDriveTab and prioritizes an explicit valid view; Zod schema remains tenant-scoped and strict. |
| REC-home-drives-R07 | NOT-A-GAP (owner IST policy; tests not run) | `tests/unit/chat6-final-sprint-rec-home-drives-r07.test.ts` — `REC-home-drives-R07 IST presentation deliberately overrides viewer-local legacy dates`. Owner requires India Standard Time across LMS. Recruiter Today, Drives and detailed workspaces explicitly format Asia/Kolkata; retaining viewer-local legacy times would introduce inconsistent dates while travelling. Existing chat-7 acceptance agreed; regression contract added. |


## chat-15 HR workspace privacy regressions — 2026-10-18

| ID | Status | Acceptance evidence and outstanding verification |
|---|---|---|
| HR-WORKSPACE-CONTACT-18 | SOURCE FIX, CI PENDING | `src/modules/placements/recruiter-workspace-service.ts`, `src/modules/placements/recruiter-round-participant-sharing.ts`; `tests/unit/HR-BREAK-chat15-workspace-contact-18.test.ts` → `HR-WORKSPACE-CONTACT-18 round workspace candidate contact disclosure`. Recruiter round participants never expose `users.email` unless the authoritative employer-college relationship explicitly lists `email` in `shareColumnDefaults`; missing/empty list defaults to masked. Verify real database visibility toggles. |
| HR-WORKSPACE-ARCHIVE-19 | SOURCE FIX, CI PENDING | `src/modules/placements/recruiter-workspace-service.ts`, `tests/unit/HR-BREAK-chat15-workspace-archive-19.test.ts` → `HR-WORKSPACE-ARCHIVE-19 employer can't read archived candidates or round metadata`. Archived published/closed jobs return not found before candidate/round queries. Verify HTTP direct link and PostgreSQL data visibility. |

Neither test suite, actual account browser journey nor PostgreSQL tenant corpus was executed here; these remain release gates.


## chat-15 HR data isolation follow-up (2026-10-18, CI pending)

| ID | Source | Acceptance evidence |
|---|---|---|
| HR-PORTFOLIO-SCOPE-29 | `recruiter-portfolio-counts-service.ts` | Both applicant and offer aggregates now filter persisted job college, granted company relationships, active employer/college/relationship, published/closed non-archived jobs and ACTIVE shortlisted members. `tests/unit/HR-BREAK-chat15-portfolio-scope-29.test.ts`; integration with two employers in one college is still outstanding. |
| HR-REPORT-ARCHIVE-31 | `recruiter-company-reports-service.ts` | Paginated company job rows, status totals and SQL funnel use non-archived published/closed jobs consistently. `tests/unit/HR-BREAK-chat15-company-report-archive-31.test.ts`; cross-tab counts need real PostgreSQL/browser acceptance. |

Unit tests authored but not executed locally; no claim of CI pass or production deployment.


## Chat-15 source verification (2026-10-18)

**HR-TODAY-ARCHIVE-34:** Today interview slot proposal and offer follow-up listings require same-college PUBLISHED jobs that have not been archived. Empty job allowlists return without SQL. Source proof: `tests/unit/HR-BREAK-chat15-today-archive-34.test.ts`. Test authored; database/provider/browser execution remains pending.


## Chat-15 HR employer portfolio visibility — 2026-10-18

**HR-PORTFOLIO-ARCHIVE-36** excludes archived jobs from the canonical recruiter job portfolio, preventing them from appearing in dependent dashboard, calendar, activity and notification lists. **HR-PORTFOLIO-REVOKE-37** rechecks the acting recruiter's persisted ACTIVE grant and profile on each list query; session grants alone never keep employer data visible after revocation. Evidence: `tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts`. The test was authored but not run; multi-session PostgreSQL replay is outstanding.


## HR-PORTFOLIO-EXPIRY-38 live grant expiry safety (2026-10-18)

The recruiter job-list SQL now rechecks all persisted grant-validity invariants: recruiter and grant ACTIVE, grant VERIFIED, non-null future validity, and `DRIVES` capability. This prevents a previously issued context from continuing to enumerate employer drives after expiry or capability removal. `tests/unit/HR-BREAK-chat15-portfolio-owner-24.test.ts` covers the precise expiry boundary and source predicate. CI and real PostgreSQL authorization remain outstanding.
