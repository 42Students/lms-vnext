# Work packet (wave 2): edit src/app/(authenticated)/admin/people/directory/page.tsx

25 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-8/superadmin-people.md

## G2-18-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy Super Admin /superadmin/people and College Admin /college-admin/people wrap shared read-only PeopleDirectory; college-admin/people.js:1-34;superadmin/people.js:1-33;PeopleDirectory.js:25-46
- vNext now: vNext /admin/people directory plus /admin/people/directory and /admin/students,/admin/faculty; src/app/(authenticated)/admin/people/page.tsx:89-184;admin/people/directory/page.tsx:59-149
- Fix: Map legacy People Directory to scoped read-only destination and preserve named entry point/link ordering

## G2-18-031-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy read-only PeopleDirectory description, shortcut actions, warning, then All contacts/Faculty/Students tabs; PeopleDirectory.js:25-48
- vNext now: vNext /admin/people directory separate from combined membership management, with role/status filters and table; admin/people/directory/page.tsx:59-149;admin/people/page.tsx:142-184
- Fix: Match legacy read-only directory section and three-tab strip before management actions

## G2-18-031-024  [P2] GAP  facet F05  effort S
- Legacy: Legacy PeopleDirectory uses All contacts/Faculty/Students tabs with ContactsGrid separate columns; PeopleDirectory.js:40-47
- vNext now: vNext People Directory Tabs and combined role filters, records paginated; admin/people/directory/page.tsx:59-143
- Fix: Match exact tab labels and counts, mobile tab behavior, contact column order

## G2-18-031-057  [P2] GAP  facet F13  effort S
- Legacy: Legacy zero college and empty roster show warning/AntD empty table and no data; superadmin/students.js:12-24;Students.js:360-485
- vNext now: vNext empty No matching contacts/No matching users and role statuses; admin/people/page.tsx:175-184;directory/page.tsx:120-143
- Fix: Separate no-college/no-results/no-permission and retryable DB error, use exact legacy title where same

## G2-15-013-009  [P2] GAP  facet F03  effort S
- Legacy: Colleges select data id/name/city/state. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:159-203`)
- vNext now: New admin table shows collegeName but not city/state pick labels. (`src/app/(authenticated)/admin/people/directory/page.tsx:130-139`)
- Fix: Add city/state to college filter/selector data mapping.

## G2-15-013-010  [P2] GAP  facet F03  effort S
- Legacy: Five stats counters with explicit names. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:291-347`)
- vNext now: New UI matching memberships and page counts only. (`src/app/(authenticated)/admin/people/directory/page.tsx:115-115`)
- Fix: Restore any legacy search statistics counters with exact labels.

## G2-8-003-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:8-14`: reusable for both `/college-admin/people` and `/superadmin/people`; basePath selected by router pathname
- vNext now: `src/app/(authenticated)/college/people/page.tsx:4-7`: redirects to `/college/contacts`; `admin/people/directory/page.tsx:21-25` separate Super Admin page
- Fix: Document shared component replaced by two role-specific implementations; preserve matching navigation for both entry points

## G2-8-003-004  [P2] GAP  facet F02  effort S
- Legacy: `.../components/admin/people/PeoplePageOverview.jsx:13-43`: eyebrow People, title, short description and three actions in bordered overview Card
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:41-43`: PageHeader without eyebrow or Card; `/admin/people/directory/page.tsx:60-65` has different description
- Fix: Match legacy eyebrow/card composition only if shell design permits; exact wording is required

## G2-8-003-005  [P2] GAP  facet F03  effort S
- Legacy: `.../PeopleDirectory.js:31-33`: Student accounts, Faculty accounts, Teaching assignments as antd Buttons
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:43`: plain underlined links, `admin/people/directory/page.tsx:73-76` links inside disclosure
- Fix: Use outlined controls with same three visible labels and order for both roles

## G2-8-003-007  [P2] GAP  facet F03  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:21-66`: 8 tinted palettes for avatar and initials fallback
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:214-218`, `admin/people/directory/page.tsx:121-129`: only linked name text
- Fix: Restore avatar image/fallback, using stable seed and role-safe image URL

## G2-8-003-008  [P2] GAP  facet F04  effort M
- Legacy: `.../components/contacts/contactColumns.js:3-18`: All: Name, Email, Contact, Role
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:214-235`: 7 columns; `admin/people/directory/page.tsx:121-142`: 7 different columns
- Fix: Restore exact default All tab columns and labels; present additional status data separately

## G2-8-003-018  [P2] GAP  facet F06  effort M
- Legacy: `.../PeopleDirectory.js:13-22`: unknown `?view=` falls back to All, preserves other query keys, shallow replaces
- vNext now: `src/modules/people/college-contacts-model.ts:94-106`: strict query rejecting unknown keys; admin `directory/page.tsx:27-37` rejects unknown keys
- Fix: Accept legacy query names then redirect canonically, reject only malformed unsafe values

## G2-8-003-039  [P2] GAP  facet F18  effort S
- Legacy: `.../PeopleDirectory.js:27-33`: title `People Directory`, subtitle exact read-only contact lookup; three actions
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:41-43`, `admin/people/directory/page.tsx:60-65`: different descriptions and action treatment
- Fix: Restore exact catalogue text and visible management links

## G2-8-002-002  [P2] GAP  facet F01  effort S
- Legacy: `.../superadmin/people.js:17-28`: renders SuperAdminGroupShell groupKey people with PeopleDirectory child
- vNext now: `src/app/(authenticated)/admin/people/page.tsx:140-149`: membership-management page; actual directory moved to `/admin/people/directory` (`directory/page.tsx:59-65`)
- Fix: Route People Directory tab directly to read-only directory rather than editable membership manager

## G2-8-002-004  [P2] GAP  facet F02  effort M
- Legacy: `.../components/admin/SuperAdminGroupShell.jsx:13-29`: PageShell title and tab strip wrap directory
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:59-79`: PageHeader then tabs then related people disclosure
- Fix: Verify People group wrapper and relative section order at desktop/mobile; adjust tabs to old group strip

## G2-8-002-006  [P2] GAP  facet F03  effort S
- Legacy: `.../superadmin/sections/PeopleDirectory.js:24-30`: Student accounts, Faculty accounts, Teaching assignments buttons
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:69-79`: these are links inside collapsed Related people views disclosure
- Fix: Expose three outlined action buttons in page header by default rather than hidden disclosure

## G2-8-002-008  [P2] GAP  facet F04  effort M
- Legacy: `.../components/contacts/contactColumns.js:3-18`: Name, Email, Contact, Role
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:121-142`: Person (name+contacts), College, Platform, Membership, Roles, Updated, Actions
- Fix: Default to legacy column set/order/labels and make lifecycle metadata optional

## G2-8-002-009  [P2] GAP  facet F04  effort S
- Legacy: `.../components/contacts/contactColumns.js:19-58`: Faculty/Student tabs Name, Email, Contact only
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:121-142`: same detailed columns in each tab
- Fix: Use category-specific legacy columns for Faculty and Students

## G2-8-002-012  [P2] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:78-93,164-177`: default page size 10, options 10/20/50, AntD pagination
- vNext now: `src/modules/people/admin-user-directory-model.ts:12,42-45`: fixed 30 per page, no changer (`directory/page.tsx:115-145`)
- Fix: Match 10 default and allow 10/20/50 selectable page sizes if feature parity required

## G2-8-002-015  [P2] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:118-136`: Name with identity avatar, no row click
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:122-141`: Person text and View membership action link
- Fix: Add legacy avatar/initial display while retaining explicit detail navigation

## G2-8-002-017  [P2] GAP  facet F06  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:150-157`: input placeholder `Search contacts...` with allowClear and no submit
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:85-96`: Name or college, max100, Filter submit
- Fix: Restore exact placeholder and input clear affordance; keep accessible submission

## G2-8-002-032  [P2] GAP  facet F13  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:180-190`: empty no search `No contacts found` with `Your contacts will appear here once available.`
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:120,143`: `No matching users` / `No memberships match these filters within the current safety scope.`
- Fix: Distinguish true-empty vs no-match and align legacy wording

## G2-8-002-042  [P2] GAP  facet F18  effort S
- Legacy: `.../superadmin/sections/PeopleDirectory.js:24-29`: `People Directory` title and read-only description
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:60-61`: title same, description `Read-only membership directory within the active organization/college scope...`
- Fix: Restore legacy title subtitle wording; append scope-specific safety explanation in separate notice

## G2-15-013-068  [P3] GAP  facet F18  effort S
- Legacy: Colleges retrieved; city/state fields in payload. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:202-202`)
- vNext now: New membership notice label and masked contact, no college selector copy. (`src/app/(authenticated)/admin/people/directory/page.tsx:80-83`)
- Fix: Restore old college option fields where needed.

## G2-8-002-040  [P3] GAP  facet F17  effort S
- Legacy: `.../components/admin/people/PeoplePageOverview.jsx:29-37`: metrics section aria label when metrics exist; directory metrics empty
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:115`: matching-memberships live text not explicitly role status
- Fix: Make result count an aria-live polite region (legacy count pill changes)
