# Gap closure queue: chat-5

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round). Branch: `chatgpt/chat-5-b`. 225 gaps on 4 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/drive-workspace (72: FIXED-ON-MAIN 33, OPEN 34, UNCONFIRMED 5)

Audit: `docs/audit/pages/tpo/drive-workspace.md` (and `drive-workspace-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-drive-workspace-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-drive-workspace-17 | S1 | SIDE-EFFECT | DONE |
| TPO-drive-workspace-18 | S1 | SIDE-EFFECT | DONE |
| TPO-drive-workspace-28 | S1 | MISSING-ACTION | DONE |
| TPO-drive-workspace-40 | S1 | MISSING-EXPORT | DONE |
| TPO-drive-workspace-42 | S1 | MISSING-MODAL | DONE |
| TPO-drive-workspace-44 | S1 | MISSING-MODAL | DONE |
| TPO-drive-workspace-47 | S1 | MISSING-ACTION | DONE |
| TPO-drive-workspace-48 | S1 | MISSING-MODAL | DONE |
| TPO-drive-workspace-53 | S1 | MISSING-ACTION | DONE |
| TPO-drive-workspace-60 | S1 | MISSING-TAB | DONE |
| TPO-drive-workspace-62 | S1 | MISSING-TAB | DONE |
| TPO-drive-workspace-65 | S1 | MISSING-FIELD | OPEN |
| TPO-drive-workspace-R01 | S1 | PERMISSION | DONE |
| TPO-drive-workspace-01 | S2 | MISSING-TAB | DONE |
| TPO-drive-workspace-04 | S2 | MISSING-ACTION | DONE |
| TPO-drive-workspace-05 | S2 | MISSING-ACTION | DONE |
| TPO-drive-workspace-10 | S2 | VALIDATION | NOT-A-GAP |
| TPO-drive-workspace-11 | S2 | PERMISSION | OPEN |
| TPO-drive-workspace-12 | S2 | MISSING-ACTION | UNCONFIRMED |
| TPO-drive-workspace-14 | S2 | VALIDATION | DONE |
| TPO-drive-workspace-16 | S2 | MISSING-ACTION | DONE |
| TPO-drive-workspace-20 | S2 | MISSING-FILTER | DONE |
| TPO-drive-workspace-21 | S2 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-22 | S2 | MISSING-COLUMN | OPEN |
| TPO-drive-workspace-23 | S2 | MISSING-FILTER | OPEN |
| TPO-drive-workspace-26 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-drive-workspace-27 | S2 | MISSING-MODAL | OPEN |
| TPO-drive-workspace-29 | S2 | MISSING-COLUMN | DONE |
| TPO-drive-workspace-38 | S2 | MISSING-FIELD | UNCONFIRMED |
| TPO-drive-workspace-41 | S2 | MISSING-ACTION | DONE |
| TPO-drive-workspace-45 | S2 | MISSING-FIELD | DONE |
| TPO-drive-workspace-49 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-drive-workspace-50 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-drive-workspace-51 | S2 | MISSING-ACTION | UNCONFIRMED |
| TPO-drive-workspace-52 | S2 | MISSING-ACTION | DONE |
| TPO-drive-workspace-54 | S2 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-55 | S2 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-59 | S2 | MISSING-TAB | OPEN |
| TPO-drive-workspace-61 | S2 | MISSING-MODAL | OPEN |
| TPO-drive-workspace-63 | S2 | MISSING-MODAL | OPEN |
| TPO-drive-workspace-67 | S2 | MISSING-MODAL | OPEN |
| TPO-drive-workspace-68 | S2 | MISSING-FIELD | DONE |
| TPO-drive-workspace-69 | S2 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-R02 | S2 | MISSING-FILTER | DONE |
| TPO-drive-workspace-R03 | S2 | MISSING-ACTION | DONE |
| TPO-drive-workspace-06 | S3 | MISSING-ACTION | DONE |
| TPO-drive-workspace-07 | S3 | MISSING-ACTION | DONE |
| TPO-drive-workspace-08 | S3 | STATE | OPEN |
| TPO-drive-workspace-09 | S3 | COPY | OPEN |
| TPO-drive-workspace-19 | S3 | MISSING-FIELD | DONE |
| TPO-drive-workspace-24 | S3 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-30 | S3 | MISSING-COLUMN | OPEN |
| TPO-drive-workspace-31 | S3 | MISSING-FIELD | OPEN |
| TPO-drive-workspace-32 | S3 | COPY | DONE |
| TPO-drive-workspace-34 | S3 | VALIDATION | DONE |
| TPO-drive-workspace-36 | S3 | MISSING-ACTION | DONE |
| TPO-drive-workspace-39 | S3 | STATE | OPEN |
| TPO-drive-workspace-43 | S3 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-46 | S3 | MISSING-ACTION | OPEN |
| TPO-drive-workspace-56 | S3 | MISSING-EXPORT | OPEN |
| TPO-drive-workspace-57 | S3 | COPY | DONE |
| TPO-drive-workspace-58 | S3 | MISSING-TAB | DONE |
| TPO-drive-workspace-64 | S3 | MISSING-ACTION | DONE |
| TPO-drive-workspace-70 | S3 | A11Y | OPEN |
| TPO-drive-workspace-72 | S3 | RESPONSIVE | DONE |
| TPO-drive-workspace-73 | S3 | PERFORMANCE | OPEN |
| TPO-drive-workspace-R04 | S3 | A11Y | DONE |
| TPO-drive-workspace-R05 | S3 | COPY | DONE |
| TPO-drive-workspace-R06 | S3 | MISSING-ACTION | DONE |
| TPO-drive-workspace-66 | S4 | MISSING-FIELD | OPEN |
| TPO-drive-workspace-71 | S4 | A11Y | DONE |
| TPO-drive-workspace-74 | S4 | STATE | UNCONFIRMED |

## tpo/batches (63: FIXED-ON-MAIN 27, OPEN 34, UNCONFIRMED 2)

Audit: `docs/audit/pages/tpo/batches.md` (and `batches-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-batches-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-batches-19 | S1 | MISSING-ACTION | DONE |
| TPO-batches-02 | S2 | MISSING-FIELD | DONE |
| TPO-batches-03 | S2 | COPY | DONE |
| TPO-batches-04 | S2 | MISSING-FIELD | DONE |
| TPO-batches-05 | S2 | MISSING-ACTION | DONE |
| TPO-batches-07 | S2 | STATE | DONE |
| TPO-batches-08 | S2 | MISSING-ACTION | DONE |
| TPO-batches-20 | S2 | MISSING-ACTION | OPEN |
| TPO-batches-21 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-batches-22 | S2 | MISSING-ACTION | DONE |
| TPO-batches-26 | S2 | VALIDATION | DONE |
| TPO-batches-33 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-batches-34 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-batches-35 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-batches-36 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-batches-37 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-batches-38 | S2 | VALIDATION | DONE |
| TPO-batches-39 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-batches-41 | S2 | MISSING-ACTION | DONE |
| TPO-batches-42 | S2 | SIDE-EFFECT | DONE |
| TPO-batches-44 | S2 | MISSING-ACTION | OPEN |
| TPO-batches-45 | S2 | MISSING-EXPORT | OPEN |
| TPO-batches-53 | S2 | MISSING-TAB | OPEN |
| TPO-batches-54 | S2 | SIDE-EFFECT | OPEN |
| TPO-batches-58 | S2 | MISSING-FIELD | DONE |
| TPO-batches-59 | S2 | MISSING-FIELD | DONE |
| TPO-batches-06 | S3 | MISSING-FIELD | DONE |
| TPO-batches-09 | S3 | STATE | DONE |
| TPO-batches-10 | S3 | MISSING-FIELD | DONE |
| TPO-batches-11 | S3 | MISSING-FILTER | OPEN |
| TPO-batches-13 | S3 | COPY | DONE |
| TPO-batches-14 | S3 | COPY | DONE |
| TPO-batches-15 | S3 | STATE | UNCONFIRMED |
| TPO-batches-16 | S3 | STATE | DONE |
| TPO-batches-23 | S3 | MISSING-FIELD | DONE |
| TPO-batches-25 | S3 | MISSING-ACTION | DONE |
| TPO-batches-27 | S3 | COPY | DONE |
| TPO-batches-28 | S3 | STATE | DONE |
| TPO-batches-29 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-batches-40 | S3 | COPY | DONE |
| TPO-batches-43 | S3 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-batches-46 | S3 | MISSING-ACTION | OPEN |
| TPO-batches-47 | S3 | MISSING-ACTION | DONE |
| TPO-batches-48 | S3 | STATE | FIXED-ON-MAIN |
| TPO-batches-50 | S3 | STATE | OPEN |
| TPO-batches-52 | S3 | COPY | DONE |
| TPO-batches-55 | S3 | MISSING-ACTION | OPEN |
| TPO-batches-56 | S3 | COPY | DONE |
| TPO-batches-60 | S3 | COPY | DONE |
| TPO-batches-61 | S3 | MISSING-ACTION | DONE |
| TPO-batches-63 | S3 | SIDE-EFFECT | OPEN |
| TPO-batches-64 | S3 | PERMISSION | UNCONFIRMED |
| TPO-batches-R04 | S3 | VALIDATION | OPEN |
| TPO-batches-12 | S4 | STATE | DONE |
| TPO-batches-17 | S4 | STATE | OPEN |
| TPO-batches-24 | S4 | MISSING-FIELD | OPEN |
| TPO-batches-30 | S4 | A11Y | DONE |
| TPO-batches-49 | S4 | MISSING-ACTION | OPEN |
| TPO-batches-51 | S4 | COPY | DONE |
| TPO-batches-57 | S4 | VALIDATION | DONE |
| TPO-batches-62 | S4 | MISSING-TAB | DONE |
| TPO-batches-65 | S4 | RESPONSIVE | OPEN |
| TPO-batches-R06 | S4 | COPY | DONE |

## tpo/students (56: FIXED-ON-MAIN 24, OPEN 29, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/students.md` (and `students-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-students-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-students-33 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-06 | S2 | MISSING-ACTION | OPEN |
| TPO-students-07 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-08 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-09 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-10 | S2 | MISSING-ACTION | OPEN |
| TPO-students-11 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-12 | S2 | MISSING-ACTION | OPEN |
| TPO-students-14 | S2 | MISSING-FIELD | OPEN |
| TPO-students-15 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-students-16 | S2 | MISSING-ACTION | OPEN |
| TPO-students-17 | S2 | MISSING-ACTION | OPEN |
| TPO-students-18 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-20 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-21 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-22 | S2 | MISSING-FILTER | OPEN |
| TPO-students-23 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-26 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-28 | S2 | MISSING-COLUMN | OPEN |
| TPO-students-29 | S2 | MISSING-FIELD | OPEN |
| TPO-students-30 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-31 | S2 | MISSING-FIELD | OPEN |
| TPO-students-32 | S2 | STATE | OPEN |
| TPO-students-34 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-35 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-36 | S2 | MISSING-EXPORT | OPEN |
| TPO-students-54 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-13 | S3 | MISSING-ACTION | OPEN |
| TPO-students-24 | S3 | MISSING-FILTER | OPEN |
| TPO-students-25 | S3 | MISSING-FILTER | OPEN |
| TPO-students-27 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-37 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-38 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-39 | S3 | MISSING-ACTION | OPEN |
| TPO-students-40 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-41 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-42 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-students-43 | S3 | MISSING-TAB | OPEN |
| TPO-students-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-45 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-46 | S3 | COPY | OPEN |
| TPO-students-47 | S3 | COPY | OPEN |
| TPO-students-49 | S3 | PERMISSION | UNCONFIRMED |
| TPO-students-50 | S3 | STATE | UNCONFIRMED |
| TPO-students-51 | S3 | RESPONSIVE | OPEN |
| TPO-students-52 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-R02 | S3 | STATE | FIXED-ON-MAIN |
| TPO-students-R03 | S3 | STATE | OPEN |
| TPO-students-R04 | S3 | STATE | OPEN |
| TPO-students-R05 | S3 | COPY | OPEN |
| TPO-students-R06 | S3 | COPY | OPEN |
| TPO-students-R07 | S3 | STATE | OPEN |
| TPO-students-R08 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-48 | S4 | STATE | OPEN |
| TPO-students-53 | S4 | MISSING-FIELD | OPEN |

## tpo/requests-verification (34: OPEN 15, FIXED-ON-MAIN 18, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/requests-verification.md` (and `requests-verification-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-requests-verification-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-requests-verification-01 | S1 | MISSING-ACTION | OPEN |
| TPO-requests-verification-02 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-requests-verification-03 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-requests-verification-04 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-05 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-07 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-13 | S2 | MISSING-ACTION | OPEN |
| TPO-requests-verification-22 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-23 | S2 | STATE | OPEN |
| TPO-requests-verification-24 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-26 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-36 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-37 | S2 | MISSING-ACTION | OPEN |
| TPO-requests-verification-38 | S2 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-R02 | S2 | MISSING-FIELD | OPEN |
| TPO-requests-verification-06 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-09 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-10 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-12 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-14 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-15 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-17 | S3 | COPY | OPEN |
| TPO-requests-verification-25 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-27 | S3 | COPY | OPEN |
| TPO-requests-verification-28 | S3 | COPY | OPEN |
| TPO-requests-verification-29 | S3 | MISSING-FIELD | UNCONFIRMED |
| TPO-requests-verification-30 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-32 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-R01 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-R03 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-16 | S4 | PERFORMANCE | OPEN |
| TPO-requests-verification-18 | S4 | STATE | OPEN |
| TPO-requests-verification-21 | S4 | PERMISSION | OPEN |

## Notes (blockers, one line each)
- TPO-drive-workspace-65 BLOCKED: resume ZIP needs private bucket/malware scanner; emailed six-digit passcode needs real provider credentials (OD-09 resolved, privacy projection tested, token-only delivery not marked secure closure).
- TPO-drive-workspace-18 PENDING REGISTRATION: `docs/proposed-migrations/tpo-drive-workspace-18-cancel-selections.sql` permits terminal CANCELLED; Drizzle/service and named PostgreSQL test pushed, acceptance must follow numbered migration replay.
- TPO-drive-workspace-28 OPEN: registration/reminder and once-per-IST-day notification exist; persist 48-hour learner opt-out before claiming proxy-application closure.
- TPO-drive-workspace-40 OPEN: strict 1,000-row CSV/XLSX import and named tests exist; company-portal identity mapping remains unimplemented, do not claim source ID matches.


- TPO-drive-workspace-41 ROUND-2: bulk recorder now wired into /rounds/[roundId]/results with college-scoped roll search/paste, unique matching, 25-row limit and named tests; round roster over 500 fails closed.
- TPO-drive-workspace-05 ROUND-2: cloned drafts now clear old cohort IDs and filter old passing years, with named pure-model test; TPO must review eligibility before publishing.
- TPO-drive-workspace-22 ROUND-2 OPEN: roll/email/phone now appear in the spreadsheet, but branch/batch/academic proof/full legacy field set not yet shown.
- TPO-drive-workspace-49 ROUND-2 OPEN: saved salary bands, export and response timing verified, but fixed/variable full rules, column/filter parity still missing; deliberately not marked DONE.
- TPO-drive-workspace-11 ROUND-2 OPEN: college-admin tpo.access permission path has TPO-only route/service guards; needs coordinated permission and persisted-actor implementation, not an implicit role bypass.
- TPO-drive-workspace-54 BLOCKED: PDF/PNG/JPG letter upload needs authenticated object storage and malware scanner; URL-based letter evidence can be built separately.

## Needs shell (chat-9 only)



## Chat-5 round 3 — 2026-10-17 handoff

- Ownership: TPO drive-workspace then TPO batches only; `tpo/students` and `tpo/requests-verification` were reassigned to chat-12 and left unchanged.
- TPO-drive-workspace-07/19/32/36/58/R04/R05 and -74: inspected implementation or corrected UI text, named tests in `tests/unit/tpo-drive-workspace-s3-chat5-round3.test.ts`, recorded in `docs/audit/acceptance/tpo-drive-workspace-verification.md`; -74 NOT-A-GAP.
- TPO-drive-workspace-57 OPEN: release visibility wording added; holiday-aware offer reply rule still incomplete.
- TPO-batches-19/31/32/01/02/03/04/05/06/08/10/21/22/29/30/33/34/36/37/38/39/40/41/42/48/58/59/13/14: 29 named tests in `tests/unit/tpo-batches-chat5-round3.test.ts` and page verification; only substantively covered gaps marked DONE, 11 partial cases left OPEN.
- TPO-batches-13/14: legacy batch deadline and subtitle copy restored; -03 state cards now use eligible-derived legacy words.
- TPO-batches-39/40: import preview and commit retain form on 409/non-JSON error, no action UUID/server codes shown.
- BLOCKED TPO-drive-workspace-54 and TPO-drive-workspace-65: offer letters/resume ZIP upload needs private object storage and malware scanner; share one-time email code needs provider credentials.
- GR helper integration pending: `src/lib/friendly-error.ts`, `src/lib/api-fetch.ts`, and guarded-action hook not on origin/main at adoption check; no fake helper imports added. Import UI uses local safe fallback messages.
- Tests and builds written but NOT executed by chat-5; orchestrator handles full CI, database integration and runtime certification.

## Chat-5 round 4 (2026-10-17) — branch-only follow-up

- Drive Workspace: `TPO-drive-workspace-59` recruiter Discussion screen and tab built, internal team thread still OPEN; `TPO-drive-workspace-64` closed-drive recruiter follow-up DONE; `TPO-drive-workspace-70` cancellations and lifecycle actions use reviewed checkboxes/ref guards (other destructive offer actions remain OPEN). Named tests: `tests/unit/tpo-drive-discussion-chat5.test.ts`, `tpo-drive-graceful-chat5-round4.test.ts`.
- Batches: `TPO-batches-07` older batch working set DONE; `03` effective placement states DONE; `04` eligible open KPI DONE; `09` priority ordering DONE; `15` no migration jargon DONE; `28` independently fallible secondary counts DONE. Named tests are recorded in the page verification file.
- TPO-batches-26 OPEN: never-invited finish modeled and audited, UI guarded, but `docs/proposed-migrations/tpo-batches-finish-without-invite.sql` requires orchestrator migration registration and PostgreSQL replay before acceptance.
- TPO-batches-39/40 OPEN: importer now uses `apiFetch`, retains editable CSV on failure, and requires visible review without `window.confirm`; remaining modal and wording parity still open.
- GR-04/30/31/32/35/38/71/72/90/91: targeted adoption recorded in `docs/audit/acceptance/graceful-chat-5-verification.md`; global app-wide compliance is not claimed.
- BLOCKED TPO-drive-workspace-54 / -65: private bucket, malware scanner and provider credentials are needed for uploads/emailed share code; do not fabricate delivery.
- All tests were authored but not run by chat-5. Do not treat these entries as CI certification; orchestrator owns builds, DB migration acceptance and Playwright.

## Chat-5 next round — 2026-10-17 source closure

- Merged latest main into chatgpt/chat-5-b at round start; remained branch-only.
- 33 OPEN gap IDs reviewed across Drive Workspace and Batches; each is in a named regression file or explicitly updated page verification. Most partial baselines remain OPEN rather than being falsely marked DONE.
- TPO-drive-workspace-55/70/72: offer lifecycle and offer creation actions now use safe apiFetch; accessible consequence checkbox replaces native confirm, mobile workspace select is available. Full legacy actions/keyboard/mobile parity remain OPEN.
- TPO-drive-workspace-27/34: guarded, retained applicant-screening draft; candidate-visible reason presets with explicit privacy warning. Internal reason and sequential review remain OPEN.
- TPO-batches-52/56: readable eligibility/source/registration labels, and IST rules dates; DONE with named tests.
- TPO-batches-57/60: server reason length corrected, history no longer exposes raw action UUID or UTC date, but remaining cross-layer validation and scope/history parity remain OPEN.
- TPO-batches-39/40/43/49/50/61: unchanged import hint and legacy confirm wording, safe student decision requests, suggested next step, accessible skeleton, reviewed batch undo; remaining modal, Do it, and detailed legacy parity OPEN.
- Partial-only evidence tests in tests/unit/tpo-chat5-open-gap-partial-evidence.test.ts are **not closure** and need more implementation.
- BLOCKED TPO-drive-workspace-54/-65: private uploads require object-storage bucket and malware scanner; one-time emailed share code requires real provider credentials.
- TPO Students and Requests Verification remain with chat-12; no edits to those pages.
- Tests, lint, typecheck, build and database replay were NOT run by chat-5. Orchestrator owns checks.


## Chat-5 next 25+ OPEN review (2026-10-17)

- Fast-forwarded branch from origin/main after previous chat-5 commits were merged. Re-read verified-closure brief and honored reassigned pages: Students/Requests Verification chat-12, Batches WPs chat-6.
- 38 Drive Workspace gap IDs inspected/recorded in `docs/audit/acceptance/tpo-drive-workspace-verification.md`. 4 with source/test completion (06, 34, R01, 64); 1 NOT-A-GAP (74); 2 BLOCKED (54, 65); the remaining IDs stay OPEN for missing legacy features. One named test per source contract in `tests/unit/tpo-drive-workspace-chat5-round6.test.ts`; partial cases are not completion claims.
- TPO-drive-workspace-06: audited version-checked empty-DRAFT archive; dedicated origin-checked route, client action, and isolated PostgreSQL tests in `tests/integration/tpo-delete-draft-chat5.test.ts`. R06 distinct Cancel draft remains OPEN.
- TPO-drive-workspace-21/22: persisted last applied result, batch, branch and academic evidence now appear as new scoped applicant grid fields; remaining full journey/skill/company identifiers still OPEN.
- TPO-drive-workspace-23: server-side flag filters and CSV-aligned preview for Withdrawal requested, No-show, Placed elsewhere and Added by college. Academics ranges and saved views remain OPEN.
- TPO-drive-workspace-27/71: S/R/Ctrl+Enter shortcuts, adjacent applicant links/arrows and guarded reviewed submit. Full modal resume/StudentPanel parity remains OPEN.
- TPO-drive-workspace-49/51/56: persisted fixed/variable/bonus/bond and acceptance dispute evidence in offers register and CSV; full legacy offer action policies/export still OPEN.
- TPO-drive-workspace-08/73: optional panels read concurrently with safe fallback and focus refresh; full per-tab lazy-loading OPEN.
- TPO-drive-workspace-09: corrected company/job heading, exact Delete draft copy, Applicants and Close drive labels; other legacy wording remains OPEN.
- BLOCKED TPO-drive-workspace-54: private offer-letter storage requires object bucket and malware scanning. BLOCKED TPO-drive-workspace-65: secure resume ZIP requires private storage/scanner; emailed one-time code requires provider credentials. Do not fake delivery.
- TPO-drive-workspace-11 OPEN: College Admin permissions require coordinated guard changes across all protected TPO services; never bypass tenancy. TPO-drive-workspace-26 OPEN: 30-second notification hold requires durable delayed-outbox semantics.
- Shared friendly-error, apiFetch and guarded action helpers adopted on modified forms. No tests, typecheck, lint or build executed; orchestrator owns CI and PostgreSQL acceptance.
