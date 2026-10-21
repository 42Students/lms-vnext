# Work packet (wave 2): edit src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-6/teacher-contacts-index.md, docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-1-008-076  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:23-52`: faculty tabs All Contacts / Teachers / Students.
- vNext now: `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:85-93`: Directory results + contact count inside role tab page.
- Fix: Preserve teacher tab labels, headings and selected-state copy.

## G2-6-005-005  [P2] GAP  facet F02  effort M
- Legacy: Old final Contacts content comes from downstream dynamic route's ContactsTabLayout `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:57-64` `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:40-50`
- vNext now: New final content comes from server dynamic contacts page `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:74-88`
- Fix: Compare redirected destination's shell and restore Contacts header hierarchy

## G2-6-005-029  [P2] GAP  facet F16  effort M
- Legacy: Old eventual Contacts tab includes mobile cards in Grid `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-23`
- vNext now: New eventual Contacts tab uses mobile list/table `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:60-69` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:74-99`
- Fix: Handle destination responsive parity in U004, not index route

## G2-6-004-002  [P2] GAP  facet F01  effort S
- Legacy: Old invalid path/default renders All Contacts without redirect `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:45-54`
- vNext now: New invalid path redirects to `/teacher/contacts/allContacts` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:34-36`
- Fix: Decide whether unsupported legacy paths should render default directly or redirect, and preserve back behavior

## G2-6-004-003  [P2] GAP  facet F01  effort S
- Legacy: Old ContactsTabLayout title `Contacts` and tab strip `All Contacts`, `Teachers`, `Students` `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:17-26` `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:40-50`
- vNext now: New PageHeader uses active tab label then Tabs `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:80-88`
- Fix: Restore outer `Contacts` heading with tabs inside same PageShell

## G2-6-004-005  [P2] GAP  facet F02  effort M
- Legacy: Old contact layout outer scroll-container, learn-contacts-page, learn-projects and learn-placements-dashboard `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:30-51`
- vNext now: New outer div uses min-w-0 max-w-full space-y-4 `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:79-81`
- Fix: Match inherited PageShell canvas gutters, card padding and section border

## G2-6-004-006  [P2] GAP  facet F02  effort S
- Legacy: Old layout has PageShell `Contacts`, tabs, then ContactsGrid toolbar and table `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:40-50` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:139-163`
- vNext now: New active-tab PageHeader, Tabs, `Directory results` heading, filters and table `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:79-133`
- Fix: Match old vertical order and remove duplicate active-tab heading

## G2-6-004-007  [P2] GAP  facet F02  effort M
- Legacy: Old contacts toolbar is single horizontal row (title, count pill, Search) `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:139-158`
- vNext now: New header/filters split into multiple rows `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:90-132`
- Fix: Recreate responsive single-row toolbar with separate count pill and search icon

## G2-6-004-008  [P2] GAP  facet F03  effort S
- Legacy: Old iconized count pill uses TeamOutlined and `N contacts` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:145-149`
- vNext now: New numeric count is plain paragraph in Directory results `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:94-102`
- Fix: Add count pill with team icon and load-time em dash

## G2-6-004-009  [P2] GAP  facet F03  effort S
- Legacy: Old search Input has SearchOutlined prefix and allowClear `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157`
- vNext now: New plain Input plus Search button and separate Clear search link `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:104-143`
- Fix: Restore prefix icon and inline clear X affordance

## G2-6-004-023  [P2] GAP  facet F05  effort M
- Legacy: Old search applies immediately as typed, allowClear no submit `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:105-116`
- vNext now: New GET form needs explicit Search submit and shows Results for phrase `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:104-143`
- Fix: Restore live text filtering/debounce without exposing private contact fields

## G2-6-004-027  [P2] GAP  facet F06  effort S
- Legacy: Old search box is uncontrolled by URL, placeholder `Search contacts...`, no length limit `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:75-76` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157`
- vNext now: New q URL maxLength 200, placeholder `Name or department` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:104-112` `src/modules/courses/faculty-contacts-filter-model.ts:3-7`
- Fix: Restore exact placeholder, search icon, clear behavior; retain defensive max length

## G2-6-004-028  [P2] GAP  facet F06  effort S
- Legacy: Old per-page size changer embedded in table pagination `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:167-177`
- vNext now: New pageSize dropdown in top filter form `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:113-125`
- Fix: Move rows-per-page affordance beside pagination, maintain values

## G2-6-004-036  [P2] MISSING  facet F09  effort S
- Legacy: Old error Retry button only appears inside table/card empty state `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:179-191` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:212-217`
- vNext now: New main page has no inline Retry on contact service error `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:55-67` `src/components/courses/faculty-contacts-table.tsx:17-18`
- Fix: Add inline Retry for both desktop and mobile directory failure state

## G2-6-004-046  [P2] GAP  facet F13  effort M
- Legacy: Old mobile loading draws exactly 3 skeleton contact cards `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:198-211`
- vNext now: New page has no local skeleton branch, server render of final rows `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:55-79` `src/components/courses/faculty-contacts-table.tsx:17-35`
- Fix: Add three-card loading skeleton with avatar and 3 text lines

## G2-6-004-056  [P2] GAP  facet F17  effort S
- Legacy: Old tab nav uses PageShell ariaLabel `Contacts sections` plus keyboard scroll `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:40-46`
- vNext now: New Tabs ariaLabel `Contact types` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:84-88`
- Fix: Match aria-label and verify tab keyboard navigation

## G2-6-004-057  [P2] GAP  facet F17  effort S
- Legacy: Old input clear built into Ant allowClear with keyboard focus `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157`
- vNext now: New Clear search link appears separately on active q `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:135-143`
- Fix: Restore inline clear affordance without losing accessible clear action

## G2-6-004-058  [P2] GAP  facet F18  effort S
- Legacy: Old outer title `Contacts` / active title `All Contacts`/`Teachers`/`Students` `docs/legacy-source/frontend/src/layouts/contactsTabLayout.js:40-46` `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-53`
- vNext now: New only active title, additional `Directory results` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:80-94`
- Fix: Recreate old title hierarchy and drop new generic section title if not in legacy

## G2-6-004-059  [P2] GAP  facet F18  effort S
- Legacy: Old search placeholder `Search contacts...` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157`
- vNext now: New `Name or department` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:105-112`
- Fix: Use exact placeholder with ellipsis
