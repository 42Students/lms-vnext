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

## Round 3 source parity verification — runtime acceptance pending

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-80 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/faculty/page.tsx`, `src/components/admin/person-onboard-dialog.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-80 registers faculty with structured name and Indian mobile through college-scoped onboarding` |
| SA-academics-people-81 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/faculty/page.tsx`, `src/components/college/college-person-edit-action.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-81 supports editing faculty profile, department and employment fields` |
| SA-academics-people-83 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/faculty/page.tsx`, `src/components/admin/scoped-membership-lifecycle-actions.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-83 exposes college-scoped suspend and reactivate actions with reason` |
| SA-academics-people-88 | DONE (source verified; runtime pending) | `src/components/admin/person-membership-actions.tsx`, `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-88 provides editable membership profiles and audit trail detail links` |
| SA-academics-people-96 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/students/page.tsx`, `src/components/admin/scoped-membership-lifecycle-actions.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-96 supports student suspend and reactivate via membership lifecycle` |
| SA-academics-people-97 | DONE (source verified; runtime pending) | `src/app/(authenticated)/admin/students/page.tsx`, `src/components/admin/super-admin-student-bulk-access.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-97 supports safe bulk student module overrides with selection cap` |
| SA-academics-people-112 | DONE (source verified; runtime pending) | `src/components/admin/super-admin-hr-accounts.tsx`, `src/components/admin/super-admin-hr-detail-drawer.tsx`; `tests/unit/chat6-superadmin-people-round3.test.ts` → `SA-academics-people-112 restricts recruiter account-wide actions outside selected scope` |

| SA-academics-people-90 | DONE (source authored; tenant PostgreSQL pending) | `src/modules/admin-ui/super-admin-scoped-people-service.ts`; `tests/unit/chat6-superadmin-people-columns-round3.test.ts` → `SA-academics-people-90 faculty roster has gender department type and private college scoped contact columns` |
| SA-academics-people-99 | DONE (source authored; tenant PostgreSQL pending) | `src/modules/admin-ui/super-admin-scoped-people-service.ts`; `tests/unit/chat6-superadmin-people-columns-round3.test.ts` → `SA-academics-people-99 student roster has gender roll class and college scoped contact columns` |

| SA-academics-people-115 | DONE (source authored; PostgreSQL scope test pending) | `src/modules/admin-ui/super-admin-scoped-people-service.ts`, `src/components/admin/admin-scoped-read-page.tsx`; `tests/unit/chat6-superadmin-mentor-role-round3.test.ts` → `SA-academics-people-115 recognizes real mentor memberships and filters faculty by mentor role` |

| SA-academics-people-109 | DONE with OD-23 no-hard-delete deviation (source authored; runtime pending) | `src/components/admin/super-admin-hr-accounts.tsx`, `src/components/admin/super-admin-hr-account-dialog.tsx`; `tests/unit/chat6-recruiter-lifecycle-round3.test.ts` → `SA-academics-people-109 offers suspend and reactivate with confirmation and session-safe archive` |
| SA-academics-people-114 | DONE (source authored; browser parity pending) | `src/components/admin/super-admin-hr-accounts.tsx`, `src/components/admin/super-admin-hr-detail-drawer.tsx`; `tests/unit/chat6-recruiter-lifecycle-round3.test.ts` → `SA-academics-people-114 restores recruiter accounts page search and college access copy` |

## Round 4 source verification (tests authored, not run)

| SA-academics-people-79 | DONE (source authored; PostgreSQL/runtime pending) | `src/components/admin/admin-scoped-read-page.tsx`, `src/app/(authenticated)/admin/faculty/page.tsx`, `src/app/(authenticated)/admin/students/page.tsx`; `tests/unit/chat6-cross-page-verification-round4.test.ts` → `SA-academics-people-79 renders selected-college faculty and student overview metrics from scoped directory counts` |

| SA-academics-people-108 | DONE (source authored; integration pending) | `src/components/admin/super-admin-hr-account-dialog.tsx`, persisted `src/modules/placements/super-admin-hr-service.ts`; `tests/unit/chat6-recruiter-identity-and-expiry-round5.test.ts` → `SA-academics-people-108 provides structured recruiter name, designation, new company and multi-college creation`. |
| SA-academics-people-110 | DONE (source authored; tenant PostgreSQL pending) | `src/modules/placements/super-admin-hr-service.ts`, `src/components/admin/super-admin-hr-detail-drawer.tsx`; `tests/unit/chat6-recruiter-identity-and-expiry-round5.test.ts` → `SA-academics-people-110 preserves grant expiry and scoped active revoked expired history`. |
