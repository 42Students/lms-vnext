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

| SA-academics-people-111 | DONE (source authored; DB/session integration pending) | `src/modules/placements/super-admin-hr-service.ts`, `src/components/admin/super-admin-hr-accounts.tsx`; `tests/unit/chat6-people-phone-session-and-mobile-round6.test.ts` → `SA-academics-people-111 reuses an existing recruiter mobile and revokes all sessions when the login mobile changes`. |

| SA-academics-people-106 | DONE (source authored; real PostgreSQL/session tests pending) | `src/modules/people/super-admin-platform-account-service.ts`, `src/app/api/admin/people/platform/[userId]/route.ts`, `src/components/admin/super-admin-platform-block-action.tsx`; `tests/unit/chat6-platform-block-scope-round7.test.ts` → `SA-academics-people-106 blocks or restores a nonprivileged platform account with reason, audit and session revocation`. |

| SA-academics-people-91 | DONE (legacy copy restored; runtime parity pending) | `src/app/(authenticated)/admin/faculty/page.tsx`, `src/components/admin/person-onboard-dialog.tsx`, `src/components/college/college-person-edit-action.tsx`; `tests/unit/chat6-people-legacy-copy-round11.test.ts` → `SA-academics-people-91 preserves registered faculty headings, OTP help and create edit feedback`. Hard delete remains intentionally absent per OD-23. |

## Round 12 — Super Admin Students

| SA-academics-people-95 | DONE (source authored; PostgreSQL, import-run and browser pending) | `src/modules/people/college-student-csv-service.ts` resolves an active acting college, checks both permissions, validates before create, and appends college-scoped import events; `src/app/(authenticated)/admin/students/page.tsx`, `src/components/admin/super-admin-student-import-history.tsx`, `src/components/college/college-student-csv-import.tsx` provide scoped preview/confirm and history. `tests/unit/chat6-student-csv-and-legacy-copy-round12.test.ts` → `SA-academics-people-95 validates a 500-row legacy roster with the selected academic placement and no mutation`, `SA-academics-people-95 scopes import writes and history to the selected active college, with same-origin checked API`. |
| SA-academics-people-100 | DONE (source authored; OD-23 intentionally replaces permanent deletion with reversible suspension) | `src/app/(authenticated)/admin/students/page.tsx`, `src/components/college/college-student-register-form.tsx`, `src/components/college/college-person-edit-action.tsx`; `tests/unit/chat6-student-csv-and-legacy-copy-round12.test.ts` → `SA-academics-people-100 restores registration and roster copy without destructive hard delete`. |

| SA-academics-people-85 | DONE (source authored; PostgreSQL concurrency and browser acceptance pending) | `src/modules/admin-ui/super-admin-faculty-schedule-reassign-{model,service}.ts`, `src/app/api/admin/faculty/schedules/reassign/route.ts`, `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx`, `src/app/(authenticated)/admin/faculty/page.tsx`. The selected active college is server-resolved; confirmed, serializable write moves future scheduled sessions with target conflict skips, preserves original ownership for skipped sessions, audits counts, and renders the legacy `Reassigned N of M upcoming session(s)` report. `tests/unit/chat6-superadmin-faculty-schedules-85.test.ts` → `SA-academics-people-85 transfers non-overlapping future sessions while skipping collisions and overlapping proposed moves`, `SA-academics-people-85 rejects no-op account changes and requires explicit confirmation`, `SA-academics-people-85 scopes timetable updates to the selected active college with serializable locks and audit`. |

| SA-academics-people-103 | DONE (source authored; browser acceptance pending) | `src/app/(authenticated)/admin/faculty-assignment/page.tsx` restores the exact "Faculty Assignments" introduction, "Create teaching assignment" link and "Current teaching assignments" heading; live rows expose a confirmed remove action via `src/components/courses/admin-course-actions.tsx`. `tests/unit/chat6-superadmin-faculty-assignment-copy-103.test.ts` → `SA-academics-people-103 shows the faculty assignment legacy heading, creation and current assignments labels`, `SA-academics-people-103 offers selected-college removal with legacy warning but preserves history`. Per OD-23 removal safely ends the assignment rather than hard-deleting audit/history. |

| SA-academics-people-86 | NOT-A-GAP (bounded OTP budget, automatic recovery) | `src/modules/auth/login-service.ts` gives OTP attempts a five-minute lifetime and rolling send throttles a ten-minute window; a Super Admin override would bypass anti-enumeration controls. `tests/unit/chat6-superadmin-otp-lockout-86.test.ts` → `SA-academics-people-86 intentionally uses expiring throttles rather than a dangerous bypass action`. |

## Chat-6 UNCONFIRMED decisions, 2026-10-18

| SA-academics-people-111 | DONE (source) | Canonical recruiter phone reuse and global session invalidation on phone change; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-academics-people-111` |

## Chat-6 follow-up: incremental OPEN-gap behavior

| SA-academics-people-101 | OPEN (partial: in-tab create implemented; edit still missing) | `src/components/admin/super-admin-faculty-assignment-create.tsx` and `src/app/(authenticated)/admin/faculty-assignment/page.tsx` invoke audited `createCourseTeachingAssignment` through same-origin `/api/courses/teaching-assignments`, using active selected-college delivery and faculty pickers. `tests/unit/chat6-superadmin-faculty-assignment-create-101.test.ts` → `SA-academics-people-101 validates a typed delivery/faculty/role and rejects malformed assignments` and `SA-academics-people-101 creates only active faculty teaching assignments in the selected college`. In-place teaching role editing is not yet implemented, so the full gap remains OPEN. |

## chat-13 final sprint source acceptance — 2026-10-18
| SA-academics-people-92 | DONE (source verification; runtime pending) | `src/app/(authenticated)/admin/students/page.tsx` shows `CollegeStudentRegisterForm` only within the acting-college scope. `src/components/college/college-student-register-form.tsx` keeps separate First Name and Last Name, Indian 10-digit mobile normalization, optional email, gender, DOB and address; canonical login identity remains distinct from college profile data. `tests/unit/chat13-final-sprint-sa-92.test.ts` (gap-ID-named Super Admin reachability and identity assertions); tests authored, not run. |
| SA-academics-people-94 | DONE (source) | `src/app/(authenticated)/admin/students/page.tsx` renders the existing `CollegePersonEditAction` and newly wired `StudentClassMoveAction` on a college-scoped learner roster. `src/modules/academics/college-student-section-move-service.ts` now supports verified Super Admin acting-college permission with same-cohort, period and capacity restrictions, optimistic section-enrollment token, audit event, and preserves historical placement. `tests/unit/chat13-final-sprint-sa-94.test.ts` test `SA-academics-people-94` (unrun). |

### chat-9 reassessment — SA-academics-people-92

| ID | Status | Evidence |
|---|---|---|
| SA-academics-people-92 | DONE (source verified; browser/database acceptance pending) | `src/components/college/college-student-register-form.tsx` provides First Name, Last Name, 10-digit Indian mobile normalization, optional email, gender, DOB and address. `src/modules/people/college-onboard-mobile-model.ts` validates the mobile and formats the name. `tests/unit/chat9-final-named-gap-verification.test.ts` → `SA-academics-people-92 uses structured legacy identity and validates the Indian mobile without requiring demographic fields`. Existing verified source behavior was not removed. |

### Chat-3 global unassigned identities URL safety (source/tests authored)

| Case | Evidence | Status |
| --- | --- | --- |
| SA-PEOPLE-UNASSIGNED-URL-01 | `src/app/(authenticated)/admin/people/unassigned/page.tsx` now rejects duplicated or unknown query selectors before global identity data loads. `tests/unit/chat3-sa-unassigned-global-identity-ssr.test.tsx` exercises own global scope, wrong/disabled actors, selected-college denial, empty state and invalid-filter recovery. | Source/test authored; cloud CI and browser pending |

### Chat-3 recruiter partial-failure acceptance (source/tests authored, unexecuted)

| Case | Source and test | Status |
| --- | --- | --- |
| SA-RECRUITERS-PARTIAL-01 | `src/app/(authenticated)/admin/hr/page.tsx`, `src/components/admin/super-admin-hr-accounts.tsx`; `tests/unit/chat3-sa-recruiter-directory-partial-service.test.tsx`. Independent account-summary query failure preserves the scoped recruiter list; unknown counts show Unavailable and Retry. Wrong-role and inactive platform principals cannot read either service, and `/admin/recruiters` shares canonical guard. | DONE in source; cloud CI/browser acceptance pending |

### chat-3 additional security acceptance — selected-college Faculty and People directories

| ID | Status | Verification evidence |
|---|---|---|
| SA-academics-people-102 / SA3-FAC-ASSIGNMENTS-01 | DONE (source/test authored; CI pending) | `src/modules/admin-ui/super-admin-faculty-assignments-service.ts` now enforces matching offering Section/cohort/academic period; `tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts` exercises tenant SQL and stale-page recovery. |
| SA-academics-people-102 / SA3-FAC-EXPORT-02 | DONE (source/test authored; CI pending) | `src/modules/admin-ui/super-admin-faculty-assignments-csv-service.ts` refuses duplicate user filters; `tests/unit/chat3-sa-faculty-assignments-csv-http.test.ts` checks 400, pagination, export cap, no-store headers and safe error routing. |
| SA-academics-people-102 / SA3-FAC-ORG-01 | DONE (source/test authored; CI pending) | The selected Faculty class facet validates college ownership of the selected organization; `tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts` checks the new compiled SQL predicate. |
| SA-academics-people-89 / SA-academics-people-98 / SA3-PEOPLE-ORG-01 | DONE (source/test authored; CI pending) | `src/modules/admin-ui/super-admin-people-filter-options.ts` now checks organization/college owner in all four filters. `tests/unit/chat3-sa-people-facets-organization-scope.test.ts` compiles the query joins and asserts role denial. |

These rows are source-verified closure evidence, not a statement that cross-college PostgreSQL isolation, cloud CI or browser acceptance was executed. Historical gap status entries above remain authoritative until orchestration validates the new tests.

| SA-academics-people-101 | OPEN — in-place Edit role and concurrency closed; legacy multi-course class/semester batch create still outstanding; CI pending | `src/app/(authenticated)/admin/faculty-assignment/page.tsx`, `src/components/admin/super-admin-faculty-assignment-create.tsx`, `src/modules/courses/teaching-assignment-service.ts`, `src/modules/courses/teaching-assignment-revision.ts`, `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts`; `tests/unit/chat6-faculty-assignment-role-cas-101.test.ts` and `tests/unit/chat6-faculty-assignment-role-http-101.test.ts` test exact role revision, strict boundary, CSRF, tenant ancestry, primary-role constraints, same-millisecond conflict and durable audit. No claim of complete multi-select parity or executed CI. |

## Chat-3 Pass B People and Faculty registration permission follow-up (source/tests authored)

| ID | Status | Verification evidence |
| --- | --- | --- |
| SA-LEARNING-FILTER-ROLE-01 | DONE in source, runtime unverified | `getSuperAdminLearningFilterOptions` now checks active system Super Admin before full-college course/cohort selection, protecting these facets from regular Faculty `courses.read`; `tests/unit/chat3-sa-learning-facets-platform-role.test.ts` compiles 2,000-row bounded Drizzle college filters and denies wrong roles. |
| SA-ACADEMICS-ROOT-01 / SA-PEOPLE-ROOT-01 | DONE in source, runtime unverified | Root Super Admin pages check platform role before academic workspace / membership reads; `tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts`. |
| SA-ACADEMICS-SECTION-01 | DONE in source, runtime unverified | Privileged Section detail requires system Super Admin beyond generic academic-read permission; `tests/unit/chat3-sa-academics-section-platform-role.test.ts`. |

No recorded execution of the tests or full 320px/keyboard/browser identity journey.
