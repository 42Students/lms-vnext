# Gap FIX proof — lane chat-4

## U010: `docs/audit/gap2/lane-4/superadmin-sections-assignments.md` — IN PROGRESS

**Queue status:** `[ ]` (not complete; do not mark as fixed). Work is restricted to this first document until all its GAP/MISSING rows are resolved. This is an implementation checkpoint, not a completion proof.

**P1 code changes implemented (subject to runtime parity verification):**
- G2-4-010-010, 011, 109, 110: college-scoped Course picker (searchable datalist), dependent Section selector with reset on Course edit, and exact delivery ID filtering/pagination via the assessment query/service. Includes the quiz directory only where necessary to maintain the shared component contract.
- G2-4-010-030, 032, 062, 114: initialize points at 0, accept 0 through the College Admin create/edit UI; existing Zod/database checks already allow 0. Default new assignments to `WRITTEN_RESPONSE` and reset it on new draft.
- G2-4-010-031, 113: allow 255 title characters in create/edit and show `e.g., Module 1 Project` placeholder; existing API schema accepts 255.
- G2-4-010-072, 124: implement current-page CSV export with legacy column order, IST wall-clock deadlines, `assignments-college-<college>-page-<page>.csv` filename and disabled action when page is empty. Preserve full-filter export as a separate action. Both College Admin and Super Admin routes have a page-only mode.

**Partial rows (NOT credited as complete):**
- G2-4-010-022: list now displays `not graded` as submitted-currently-eligible minus graded-currently-eligible; legacy denominator/history semantics remain to reconcile.
- G2-4-010-008, 035, 040, 073: create trigger label, instructions placeholder and rows, stale-version copy, page-export column/order are aligned or improved, but the full modal/form/grade flow remains open.
- G2-4-010-025: page still uses 25 rows; legacy is 20, so current-page export is not yet exact 20-row parity.

**Outstanding P1:** resource/PDF/file/Drive picker and signed upload persistence (015/036/037/042/052/074/092/097/131/132), server-side atomic bulk grade publish and audit receipts (054/089/093/101/120), grade re-hide (064/122), list error boundary (068), deletion/archival parity (055), and end-to-end validation for options/export. P2/P3 are not yet completed.

**UNKNOWN rows** (leave untouched until evidence): 028, 056, 058, 065, 071, 075, 076, 091, 102, 121, 125, 130. These require live/service checks or scope-switch validation; no claim of resolution.

**Files changed on the lane branch:** `src/components/courses/college-assignment-create.tsx`, `college-assignment-actions.tsx`, `college-assessment-aggregate.tsx`, `college-assessment-course-section-filters.tsx`, `src/modules/courses/college-assessment-aggregate-model.ts`, `college-assessment-aggregate-service.ts`, `college-assessment-export-model.ts`, `college-assessment-export-service.ts`, `admin-assessment-directory-model.ts`, `src/modules/admin-ui/super-admin-learning-csv-service.ts`, both College Admin assignment/quiz pages, Super Admin assignments page, assignment CSV route.

**Verification:** edited files fetched/read back after writes; project code, tests, lint, typecheck, browser and CI deliberately not run (lane instruction). Manual compile/browser checks remain open.
