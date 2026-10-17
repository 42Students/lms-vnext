# Chat-6: source verification inventory — 2026-10-18, round 15

This record certifies **existing source-level evidence**, **not executed test results**. On `chatgpt/chat-6-b`, the following 31 formerly `FIXED-ON-MAIN` or `OPEN` entries have a named `it(...)` case containing the gap ID and a matching pre-existing acceptance row with DONE disposition. Their queue entries were reconciled to DONE in source-specific commits. PostgreSQL, unit-suite, browser and mobile signoffs remain separate.

| Gap ID | Named unit test (existing) | Existing acceptance record |
|---|---|---|
| `FAC-assessments-23` | `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` · FAC-assessments-23 grade pending and graded points wording | `docs/audit/acceptance/faculty-assessments-verification.md` |
| `FAC-assessments-29` | `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` · FAC-assessments-29 stacked mobile assessment and grading actions | `docs/audit/acceptance/faculty-assessments-verification.md` |
| `FAC-assessments-18` | `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` · FAC-assessments-18 per-question 100 point limit | `docs/audit/acceptance/faculty-assessments-verification.md` |
| `FAC-assessments-19` | `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` · FAC-assessments-19 per-assignment 1000 point limit | `docs/audit/acceptance/faculty-assessments-verification.md` |
| `FAC-assessments-21` | `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` · FAC-assessments-21 grading student navigation and picker | `docs/audit/acceptance/faculty-assessments-verification.md` |
| `FAC-assessments-30` | `tests/unit/chat6-faculty-assessments-gap-closure.test.ts` · FAC-assessments-30 legacy all courses filter | `docs/audit/acceptance/faculty-assessments-verification.md` |
| `SA-academics-people-116` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-116 faculty and students roster links restore per-person lifecycle actions | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-80` | `tests/unit/chat6-superadmin-people-round3.test.ts` · SA-academics-people-80 registers faculty with structured name and Indian mobile through college-scoped onboarding | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-81` | `tests/unit/chat6-superadmin-people-round3.test.ts` · SA-academics-people-81 supports editing faculty profile, department and employment fields | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-82` | `tests/unit/chat6-superadmin-people-verified-closure.test.ts` · SA-academics-people-82 validates the 500-row faculty sample and preserves row result feedback | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-83` | `tests/unit/chat6-superadmin-people-round3.test.ts` · SA-academics-people-83 exposes college-scoped suspend and reactivate actions with reason | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-88` | `tests/unit/chat6-superadmin-people-round3.test.ts` · SA-academics-people-88 provides editable membership profiles and audit trail detail links | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-93` | `tests/unit/chat6-superadmin-people-verified-closure.test.ts` · SA-academics-people-93 registers a student with a chosen program batch and class | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-96` | `tests/unit/chat6-superadmin-people-round3.test.ts` · SA-academics-people-96 supports student suspend and reactivate via membership lifecycle | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-102` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-102 teaching assignments include class filter and semester-year-role CSV | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-104` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-104 People Directory exposes legacy All contacts Faculty and Students tabs | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-105` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-105 membership directory has contact search page sizing filters and CSV | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-107` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-107 People membership page exports selected college contacts | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-113` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-113 recruiter list shows status counts actions and terminate sessions drawer | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-115` | `tests/unit/chat6-superadmin-mentor-role-round3.test.ts` · SA-academics-people-115 recognizes real mentor memberships and filters faculty by mentor role | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-89` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-89 faculty roster has department and type filters with bounded search | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-90` | `tests/unit/chat6-superadmin-people-columns-round3.test.ts` · SA-academics-people-90 faculty roster has gender department type and private college scoped contact columns | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-97` | `tests/unit/chat6-superadmin-people-round3.test.ts` · SA-academics-people-97 supports safe bulk student module overrides with selection cap | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-98` | `tests/unit/chat6-superadmin-people-parity-verified.test.ts` · SA-academics-people-98 student roster filters department program batch class and search roll | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-99` | `tests/unit/chat6-superadmin-people-columns-round3.test.ts` · SA-academics-people-99 student roster has gender roll class and college scoped contact columns | `docs/audit/acceptance/superadmin-academics-people-3-people-recruiters-verification.md` |
| `SA-academics-people-57` | `tests/unit/chat6-superadmin-course-entrypoints.test.ts` · SA-academics-people-57 lessons have course filter CSV and bulk visibility controls | `docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md` |
| `SA-academics-people-68` | `tests/unit/chat6-cross-page-verification-round4.test.ts` · SA-academics-people-68 filters course progress by course and batch with legacy completion guidance | `docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md` |
| `SA-academics-people-69` | `tests/unit/chat6-superadmin-content-verified-exports.test.ts` · SA-academics-people-69 exposes four selected-college bounded CSV endpoints | `docs/audit/acceptance/superadmin-academics-people-2-courses-content-verification.md` |
| `COL-placements-01` | `tests/unit/chat6-college-placement-verified-pipeline.test.ts` · COL-placements-01 supports transition guards and per-row/bulk Reinstate/Move | `docs/audit/acceptance/college-placements-verification.md` |
| `COL-placements-04` | `tests/unit/chat6-college-placement-verified-pipeline.test.ts` · COL-placements-04 schedules and changes college interview outcomes | `docs/audit/acceptance/college-placements-verification.md` |
| `COL-placements-15` | `tests/unit/chat11-college-unconfirmed-decisions-round10.test.ts` · COL-placements-15 lists archived companies and restores only a selected college relationship | `docs/audit/acceptance/college-placements-verification.md` |

## Four incorrect audit classifications independently reconciled

- `FAC-assessments-15` DONE: the published assignment's deadline, points, audience and submission-method locks are already exercised by `tests/unit/chat6-faculty-round2.test.ts` → `FAC-assessments-15 allows title corrections but locks deadline points and methods after submission`.
- `FAC-assessments-25` NOT-A-GAP: course/lesson/due-date/created-status presentation is covered by `tests/unit/chat6-faculty-assessments-gap-closure.test.ts`.
- `FAC-assessments-26` NOT-A-GAP: zero-submission draft review remains available, covered by the same legacy gap suite.
- `FAC-assessments-28` NOT-A-GAP: report headings/download and incompleteness confirmation are covered by the same legacy gap suite.

## Correctly gated infrastructure-only work

`FAC-assessments-01/22` and `SA-academics-people-58/59` are marked BLOCKED on verified private object storage and malware scanning, and `SA-placements-projects-116` is BLOCKED for Telegram provider credentials. Link-only functionality already implemented remains available; no synthetic storage or provider success is claimed.

## Remaining open functionality

`SA-academics-people-101` has its selected-college, audited create form but lacks complete role-edit flow. `SA-placements-projects-115` has sanitized summary + checked SQL copy, but full create-and-link issue handling remains OPEN. Other open gaps remain actionable and must not be closed by changing status alone.

## Stale CI report reconciliation

`docs/orchestrator/typecheck-errors.md` on main lists no chat-6-owned current TypeScript failures (its last failures are college-company-service/test type mismatches assigned to chat-11). `docs/orchestrator/unit-failures-r1.md` is historical: its chat-6 zero-point, recruiter heading and Super Admin Audit Findings assertions match current source. Test executions were not performed in this lane; the orchestrator must rerun CI.
