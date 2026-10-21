# Work packet (wave 2): edit src/app/(authenticated)/admin/students/page.tsx

38 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-14-002-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy Register students header expands accordion; vNext Register New Student ↓ anchor scroll — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1102-1127`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:64-70`
- Fix: Restore register accordion toggle and exact header label

## G2-14-002-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy overview 4 metrics before collapsed register and roster; vNext registration first, metrics in later directory — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1091-1128,1426-1431`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:61-90`; `src/components/admin/admin-scoped-read-page.tsx:91-110`
- Fix: Move metrics above registration and roster

## G2-14-002-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy Register and Bulk two Ant small cards at lg 50/50; vNext stacked border-only full width — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1128-1131,1255-1258`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:70-81`
- Fix: Use legacy two-card columns and spacing

## G2-14-002-008  [P2] GAP  facet F02  effort S
- Legacy: Legacy registration panel collapsed by default; vNext full inline form always open — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1120-1128`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:70-81`
- Fix: Hide Register/Bulk behind one Collapse until invoked

## G2-14-002-014  [P2] GAP  facet F03  effort S
- Legacy: Legacy Delete Student icon permanently deletes including attendance; vNext only reversible membership lifecycle — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1085`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Record removal as intentional if owner agrees; avoid restoring unsafe destructive behavior

## G2-14-002-016  [P2] GAP  facet F03  effort S
- Legacy: Legacy bulk selection banner shows count and 3 module toggles, vNext bulk controls in disclosure section — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1524-1569`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:86-89`; `src/components/admin/super-admin-student-bulk-access.tsx:41-70`
- Fix: Display count/action bar adjacent to selected rows

## G2-14-002-022  [P2] GAP  facet F04  effort M
- Legacy: Legacy suspendedAt drives statuses Active or Suspended; vNext membership includes ENDED and platformStatus — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-957`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:20-20`; `src/modules/admin-ui/super-admin-scoped-people-service.ts:27-34,71-71`
- Fix: Map platform login suspension separately from membership status

## G2-14-002-029  [P2] GAP  facet F05  effort S
- Legacy: Legacy status dropdown Any status/Active/Suspended; vNext raw ALL/ACTIVE/SUSPENDED/ENDED — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1512-1514`
- vNext now: `src/components/admin/admin-scoped-read-page.tsx:118-122`; `src/app/(authenticated)/admin/students/page.tsx:20-20`
- Fix: Use title case/status alias, extra Ended optional

## G2-14-002-051  [P2] GAP  facet F09  effort S
- Legacy: Legacy Import History width640 when/students with Close; vNext history separate control — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1731-1763`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:71-80`; `src/components/admin/super-admin-student-import-history.tsx:1-80`
- Fix: Restore modal and column text

## G2-14-002-052  [P2] GAP  facet F09  effort M
- Legacy: Legacy Clear OTP/Impersonate/Delete confirmation Popconfirms; vNext only lifecycle confirmation — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1085`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:35-62`
- Fix: Implement approved confirmations; deletion intentional removal pending policy

## G2-14-002-055  [P2] GAP  facet F10  effort S
- Legacy: Legacy delete DELETE /api/v1/learner/delete/{id}; vNext lifecycle status transition only — `docs/legacy-source/frontend/src/api/Services/AdminService.js:300-301`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:581-591`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Record retention-policy divergence before any destructive implementation

## G2-14-002-071  [P2] GAP  facet F14  effort M
- Legacy: Legacy students.csv exact columns Name, Roll, Mobile, Email, Class, Gender, Status; vNext super-admin-students-ist.csv — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1434-1463`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:82-84`; `src/components/admin/admin-scoped-read-page.tsx:91-94`
- Fix: Restore filename seven headers/order and status presentation

## G2-14-002-073  [P2] GAP  facet F14  effort M
- Legacy: Legacy history uses learnerCount/bulkImportBatchId; vNext activityEvents with runId metadata — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:868-879,1731-1763`
- vNext now: `src/modules/people/college-student-csv-service.ts:197-229`; `src/app/(authenticated)/admin/students/page.tsx:53-60`
- Fix: Show legacy When/Students and batch identity mapping

## G2-14-002-077  [P2] GAP  facet F16  effort M
- Legacy: Legacy lg two register/bulk columns and sm paired fields; vNext full-width stacked forms — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1128-1173,1255-1258`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:70-81`; `src/components/college/college-student-register-form.tsx:69-120`
- Fix: Use two card columns at lg, paired field grid at sm

## G2-14-002-082  [P2] GAP  facet F18  effort S
- Legacy: Legacy header Register students; vNext Register New Student ↓ — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1102-1105`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:64-65`
- Fix: Use exact legacy header action text

## G2-14-002-083  [P2] GAP  facet F18  effort S
- Legacy: Legacy collapse Register students (one at a time or bulk CSV); vNext independent headings — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1120-1127`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:70-74`
- Fix: Use legacy collapse label and hierarchy

## G2-14-002-095  [P2] GAP  facet F22  effort M
- Legacy: Legacy delete records including attendance; vNext membership ENDED lifecycle no direct delete — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1085`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:20-20`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Document retention equivalence and deletion decision

## G2-18-031-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy Students vs Faculty under Super Admin /superadmin/students and /superadmin/teachers with shared section code; superadmin/students.js:1-33;superadmin/teachers.js:1-33
- vNext now: vNext /admin/students and /admin/faculty with AdminScopedReadPage; src/app/(authenticated)/admin/students/page.tsx:20-92;admin/faculty/page.tsx:14-46
- Fix: Preserve Teachers→Faculty navigation alias and route-safe breadcrumbs for legacy entry points

## G2-18-031-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy Super Admin without college renders warnings Choose a college in header to see its students/faculty; superadmin/students.js:12-24;superadmin/teachers.js:12-24
- vNext now: vNext AdminScopedReadPage relies on adminScope and can render no scope, /admin/students suppresses tools until choices load; admin/students/page.tsx:26-52;admin/faculty/page.tsx:18-36
- Fix: Preserve missing-college recovery in same shell and disable mutation until scope verified

## G2-18-031-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy Students/Faculty show PeoplePageOverview title, description and four metrics before registration and roster; Students.js:1091-1107;Faculty.js:940-952
- vNext now: vNext /admin/students starts registration/bulk then roster; /admin/faculty uses AdminScopedReadPage with intro bulk tools; admin/students/page.tsx:62-90;admin/faculty/page.tsx:21-44
- Fix: Restore legacy summary-metric strip and sections order while retaining new workflows

## G2-18-031-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy registration/bulk editing inside AntD collapses/cards and modals, all under ln-module admin-list-page; Students.js:1103-1130,1250-1300;Faculty.js:940-979,1110-1172
- vNext now: vNext student registration inline, bulk in details; faculty onboarding Dialog, bulk Disclosure; admin/students/page.tsx:70-82;admin/faculty/page.tsx:21-30
- Fix: Choose legacy disclosure default, heading, borders and spacing per role, avoid extra canvas/card nesting

## G2-18-031-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy student table Name, Roll No., Mobile, Email, Class, Gender, Status, Actions; Students.js:928-965
- vNext now: vNext /admin/people table Person+contact, Roles, Status, Actions; admin/people/page.tsx:28-87; specialized /admin/students scoped table via AdminScopedReadPage; admin/students/page.tsx:82-92
- Fix: Audit specialized student DataTable columns one by one; preserve Roll No, Class and Gender labels and placeholders

## G2-18-031-068  [P2] GAP  facet F18  effort S
- Legacy: Legacy Student account headings Students, Register students, Roll No., Student registered successfully...; Students.js:928-936,1093-1105,509
- vNext now: vNext Registered Students, Register student/First Name/Roll Number and generic Onboard person on SA People; admin/students/page.tsx:62-84;person-onboard-dialog.tsx:120-148
- Fix: Use exact legacy title/action labeling when a vNext action serves same purpose

## G2-19-001-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy route `/superadmin/students` renders college-selected `Students` inside `SuperAdminGroupShell(groupKey='people')` `docs/legacy-source/frontend/src/pages/superadmin/students.js:1-30`
- vNext now: vNext route `/admin/students` renders direct `PageHeader` plus independent directory; no legacy-group wrapper `src/app/(authenticated)/admin/students/page.tsx:21-30`,61-90
- Fix: Add legacy-route redirect and verify People group/tab selection matches legacy shell.

## G2-19-001-002  [P2] GAP  facet F01  effort S
- Legacy: No college: warning `Select a college to continue` above student screen `docs/legacy-source/frontend/src/pages/superadmin/students.js:10-23`
- vNext now: Selected-college absent becomes `EmptyState` in directory after `PageHeader`; register sections omitted `src/components/admin/admin-scoped-read-page.tsx:54-57`; `src/app/(authenticated)/admin/students/page.tsx:34`,70-82
- Fix: Match exact college-required warning text, alert styling and placement.

## G2-19-001-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy page primary action opens the `Register students (one at a time or bulk CSV)` accordion `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1102-1127`
- vNext now: vNext primary `Register New Student ↓` scrolls to already rendered single-form section `src/app/(authenticated)/admin/students/page.tsx:62-70`
- Fix: Use equivalent register accordion trigger and state; avoid extra scroll-first workflow.

## G2-19-001-004  [P2] GAP  facet F02  effort M
- Legacy: One collapsible registration panel contains two `Card` columns at lg (single and bulk), then roster card `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1120-1131`,1255-1257,1426-1430
- vNext now: Two independent full-width bordered sections before roster; bulk is nested `details` `src/app/(authenticated)/admin/students/page.tsx:70-82`
- Fix: Restore legacy section order, shared accordion, side-by-side cards at desktop and roster below.

## G2-19-001-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy `PeoplePageOverview` shows Students/Active/Suspended/Visible now above accordion `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1091-1105`
- vNext now: vNext overview rendered inside roster after register/bulk sections `src/app/(authenticated)/admin/students/page.tsx:70-82`; `src/components/admin/admin-scoped-read-page.tsx:98-108`
- Fix: Move overview above registration and preserve headline/metric order.

## G2-19-001-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy status `Active`/`Suspended` colour-tag based on `suspendedAt` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-956`
- vNext now: vNext raw membership enum `ACTIVE`/`SUSPENDED` `StatusBadge`, also allows `ENDED` `src/components/admin/admin-scoped-read-page.tsx:249-252`; `src/app/(authenticated)/admin/students/page.tsx:20`
- Fix: Use sentence-case legacy labels and verify distinct ENDED membership state UI.

## G2-19-001-022  [P2] GAP  facet F05  effort S
- Legacy: Legacy status dropdown `Any status`, `Active`, `Suspended` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1512-1514`
- vNext now: vNext `Status` raw `ALL`, `ACTIVE`, `SUSPENDED`, `ENDED` `src/app/(authenticated)/admin/students/page.tsx:20`; `src/components/admin/admin-scoped-read-page.tsx:118-123`
- Fix: Match visible status option labels while preserving supported ENDED semantics.

## G2-19-001-042  [P2] GAP  facet F09  effort M
- Legacy: Legacy registration accordion toggles Form and bulk import together `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1120-1127`
- vNext now: vNext single form always visible; bulk under separate `details` `src/app/(authenticated)/admin/students/page.tsx:70-80`
- Fix: Use shared accordion with same trigger, keyboard behavior and opened content.

## G2-19-001-066  [P2] GAP  facet F14  effort M
- Legacy: Legacy export `students.csv` from filtered visible rows with seven headers `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1436-1460`
- vNext now: vNext server export `super-admin-students-ist.csv` `src/app/(authenticated)/admin/students/page.tsx:82-84`
- Fix: Align filename and columns; validate export reflects exact selected filters.

## G2-19-001-071  [P2] GAP  facet F16  effort M
- Legacy: Legacy `Row` uses xs24 sm12, lg12 for parallel cards, AntD table x scroll and right-fixed actions at `screens.md` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1128-1130`,962-964,1572-1584
- vNext now: vNext responsive full-width stacked sections and article cards; action buttons wrap at sm `src/app/(authenticated)/admin/students/page.tsx:70-90`; `src/components/admin/admin-scoped-read-page.tsx:247-263`
- Fix: Match legacy responsive breakpoints, wide table scroll and pinned actions at >=md.

## G2-19-001-073  [P2] GAP  facet F17  effort S
- Legacy: Legacy row icon buttons have per-student `aria-label`s and tooltips/titles `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:966-1025`,1056-1084
- vNext now: vNext uses text action buttons and Open details link `src/app/(authenticated)/admin/students/page.tsx:90`; `src/components/college/college-person-edit-action.tsx:82-88`; `src/components/admin/admin-scoped-read-page.tsx:255-257`
- Fix: Preserve distinguishable student-specific accessible names for repeated row actions.

## G2-19-001-076  [P2] GAP  facet F18  effort S
- Legacy: Legacy Register section text `Register students (one at a time or bulk CSV)` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1125-1127`
- vNext now: vNext page action `Register New Student ↓` and `Show CSV import form` `src/app/(authenticated)/admin/students/page.tsx:65`,77-80
- Fix: Match accordion title and action capitalization.

## G2-5-027-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy supports college/global roster reads, learner detail/program/class roster, and mixed paged/unpaged contracts. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-655`
- vNext now: vNext college/admin pages use scoped directory services and membership UUIDs. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Publish every read endpoint equivalent and payload-level compatibility matrix.

## G2-5-027-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy roster backend feeds single learner table with search/filter/paging. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-588`
- vNext now: vNext separated college role directory and superadmin roster with registration panels. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Compare header/table/filter and edit entry point order across two roles.

## G2-19-001-006  [P3] GAP  facet F03  effort S
- Legacy: Legacy action header says `Register students` with Plus icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1102-1105`
- vNext now: vNext `Register New Student ↓` text and no Plus icon `src/app/(authenticated)/admin/students/page.tsx:64-65`
- Fix: Use exact `Register students` label and Plus icon.
