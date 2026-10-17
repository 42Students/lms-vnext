# Super Admin / People, faculty, students and recruiter verification

Evidence reviewed against `docs/audit/pages/superadmin/academics-people-3-people-recruiters.md` and `docs/audit/owner-decisions-resolved.md`. Tests are **written but not run** by this builder.

| ID | Status | Evidence and named test |
|---|---|---|
| SA-academics-people-78 | DONE | `src/components/admin/admin-scoped-read-page.tsx`; `tests/unit/chat6-superadmin-people-verified-closure.test.ts` → `SA-academics-people-78 uses the legacy exact no-college title and contextual noun` |
| SA-academics-people-82 | DONE | `src/modules/people/faculty-bulk-import-model.ts, src/components/admin/super-admin-faculty-bulk-import.tsx`; `tests/unit/chat6-superadmin-people-verified-closure.test.ts` → `SA-academics-people-82 validates the 500-row faculty sample and preserves row result feedback` |
| SA-academics-people-93 | DONE | `src/components/college/college-student-register-form.tsx`; `tests/unit/chat6-superadmin-people-verified-closure.test.ts` → `SA-academics-people-93 registers a student with a chosen program batch and class` |
| SA-academics-people-84 | NOT-A-GAP | `docs/audit/owner-decisions-resolved.md OD-23`; `tests/unit/chat6-superadmin-people-verified-closure.test.ts` → `SA-academics-people-84 NOT-A-GAP keeps suspend/end instead of hard delete per OD-23` |
| SA-academics-people-87 | NOT-A-GAP | `docs/audit/owner-decisions-resolved.md OD-23`; `tests/unit/chat6-superadmin-people-verified-closure.test.ts` → `SA-academics-people-87 NOT-A-GAP prohibits impersonation per OD-23` |

| SA-academics-people-89 | DONE | `src/components/admin/admin-scoped-read-page.tsx`, `src/modules/admin-ui/super-admin-scoped-people-service.ts`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-89 faculty roster has department and type filters with bounded search` |
| SA-academics-people-98 | DONE | `src/components/admin/admin-scoped-read-page.tsx`, `src/modules/admin-ui/super-admin-scoped-people-service.ts`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-98 student roster filters department program batch class and search roll` |
| SA-academics-people-102 | DONE | `src/app/(authenticated)/admin/faculty-assignment/page.tsx`, `src/modules/admin-ui/super-admin-faculty-assignments-service.ts`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-102 teaching assignments include class filter and semester-year-role CSV` |
| SA-academics-people-104 | DONE | `src/app/(authenticated)/admin/people/directory/page.tsx`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-104 People Directory exposes legacy All contacts Faculty and Students tabs` |
| SA-academics-people-105 | DONE | `src/app/(authenticated)/admin/people/page.tsx`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-105 membership directory has contact search page sizing filters and CSV` |
| SA-academics-people-107 | DONE | `src/app/(authenticated)/admin/people/page.tsx`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-107 People membership page exports selected college contacts` |
| SA-academics-people-113 | DONE | `src/components/admin/super-admin-hr-accounts.tsx`, `src/components/admin/super-admin-hr-detail-drawer.tsx`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-113 recruiter list shows status counts actions and terminate sessions drawer` |
| SA-academics-people-116 | DONE | `src/app/(authenticated)/admin/faculty/page.tsx`, `src/app/(authenticated)/admin/students/page.tsx`; `tests/unit/chat6-superadmin-people-parity-verified.test.ts` → `SA-academics-people-116 faculty and students roster links restore per-person lifecycle actions` |

Unresolved: faculty register optional profile fields; platform-wide account block; fuller faculty/student profile editing; faculty reassign sessions; student bulk import and history; recruiter company creation, account lifecycle and historic grants; remaining roster/export and wording parity. Previous partial wording edits to -91/-100/-103/-114 are not yet full gap closures.
