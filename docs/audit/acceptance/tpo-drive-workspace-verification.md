# TPO Drive Workspace — Gap Closure Verification

Source: `docs/audit/pages/tpo/drive-workspace.md` and `drive-workspace-review.md`.
Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`.
Tests listed below are **authored but not executed by chat-5**; orchestrator acceptance is pending.

| ID | Result | Code and test evidence |
|---|---|---|
| TPO-drive-workspace-17 | DONE | `src/modules/placements/tpo-drive-close-preview-service.ts` (scoped pending-selection guard plus transactional close/learner notices), `src/modules/placements/tpo-drive-stop-effects.ts`; `tests/unit/tpo-drive-close-preview-model.test.ts` — `TPO-drive-workspace-17 refuses closure while any employer selection is not released`. |
| TPO-drive-workspace-R01 | DONE | `src/app/api/placements/tpo/bulk-actions/preview/route.ts`, `confirm/route.ts`, and scoped CSV export; `tests/unit/tpo-drive-workspace-r01-routes.test.ts` — `TPO-drive-workspace-R01 routes rely on tenant scope and origin checks, not DB09 env toggles`. |
| TPO-drive-workspace-65 | BLOCKED | Private resume ZIP needs an object-storage bucket/scanner and six-digit company code delivery needs real email-provider credentials. Existing ninety-day redaction tested in `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-65 redacts nonhired learner contacts and documents after ninety days`. Do not treat the token-only link as full OD-09 closure. |

| TPO-drive-workspace-42 | DONE | `src/modules/placements/tpo-round-apply-service.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-42 summarizes only staged round outcomes and invalidates edited previews`. |
| TPO-drive-workspace-44 | DONE | `src/modules/placements/tpo-interview-slot-service.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-44 generates separate rooms and refuses interviews spilling into the next IST day`. |
| TPO-drive-workspace-47 | DONE | `src/modules/placements/tpo-drive-selection-service.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-47 rejects unreviewed and duplicate selection releases`. |
| TPO-drive-workspace-48 | DONE | `src/modules/placements/tpo-selection-import-model.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-48 matches company selection rows only on consistent internal identities`. |
| TPO-drive-workspace-53 | DONE | `src/modules/placements/tpo-waitlist-promotion-service.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-53 requires deliberate waitlist promotion and invalidates changed previews`. |
| TPO-drive-workspace-60 | DONE | `src/modules/placements/tpo-drive-change-request-service.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-60 validates scoped two-way field changes and decision acknowledgements`. |
| TPO-drive-workspace-62 | DONE | `src/modules/placements/tpo-drive-about-service.ts`; `tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts` — `TPO-drive-workspace-62 displays source-backed deal category and company compensation without guessing dates`. |

## Round 2 — S2 implementation/verification

| TPO-drive-workspace-05 | DONE | src/modules/placements/tpo-drive-clone-service.ts; src/modules/placements/tpo-drive-clone-eligibility-model.ts; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-05 drops old cohorts and passing years from cloned drafts |
| TPO-drive-workspace-10 | NOT-A-GAP | docs/audit/owner-decisions-resolved.md OD-28 retains season-scoped drive lifecycle (intentional vNext protection); src/modules/placements/tpo-drive-lifecycle-model.ts; tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts — TPO-drive-workspace-10 intentionally enforces active seasons before drive publication |
| TPO-drive-workspace-14 | DONE | src/modules/placements/tpo-drive-lifecycle-model.ts; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-14 requires a future deadline, package, and external link |
| TPO-drive-workspace-16 | DONE | src/modules/placements/tpo-drive-deadline-service.ts; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-16 permits a first deadline but rejects past or backwards changes |
| TPO-drive-workspace-29 | DONE | src/modules/placements/tpo-applicant-pipeline-service.ts, src/modules/placements/tpo-drive-applications-export-model.ts; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-29 carries request, no-show and college inclusion flags to CSV |
| TPO-drive-workspace-41 | DONE | src/components/placements/tpo-bulk-round-result-recorder.tsx, src/modules/placements/tpo-bulk-round-result-model.ts; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-41 validates distinct waitlist outcomes and honest staging counts |
| TPO-drive-workspace-68 | DONE | src/modules/placements/tpo-drive-about-service.ts; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-68 limits the drive audit reader to a scoped 100 events |
| TPO-drive-workspace-R03 | DONE | src/modules/placements/tpo-bulk-round-result-model.ts, src/components/placements/tpo-bulk-round-result-recorder.tsx; tests/unit/tpo-drive-workspace-s2-round2.test.ts — TPO-drive-workspace-R03 rejects duplicated learners and identical waitlist ranks |
| TPO-drive-workspace-69 | DONE | src/components/tpo/tpo-bulk-action-panel.tsx, src/modules/placements/tpo-bulk-action-confirm-service.ts; tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts — TPO-drive-workspace-69 requires acknowledgement, exposes skipped retries and logs bulk runs |

| TPO-drive-workspace-20 | DONE | `src/modules/placements/tpo-drive-journey-service.ts`, `src/components/placements/placement-drive-workspace.tsx`; `tests/unit/tpo-drive-workspace-s2-round2.test.ts` — `TPO-drive-workspace-20 counts persisted scoped application journey stages`. |
| TPO-drive-workspace-R02 | DONE | `src/modules/placements/tpo-applicant-pipeline-service.ts`, `src/modules/placements/tpo-drive-applications-export-model.ts`; `tests/unit/tpo-drive-workspace-s2-round2.test.ts` — `TPO-drive-workspace-R02 treats applicant-search SQL wildcard characters literally`. |

Other S2 cases with partial contracts in the round-2 test files remain **OPEN**, not misrepresented as DONE: 01, 04, 11, 12, 21, 22 (roll/contact now included but broader academic columns absent), 23, 27, 38, 45, 49 (fixed/variable pay and full offer filters still missing), 50, 52, 55, 59, 61, 63 and 67. `TPO-drive-workspace-41` is now wired into the actual round-results page with strict roll matching and a named duplicate/ambiguous-roll regression test. All test execution remains orchestrator-owned.

## Round 3 — inspected S3/S4 drive workspace behavior

Tests have been **written but not run**. All cases below are named in `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts`.

| ID | Result | Code and test evidence |
|---|---|---|
| TPO-drive-workspace-07 | DONE | publish query deep link opens lifecycle review; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-07: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-19 | DONE | preset cancellation reasons and student-facing reason note; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-19: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-32 | DONE | filter-empty state links to actual Registered, not applied workspace section; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-32: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-36 | DONE | three round presets available to the TPO; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-36: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-58 | DONE | drive-level Drive day navigation and attendance summary; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-58: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-R04 | DONE | shared workspace nav and active aria-current across subpages; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-R04: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-R05 | DONE | friendly readiness messages instead of internal machine codes; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-R05: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-57 | OPEN | release warning is visible; precise holiday-aware expiry rule remains to be implemented; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-57: validates the scoped drive-workspace behavior`. |
| TPO-drive-workspace-74 | NOT-A-GAP | legacy recruiter key bug is not inherited; vNext returns college-scoped recruiterContacts; `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts` — `TPO-drive-workspace-74: validates the scoped drive-workspace behavior`. |

The new S3 empty-state and offer release copy lives in `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx` and `offers/page.tsx`. The actual target is `id="drive-registered-not-applied"` in `src/components/placements/placement-drive-workspace.tsx`. Shared GR helpers were not yet on origin/main during this round; raw provider codes were not introduced.

## Round 4 — current source and gentle-failure adoption

| ID | Result | Evidence |
|---|---|---|
| TPO-drive-workspace-59 | OPEN | `src/modules/placements/tpo-drive-discussion-service.ts`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx`, and `src/modules/placements/tpo-drive-tab-model.ts`; `tests/unit/tpo-drive-discussion-chat5.test.ts` — `TPO-drive-workspace-59 provides real Discussion navigation and scoped message data`. Recruiter threads now work; the independent internal-team thread requested by legacy is still missing. |
| TPO-drive-workspace-64 | DONE | The same scoped Discussion reader retains recruiter conversations on closed drives, with a reply link; `tests/unit/tpo-drive-discussion-chat5.test.ts` — `TPO-drive-workspace-64 keeps recruiter follow-up accessible after closing a drive`. |
| TPO-drive-workspace-70 | OPEN | `src/components/placements/tpo-drive-cancel-form.tsx` and `tpo-drive-lifecycle-controls.tsx` now use explicit accessible consequence checks and `useGuardedAction`; `tests/unit/tpo-drive-graceful-chat5-round4.test.ts` — `TPO-drive-workspace-70 and GR-35 require an explicit reviewed destructive-action confirmation`. Other destructive offer controls still require conversion. |
| TPO-drive-workspace-14 | DONE (existing) | The publish/reopen screen now uses the shared `apiFetch` and guarded-action hook; `tests/unit/tpo-chat5-graceful-adoption-round4.test.ts` — `GR-04 uses guarded JSON fetch in all four changed mutating forms`. |

## Chat-5 next round — OPEN gap continuation

Source tests were authored, not executed. A partial baseline test is **not** closure evidence.

| ID | Status | Evidence |
|---|---|---|
| TPO-drive-workspace-55 | OPEN | Offer lifecycle now uses apiFetch, guarded action and reviewed evidence; full offer action-window parity remains; `tests/unit/tpo-drive-workspace-chat5-next-round.test.ts` (test name includes `TPO-drive-workspace-55`). |
| TPO-drive-workspace-70 | OPEN | Removed remaining native offer/applicant decision confirmations in the touched forms; other destructive controls require a complete route-wide audit; `tests/unit/tpo-drive-workspace-chat5-next-round.test.ts` (test name includes `TPO-drive-workspace-70`). |
| TPO-drive-workspace-72 | OPEN | Drive navigation now has a mobile section selector; legacy mobile actions panel and all responsive cards still need work; `tests/unit/tpo-drive-workspace-chat5-next-round.test.ts` (test name includes `TPO-drive-workspace-72`). |
| TPO-drive-workspace-27 | OPEN | Applicant drawer decision form now has guarded reviewed submission, but S/R/arrows and sequential review navigation are missing; `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` (test name includes `TPO-drive-workspace-27`). |
| TPO-drive-workspace-34 | OPEN | Candidate-visible rejection reason presets are present; separate confidential internal reason recording still needs persistence; `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` (test name includes `TPO-drive-workspace-34`). |
| TPO-drive-workspace-21 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-21 partial baseline — further implementation required`. |
| TPO-drive-workspace-22 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-22 partial baseline — further implementation required`. |
| TPO-drive-workspace-23 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-23 partial baseline — further implementation required`. |
| TPO-drive-workspace-26 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-26 partial baseline — further implementation required`. |
| TPO-drive-workspace-38 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-38 partial baseline — further implementation required`. |
| TPO-drive-workspace-49 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-49 partial baseline — further implementation required`. |
| TPO-drive-workspace-50 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-50 partial baseline — further implementation required`. |
| TPO-drive-workspace-59 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-59 partial baseline — further implementation required`. |
| TPO-drive-workspace-63 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-63 partial baseline — further implementation required`. |
| TPO-drive-workspace-67 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-67 partial baseline — further implementation required`. |
| TPO-drive-workspace-69 | OPEN | Reviewed existing partial behavior; full legacy feature remains outstanding. `tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts` — `TPO-drive-workspace-69 partial baseline — further implementation required`. |

## Chat-5 next 25+ OPEN queue review — 2026-10-17

Fast-forwarded to latest `main` before edits. Wrote but did **not run** tests. Partial baseline cases are **not** closure.

| Gap | Status | Evidence and remaining condition |
|---|---|---|
| TPO-drive-workspace-06 | DONE | Empty unpublished draft is version-checked, applicant/offer-guarded, archived and audited. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-06 archives only empty DRAFT records after version review`. |
| TPO-drive-workspace-R06 | OPEN | Safe archive fixes the abandoned-draft path but distinct Cancel draft semantics remain open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-R06 recovers abandoned unpublished drives without touching an applicant`. |
| TPO-drive-workspace-08 | OPEN | Optional drive reads now degrade and show a refresh message; core reads still use the page error boundary. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-08 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-73 | OPEN | Independent optional read services load concurrently; full per-tab lazy reads remain open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-73 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-21 | OPEN | Last applied round and result are persisted evidence; full stage transitions are not implemented. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-21 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-22 | OPEN | Batch, branch, marks, backlogs and applied round facts now appear in the grid; remaining evidence fields open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-22 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-23 | OPEN | Withdrawal/no-show/placed-elsewhere/college-added flags filter whole server-side roster and CSV; range/saved views open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-23 rejects unrecognized and duplicate flag filter values`. |
| TPO-drive-workspace-27 | OPEN | S/R/Ctrl+Enter and previous/next applicant links now work; full sequential review and resume panel open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-27 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-71 | OPEN | Safe review shortcuts and adjacent applicant navigation exist; full shortcuts overlay remains open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-71 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-49 | OPEN | Fixed and variable pay, bonus, bond and acceptance metadata now appear on card and CSV; full register parity open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-49 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-51 | OPEN | Recorded employer acceptance channel and dispute deadline now shown; report and finalization workflow open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-51 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-56 | OPEN | CSV contains saved pay breakdown and statuses; 5000-row cap and full legacy export still open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-56 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-34 | DONE | Private rejection reason is stored separately from learner-visible screening feedback. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-34 holds private reviewer reason apart from learner-visible feedback`. |
| TPO-drive-workspace-R01 | DONE | Obsolete env flag removed from authorized applicant review route; same-origin guard preserved. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-R01 removes the obsolete environment gate from reviewed applicant writes`. |
| TPO-drive-workspace-09 | OPEN | Legacy wording across the whole page still differs. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-09 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-11 | OPEN | Central permission accepts College Admin but TPO-specific route/actor checks still block access. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-11 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-12 | OPEN | Drive request queue exists; full recruiter decision modal remains open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-12 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-24 | OPEN | Reviewed bulk stage moves exist; drag/drop board remains missing. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-24 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-26 | OPEN | Exact undo exists; 30-second student-notification hold remains unimplemented. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-26 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-30 | OPEN | Skill match exists only in company projection, not scoped applicant grid. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-30 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-31 | OPEN | Internal application IDs are mapped; durable company portal IDs remain unimplemented. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-31 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-38 | OPEN | Persisted conflict warnings exist; unsaved modal scheduling warnings remain open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-38 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-43 | OPEN | Reviewed round staging/apply path exists; auto-apply company results toggle absent. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-43 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-46 | OPEN | Evaluation plan editing exists; safe round deletion and attendance guard parity open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-46 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-50 | OPEN | Offer-state check label exists; held-offer rule verdict is not inferred. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-50 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-54 | BLOCKED | Private offer-letter storage and malware scanner required for document uploads. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-54 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-55 | OPEN | Audited guarded offer changes exist; reminder/note/letter window incomplete. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-55 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-57 | OPEN | Respond-by guidance exists; holiday/Sunday minimum expiry rule remains open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-57 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-59 | OPEN | College/job-scoped recruiter threads exist; separate internal team thread remains open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-59 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-61 | OPEN | Recruiter invitation service exists; per-drive invite flow and delivery choices open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-61 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-63 | OPEN | Per-applicant force include/exclude exists; named drive-wide picker/notice missing. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-63 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-64 | DONE | Closed-drive recruiter conversation remains accessible in scoped Discussion. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-64 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-65 | BLOCKED | Private resume ZIP requires storage scanner and email provider credentials. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-65 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-67 | OPEN | Applicant review drawer links to full details; full StudentPanel remains open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-67 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-69 | OPEN | Bulk preview, retries and audit ledger exist; remaining grouped exception UX open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-69 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-70 | OPEN | Reviewed controls replace some native confirmation paths; full action audit remains open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-70 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-72 | OPEN | Mobile section picker exists; mobile Actions window and full card parity remain open. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-72 partial or implemented scope is recorded without inferring unsupported parity`. |
| TPO-drive-workspace-74 | NOT-A-GAP | Legacy recruiter key bug is not inherited by college-scoped vNext projection. `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-74 partial or implemented scope is recorded without inferring unsupported parity`. |

Source areas: `src/modules/placements/tpo-delete-draft-{model,service}.ts`, `src/app/api/placements/tpo/jobs/[jobId]/delete-draft/route.ts`, `src/components/placements/tpo-delete-draft-action.tsx`, `src/modules/placements/tpo-applicant-pipeline-{model,service}.ts`, `src/components/tpo/tpo-applications-spreadsheet.tsx`, `src/modules/placements/tpo-drive-applications-export-service.ts`, `src/modules/placements/tpo-drive-offer-register-model.ts`, and related role pages. No numbered migration touched.

## Chat-5 follow-up evidence — isolated database contract

| Gap | Status | Evidence |
|---|---|---|
| TPO-drive-workspace-06 | DONE (pending orchestrator execution) | `src/modules/placements/tpo-delete-draft-service.ts`, `src/app/api/placements/tpo/jobs/[jobId]/delete-draft/route.ts`; `tests/integration/tpo-delete-draft-chat5.test.ts` — `TPO-drive-workspace-06 archives only empty unpublished drafts after scoped version and audit checks`. Empty, correct-version unpublished drafts archive with an activity event; archived history stays in the database. |
| TPO-drive-workspace-R06 | OPEN | Same integration file — `TPO-drive-workspace-R06 refuses an abandoned draft that already has an applicant`. This proves safe archive as a fallback but does not implement distinct draft cancellation. |
| TPO-drive-workspace-09 | OPEN (copy partial) | `src/components/placements/placement-drive-workspace.tsx`, `src/components/placements/tpo-delete-draft-action.tsx`; `tests/unit/tpo-drive-workspace-chat5-round6.test.ts` — `TPO-drive-workspace-09 partial or implemented scope is recorded without inferring unsupported parity`. Exact legacy Delete draft, Applicants, Close drive and company/job heading restored; remaining workspace headings not all checked. |

This test file uses `DB09_ISOLATED_TEST_DATABASE` and `TEST_DATABASE_URL` and follows the existing disposable-database guard. The test was not executed by chat-5.

## Chat-5 draft cancellation (2026-10-17)

| TPO-drive-workspace-R06 | DONE | `src/modules/placements/tpo-drive-cancel-model.ts`, `src/modules/placements/tpo-drive-cancel-service.ts` permit audited, versioned draft cancellation without an active season while published drives still require an active season; UI opens existing impact/confirmation page for either; `tests/unit/tpo-drive-workspace-r06-chat5.test.ts` — `TPO-drive-workspace-R06 can cancel drafts with audited preview while published drives respect season`. |
