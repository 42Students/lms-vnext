# Work packet (wave 2): edit src/app/(authenticated)/college/contacts/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-1-008-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:434-439`: GET /contacts?userType&collegeId&pageNumber&pageSize.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:26-35`,`src/modules/people/college-contacts-service.ts:16-24`: /college/contacts server-read page, not same endpoint.
- Fix: Map legacy contacts consumers to the scoped new service and link.

## G2-1-008-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:24-49`: PeoplePageOverview, warning/select college, 3 tabs, ContactsGrid.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:40-65`: PageHeader, tabs, filter count, toolbar then advanced filter form.
- Fix: Match section ordering and spacing around tabs/toolbar.

## G2-1-008-009  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/people.js:11-30`: college-less admin sees clear warning and support instruction.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:26-29`: redirects to dashboard before showing warning.
- Fix: Add contextual no-college warning for eligible admins.

## G2-1-008-010  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:139-158`: count pill and search share one toolbar.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:54-64`,`src/app/(authenticated)/college/contacts/page.tsx:206-209`: counts separated from search into own section.
- Fix: Group count, search and toolbar actions in legacy compact arrangement.

## G2-1-008-011  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:40-72`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:124-130`: 32px profile photo or tinted initials in name cell.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:215-217`: plain linked name without avatar.
- Fix: Render safe photo/initials avatar with deterministic tint.

## G2-1-008-013  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:31-33`: action buttons Student accounts, Faculty accounts, Teaching assignments.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:43`: three same-label inline links rather than button faces.
- Fix: Use shared secondary Button styling and old button spacing.

## G2-1-008-015  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:44-46`: tabs All contacts / Faculty / Students.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:44-49`: All contacts / Faculty contacts / Student contacts.
- Fix: Align exact tab titles with legacy copy.

## G2-1-008-017  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:83-90`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:95-104`: contact profile image sourced from website.
- vNext now: `src/modules/people/college-contacts-service.ts:78-97`: no photo selected; `src/app/(authenticated)/college/contacts/page.tsx:214-235` no image cell.
- Fix: Fetch authorized profile image and fallback initial without leaking private URL.

## G2-1-008-020  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:239-250`: mobile label `Contact`, em dash for email/phone, optional Role.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:222-227`: Phone and Joined IST columns, masked contact values.
- Fix: Match Contact label/mobile fallback; retain student privacy policy.

## G2-1-008-029  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:160-178`: legacy tab-specific table columns.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:214-235`: fixed Name, Roles, Membership, Email, Phone, Joined, Related records.
- Fix: Compare tab column sets and restore intended per-tab column order.

## G2-1-008-035  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-156`: typing updates client search; no submit required.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:60-65`: GET form submits Search contacts button.
- Fix: Match live search or clearly signal explicit submit.

## G2-1-008-045  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:180-193`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:213-223`: load error grid offers Retry button.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:32-34`,`src/app/(authenticated)/college/contacts/page.tsx:209-213`: filter ErrorState and Clear filters.
- Fix: Add transient-load retry distinct from invalid-filter recovery.

## G2-1-008-063  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:164-186`: Ant Table spinner and Retry on failure.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:26-35`,`src/app/(authenticated)/college/contacts/page.tsx:206-213`: server page ErrorState for filters; no inline fetch spinner in page.
- Fix: Add loading skeleton and Retry for transient server failure.

## G2-1-008-064  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:188-191`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:219-223`: No contacts found vs No contacts match your search.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:209-210`: one No matching contacts message for all zero cases.
- Fix: Separate truly-empty college from filter/search miss; use legacy helper copy.

## G2-1-008-065  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:198-210`: three mobile skeleton contact cards while loading.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:211-235`: responsive DataTable page with no page-specific mobile skeleton.
- Fix: Restore mobile contact-card skeleton.

## G2-1-008-070  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:160-194`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:198-288`: wide desktop scroll table, separate mobile cards.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:211-235`: unified DataTable responsive priorities and labels.
- Fix: Match tablet/phone breakpoint and stacked 44px photo/mobile labels.

## G2-1-008-071  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:262-283`: mobile Previous/Next disabled buttons and current/total.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:237-242`: shared Pagination plus optional First/Last links.
- Fix: Display mobile Previous/Next with correct disabled boundaries.

## G2-1-008-074  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:27-28`: `People Directory` with full read-only explanation.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:41-42`: `Contacts` and different description.
- Fix: Match exact legacy title and subtitle copy.

## G2-1-008-075  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:152`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:189-190`: `Search contacts...`, `No contacts found`, helper text.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:62`,`src/app/(authenticated)/college/contacts/page.tsx:209-210`: `Search contacts`, `No matching contacts`.
- Fix: Restore punctuation and distinct empty-state message from legacy copy catalogue.

## G2-8-001-003  [P2] GAP  facet F02  effort M
- Legacy: `components/admin/people/PeoplePageOverview.jsx:13-27`: bordered Card, eyebrow People, h1 People Directory, description and right actions; `pages/superadmin/sections/PeopleDirectory.js:22-32` then Tabs
- vNext now: `app/(authenticated)/college/contacts/page.tsx:40-58`: PageHeader Contacts, tabs, bookmark banner and explanatory filter-counter line
- Fix: Reproduce legacy heading/eyebrow/description and section sequence within current shared canvas without losing privacy notice

## G2-8-001-005  [P2] GAP  facet F03  effort S
- Legacy: `pages/superadmin/sections/PeopleDirectory.js:25-30`: three antd Button links Student accounts, Faculty accounts, Teaching assignments
- vNext now: `app/(authenticated)/college/contacts/page.tsx:43`: same three destinations rendered as underlined text links
- Fix: Use shared outlined Buttons styled to match legacy, keeping accessible links

## G2-8-001-006  [P2] GAP  facet F03  effort M
- Legacy: `components/contacts/ContactsGrid.js:145-157`: `TeamOutlined` count pill and magnifier-prefixed clearable search on each tab
- vNext now: `app/(authenticated)/college/contacts/page.tsx:54-65,206-208`: applied-filter counter and search label but no TeamOutlined per-tab contact pill
- Fix: Render per-tab result count pill with team icon and clearable input; retain explicit submit if wanted as extension

## G2-8-001-007  [P2] GAP  facet F03  effort M
- Legacy: `components/contacts/ContactsGrid.js:21-66,125-130`: photo with onError fallback to tinted initials avatar (32px desktop/44px mobile)
- vNext now: `app/(authenticated)/college/contacts/page.tsx:214-218`: name text link, no avatar
- Fix: Add legacy colored initials/image avatar to Name column and mobile rows

## G2-8-001-008  [P2] GAP  facet F04  effort M
- Legacy: `components/contacts/contactColumns.js:3-18`: All columns Name, Email, Contact, Role in that order
- vNext now: `app/(authenticated)/college/contacts/page.tsx:214-235`: Name, Roles, Membership, Email, Phone, Joined, Related role records
- Fix: Restore legacy column order/labels for default directory view; place vNext metadata in expandable details or optional columns

## G2-8-001-009  [P2] GAP  facet F04  effort M
- Legacy: `components/contacts/contactColumns.js:19-58`: Faculty/Student columns Name, Email, Contact (no Role)
- vNext now: `app/(authenticated)/college/contacts/page.tsx:214-235`: same seven columns across tabs
- Fix: Use tab-aware columns; hide Roles/Membership/Joined/Related role records for faithful Faculty and Students table defaults

## G2-8-001-010  [P2] GAP  facet F04  effort S
- Legacy: `components/contacts/contactColumns.js:1-17`: All Role maps FACULTY→Faculty, LEARNER→Student, ADMIN→Admin, RECRUITER→Recruiter
- vNext now: `app/(authenticated)/college/contacts/page.tsx:218-219`: raw role enums joined with ` / ` (e.g. LEARNER)
- Fix: Translate role labels using exact legacy mapping and deliberate dual-role display

## G2-8-001-019  [P2] GAP  facet F06  effort S
- Legacy: `components/contacts/ContactsGrid.js:150-156`: controlled search input, placeholder `Search contacts...`, allowClear, no submit
- vNext now: `app/(authenticated)/college/contacts/page.tsx:58-66`: GET form, label Name or email, maxLength 100, placeholder `Search contacts`, submit button
- Fix: Match placeholder ellipsis and clear affordance; preserve accessible explicit server search button if privacy policy requires

## G2-8-001-034  [P2] GAP  facet F13  effort S
- Legacy: `components/contacts/ContactsGrid.js:180-190,218-223`: `No contacts found` vs `No contacts match your search` and guidance `Try a different search term.`
- vNext now: `app/(authenticated)/college/contacts/page.tsx:209-213`: single `No matching contacts` / `No contacts in this college match the selected filters.`
- Fix: Differentiate truly empty college vs filtered empty and restore exact legacy help text

## G2-8-001-041  [P2] GAP  facet F17  effort S
- Legacy: `components/contacts/ContactsGrid.js:264-279`: mobile nav buttons aria-label Previous page/Next page; avatar alt text from name at lines 35-43
- vNext now: `app/(authenticated)/college/contacts/page.tsx:211-244`: table caption, labeled Pagination and link focus classes; avatar absent
- Fix: Restore meaningful image alternative and explicit mobile Previous/Next labels or verify equivalence

## G2-8-001-042  [P2] GAP  facet F18  effort S
- Legacy: `pages/superadmin/sections/PeopleDirectory.js:24-30`: `People Directory`, exact description, three management action labels
- vNext now: `app/(authenticated)/college/contacts/page.tsx:41-49`: `Contacts`, different description, `Faculty contacts`, `Student contacts`
- Fix: Use legacy exact title, description, tab names Faculty/Students, retain privacy notice outside title

## G2-8-003-003  [P2] GAP  facet F02  effort M
- Legacy: `.../PeopleDirectory.js:24-49`: outer ln-module, overview Card, then Alert or antd Tabs grid
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:40-69`: PageHeader, tabs, counters, FilterBar; admin directory `page.tsx:59-85` has a related views disclosure
- Fix: Keep legacy heading, actions and tab immediately following; move optional counters/disclosures below search

## G2-8-003-004  [P2] GAP  facet F02  effort S
- Legacy: `.../components/admin/people/PeoplePageOverview.jsx:13-43`: eyebrow People, title, short description and three actions in bordered overview Card
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:41-43`: PageHeader without eyebrow or Card; `/admin/people/directory/page.tsx:60-65` has different description
- Fix: Match legacy eyebrow/card composition only if shell design permits; exact wording is required

## G2-8-003-005  [P2] GAP  facet F03  effort S
- Legacy: `.../PeopleDirectory.js:31-33`: Student accounts, Faculty accounts, Teaching assignments as antd Buttons
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:43`: plain underlined links, `admin/people/directory/page.tsx:73-76` links inside disclosure
- Fix: Use outlined controls with same three visible labels and order for both roles

## G2-8-003-006  [P2] GAP  facet F03  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:145-157`: TeamOutlined count pill, magnifier, clearable search
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:54-65`: applied filters and Search contacts button; admin directory `page.tsx:85-96` different Name or college search
- Fix: Show contact count pill, magnifier icon and clear affordance in both implementations

## G2-8-003-007  [P2] GAP  facet F03  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:21-66`: 8 tinted palettes for avatar and initials fallback
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:214-218`, `admin/people/directory/page.tsx:121-129`: only linked name text
- Fix: Restore avatar image/fallback, using stable seed and role-safe image URL

## G2-8-003-008  [P2] GAP  facet F04  effort M
- Legacy: `.../components/contacts/contactColumns.js:3-18`: All: Name, Email, Contact, Role
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:214-235`: 7 columns; `admin/people/directory/page.tsx:121-142`: 7 different columns
- Fix: Restore exact default All tab columns and labels; present additional status data separately

## G2-8-003-009  [P2] GAP  facet F04  effort S
- Legacy: `.../components/contacts/contactColumns.js:19-58`: Faculty/Student: Name, Email, Contact
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:214-235`: all tabs seven columns; admin directory same seven
- Fix: Tab-aware columns for Faculty and Students

## G2-8-003-010  [P2] GAP  facet F04  effort S
- Legacy: `.../components/contacts/contactColumns.js:1-17`: role label FACULTY/LEARNER/ADMIN/RECRUITER → Faculty/Student/Admin/Recruiter
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:218-219`: uppercase roles joined; admin directory `page.tsx:135-136` badges uppercase
- Fix: Render human-readable role names and handle dual memberships explicitly

## G2-8-003-013  [P2] GAP  facet F05  effort S
- Legacy: `.../PeopleDirectory.js:40-47`: tabs All contacts, Faculty, Students; each ContactsGrid with userType All/FACULTY/LEARNER
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:44-49`: All contacts, Faculty contacts, Student contacts; admin `page.tsx:54-68` exact legacy labels
- Fix: Restore exact College Admin tab labels; keep role source semantics

## G2-8-003-019  [P2] GAP  facet F06  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:150-157`: `Search contacts...`, allowClear, no maxLength stated
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:60-65`: `Search contacts` max100 GET; admin `page.tsx:88-96` Name or college
- Fix: Match exact placeholder and clear action; retain 100-char server validation as extra
