# Work packet (wave 2): edit src/components/college/college-role-directory-workspace.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/college-admin-students.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-13-007-002  [P2] GAP  facet F01  effort M
- Legacy: Students appears under People grouped tab shell (`docs/legacy-source/frontend/src/pages/college-admin/students.js:31-35`)
- vNext now: New student directory page stands alone with utility nav (`src/components/college/college-role-directory-workspace.tsx:82-118`)
- Fix: Preserve legacy People group tab strip and selection in shared shell.

## G2-13-007-003  [P2] GAP  facet F01  effort S
- Legacy: Missing collegeId displays Admin not assigned to a college warning (`docs/legacy-source/frontend/src/pages/college-admin/students.js:18-28`)
- vNext now: Missing membership redirects to dashboard (`src/components/college/college-role-directory-workspace.tsx:59-60`)
- Fix: Provide explicit missing-college warning and contact admin recovery instead of silent redirect.

## G2-13-007-004  [P2] GAP  facet F02  effort M
- Legacy: Students embedded inside ln-module admin-list-page and AdminGroupShell (`docs/legacy-source/frontend/src/pages/college-admin/students.js:31-36`)
- vNext now: New direct PageHeader, summary, tools, filters, table (`src/components/college/college-role-directory-workspace.tsx:82-141`)
- Fix: Match shell canvas, horizontal content and People group tabs.

## G2-13-007-005  [P2] GAP  facet F02  effort S
- Legacy: Legacy PeoplePageOverview summary and Register students primary action (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1091-1107`)
- vNext now: New PageHeader description and Register students link (`src/components/college/college-role-directory-workspace.tsx:84-99`)
- Fix: Align title/CTA icon and summary hierarchy.

## G2-13-007-006  [P2] GAP  facet F02  effort L
- Legacy: Old registration uses Collapsible Register students header expanded on click (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1120-1130`)
- vNext now: New Register students routes to separate /college/students/register (`src/components/college/college-role-directory-workspace.tsx:91-98`)
- Fix: Keep old in-page registration affordance or synchronized drawer/route with same layout.

## G2-13-007-007  [P2] GAP  facet F02  effort M
- Legacy: Bulk Register Students follows single registration inside section (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1257-1262`)
- vNext now: New Import CSV route and history controls above roster (`src/components/college/college-role-directory-workspace.tsx:101-115`)
- Fix: Restore registration/bulk grouping and relative order.

## G2-13-007-008  [P2] GAP  facet F02  effort S
- Legacy: Legacy filters and table beneath overview, action modals on top (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1445-1594`)
- vNext now: New stat tiles then filter form then responsive list/table (`src/components/college/college-role-directory-workspace.tsx:133-141`)
- Fix: Restore panel boundaries and table treatment.

## G2-13-007-009  [P2] MISSING  facet F03  effort S
- Legacy: Four tiles Students/Active/Suspended/Visible now with filtered visible count (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1093-1101`)
- vNext now: Three tiles Students/Active/Suspended and Visible now: Not tracked (`src/components/college/college-role-directory-workspace.tsx:133-140`)
- Fix: Compute visible filtered count or label equivalent after applied filters.

## G2-13-007-010  [P2] GAP  facet F03  effort L
- Legacy: Legacy row icons Edit/History/Profile/OTP/Suspend/Delete in Actions pinned right (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:958-1085`)
- vNext now: New row has Link person, profile verification, More actions disclosure; no delete/OTP shortcut (`src/components/college/college-role-directory-workspace.tsx:403-453`)
- Fix: Restore per-row actions/labels under appropriate permission; keep safer disclosure.

## G2-13-007-011  [P2] GAP  facet F03  effort S
- Legacy: Old status badge displays Suspended or Active from suspendedAt (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-957`)
- vNext now: New membership status badge plus platform account text (`src/components/college/college-role-directory-workspace.tsx:424-430`)
- Fix: Explain account vs membership status; retain original visible Active/Suspended primary label.

## G2-13-007-012  [P2] GAP  facet F03  effort S
- Legacy: Old Name cell plain text, actions buttons at end (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-934`)
- vNext now: New Person cell linked to profile details, no row icon action column (`src/components/college/college-role-directory-workspace.tsx:408-453`)
- Fix: Match exact table column structure for default view.

## G2-13-007-013  [P2] GAP  facet F03  effort S
- Legacy: Old overview includes note for filtered selected students (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1093-1107`)
- vNext now: New notes current counts and no presence infer (`src/components/college/college-role-directory-workspace.tsx:133-140`)
- Fix: Preserve visible count and filter context.

## G2-13-007-015  [P2] GAP  facet F04  effort S
- Legacy: Old class cell resolves classId to class name or raw ID or '-' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:939-946`)
- vNext now: New context cell combines program/batch/class label (`src/components/college/college-role-directory-workspace.tsx:432-434`)
- Fix: Retain class-only display and fallback while offering combined academic context separately.

## G2-13-007-016  [P2] GAP  facet F04  effort S
- Legacy: Old roll number numeric-aware sort (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:935-936`)
- vNext now: New no Roll No column/sort, only high-level order controls (`src/components/college/college-role-directory-workspace.tsx:325-334`)
- Fix: Implement numeric-aware roll sort and column.

## G2-13-007-017  [P2] GAP  facet F04  effort S
- Legacy: Old email cells are ellipsized, full data via hover (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:937-938`)
- vNext now: New email below Person name and no Mobile cell (`src/components/college/college-role-directory-workspace.tsx:409-418`)
- Fix: Restore per-column truncation and accessible full-text tooltip.

## G2-13-007-020  [P2] MISSING  facet F05  effort M
- Legacy: Old search autocomplete popular learners and suggested matches (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:105-108`)
- vNext now: New plain GET input, no suggestions (`src/components/college/college-role-directory-workspace.tsx:141-153`)
- Fix: Restore scoped suggestion overlay and popular-learners selection if privacy-safe.

## G2-13-007-021  [P2] GAP  facet F05  effort S
- Legacy: Old roster Table 10-row pagination, client-side on full dataset (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:72-74`)
- vNext now: New server pagination pageSize 10/25/50 (`src/components/college/college-role-directory-workspace.tsx:335-339`)
- Fix: Set default to 10 and preserve count after filters, cite efficiency change.

## G2-13-007-022  [P2] GAP  facet F05  effort S
- Legacy: Old supports Name/Roll numeric sorting through table header clicks (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-936`)
- vNext now: New separate Order dropdown NAME/NAME_DESC/NEWEST/OLDEST (`src/components/college/college-role-directory-workspace.tsx:325-334`)
- Fix: Restore column header sort, especially roll.

## G2-13-007-024  [P2] GAP  facet F06  effort L
- Legacy: Single registration fields firstName,lastName,rollNumber,mobile,email,college,program,class,gender,DOB,address (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1130-1247`)
- vNext now: New register form lives on separate page /college/students/register (`src/components/college/college-role-directory-workspace.tsx:94-97`)
- Fix: Verify downstream register form field-by-field vs old labels/required/defaults; restore in-page entry.

## G2-13-007-027  [P2] GAP  facet F06  effort M
- Legacy: Old Edit modal reuses student fields, disabled on lookup failure (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:520-567`)
- vNext now: New CollegePersonEditAction opens separate edit action (`src/components/college/college-role-directory-workspace.tsx:440-445`)
- Fix: Align field order and failure disabled behavior in edit dialog.

## G2-13-007-041  [P2] GAP  facet F09  effort S
- Legacy: Old modal AuditLogs fixed learner entity, ProfileSectionsPanel role learner (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1720-1774`)
- vNext now: New CollegePersonAuditModal and ProfileOverviewModal (`src/components/college/college-role-directory-workspace.tsx:440-445`)
- Fix: Compare full audit trail and 20 profile sections, not just summary.

## G2-13-007-049  [P2] GAP  facet F11  effort S
- Legacy: Old admin with no college receives explicit warning (`docs/legacy-source/frontend/src/pages/college-admin/students.js:18-27`)
- vNext now: New context without membership redirects dashboard (`src/components/college/college-role-directory-workspace.tsx:59-60`)
- Fix: Show exact college-assignment guidance when no membership.

## G2-13-007-054  [P2] GAP  facet F12  effort S
- Legacy: Old register college field read-only resolved collegeName (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:83-101`)
- vNext now: New tenant scope inferred server membership; no visible college field (`src/components/college/college-role-directory-workspace.tsx:82-99`)
- Fix: Show selected college in register workflow.

## G2-13-007-055  [P2] GAP  facet F13  effort M
- Legacy: Old classes/programs lookup failures have separate copy with reload (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:380-404`)
- vNext now: New filter service failures not shown separately, canonical errors (`src/components/college/college-role-directory-workspace.tsx:62-79`)
- Fix: Differentiate class/academic option failure from roster load failure.

## G2-13-007-056  [P2] GAP  facet F13  effort S
- Legacy: Old no students shows empty roster table and actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1572-1587`)
- vNext now: New No matching memberships with clear filters or absence copy (`src/components/college/college-role-directory-workspace.tsx:352-363`)
- Fix: Keep exact no-students text and register CTA in true-empty case.

## G2-13-007-057  [P2] GAP  facet F13  effort S
- Legacy: Old missing college warns Admin not assigned to a college (`docs/legacy-source/frontend/src/pages/college-admin/students.js:18-28`)
- vNext now: New missing membership redirect without page copy (`src/components/college/college-role-directory-workspace.tsx:59-60`)
- Fix: Provide college-assignment error state rather than silent redirect.

## G2-13-007-059  [P2] GAP  facet F14  effort M
- Legacy: Old exports visible filtered students and sample bulk CSV (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:881-900`)
- vNext now: New offers Export visible CSV and Learner CSV max 1000 (`src/components/college/college-role-directory-workspace.tsx:105-114`)
- Fix: Check headers/field order vs legacy, add template download on import page.

## G2-13-007-060  [P2] GAP  facet F14  effort M
- Legacy: Old bulk Upload CSV max 500 rows with validation preview (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1295-1413`)
- vNext now: New Import CSV is dedicated route, not in roster (`src/components/college/college-role-directory-workspace.tsx:101-105`)
- Fix: Keep max rows and template/preview semantics on dedicated route.

## G2-13-007-063  [P2] GAP  facet F16  effort M
- Legacy: Old AntD table actions fixed right at breakpoint md (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:958-964`)
- vNext now: New mobile cards and desktop DataTable without separate Actions column (`src/components/college/college-role-directory-workspace.tsx:365-455`)
- Fix: Restore per-row action reachability on tablet and desktop.

## G2-13-007-064  [P2] GAP  facet F16  effort M
- Legacy: Old register/import collapse responsive grid form with AntD Row/Col (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1120-1262`)
- vNext now: New registration/import separate pages; narrow directory is list cards (`src/components/college/college-role-directory-workspace.tsx:365-401`)
- Fix: Audit new flow navigation at 375/768/1280 for visual parity.

## G2-13-007-065  [P2] GAP  facet F17  effort S
- Legacy: Old action icons have per-user aria-label Edit/OTP/suspend/delete (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:965-1084`)
- vNext now: New semantic named detail/action links and modal buttons (`src/components/college/college-role-directory-workspace.tsx:369-398`)
- Fix: Preserve accessible action names for all retained operations.

## G2-13-007-066  [P2] GAP  facet F17  effort S
- Legacy: Old sorting accessible through header clicks, table column semantics (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-936`)
- vNext now: New order dropdown and DataTable headers without sort (`src/components/college/college-role-directory-workspace.tsx:403-453`)
- Fix: Expose accessible column sorting where applicable.

## G2-13-007-067  [P2] GAP  facet F18  effort S
- Legacy: Old page shell People group title plus Students table title (`docs/legacy-source/frontend/src/components/admin/AdminGroupShell.jsx:14-28`)
- vNext now: New PageHeader title Students without People-group tab title (`src/components/college/college-role-directory-workspace.tsx:82-99`)
- Fix: Restore breadcrumb/tab title hierarchy.

## G2-13-007-069  [P2] GAP  facet F18  effort S
- Legacy: Old column labels Roll No., Mobile, Email, Gender, Actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-960`)
- vNext now: New columns Person, Membership, Program · Batch · Class, Joined (`src/components/college/college-role-directory-workspace.tsx:408-453`)
- Fix: Restore exact column headers for parity.

## G2-13-007-070  [P2] GAP  facet F18  effort S
- Legacy: Old missing college warning exact copy (`docs/legacy-source/frontend/src/pages/college-admin/students.js:21-25`)
- vNext now: New dashboard redirect has no copy (`src/components/college/college-role-directory-workspace.tsx:59-60`)
- Fix: Preserve text and Contact your administrator.

## G2-13-007-072  [P2] MISSING  facet F19  effort M
- Legacy: Old popular learners search uses debounce and async suggestions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:241-307`)
- vNext now: New GET search form only (`src/components/college/college-role-directory-workspace.tsx:141-153`)
- Fix: Restore learner suggestions where safe and useful.

## G2-13-007-081  [P2] GAP  facet F23  effort L
- Legacy: Old profile offers 20 learner sections behind ProfileSectionsPanel (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:58-60`)
- vNext now: New ProfileOverviewModal opens summary panel rather than full sections (`src/components/college/college-role-directory-workspace.tsx:440-445`)
- Fix: Audit and restore all 20 profile sections or link full profile workspace.

## G2-6-001-003  [P2] GAP  facet F01  effort S
- Legacy: Unassigned college admin sees `Admin not assigned to a college` warning `docs/legacy-source/frontend/src/pages/college-admin/teachers.js:18-30`
- vNext now: No membership sends user to dashboard `src/components/college/college-role-directory-workspace.tsx:57-61`
- Fix: Show explicit missing-college warning and contact-admin guidance rather than silent redirect

## G2-6-001-004  [P2] GAP  facet F02  effort M
- Legacy: Old section order overview, expandable register section, registered faculty `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-975` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1273-1278`
- vNext now: New order header, import/export nav, metrics, filters, results, pagination `src/components/college/college-role-directory-workspace.tsx:83-141` `src/components/college/college-role-directory-workspace.tsx:352-482`
- Fix: Match section ordering, retaining new workflows only when intentionally added

## G2-6-001-005  [P2] GAP  facet F02  effort M
- Legacy: Old registration accordion expands inline into single and bulk side-by-side cards `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:965-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1110-1115`
- vNext now: New single registration is modal; CSV on separate route `src/components/college/college-role-directory-workspace.tsx:91-99` `src/components/college/college-role-directory-workspace.tsx:119-132`
- Fix: Provide inline accordion and two-column card arrangement at desktop
