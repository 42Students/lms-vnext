# Work packet: edit src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-index.md, docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-6-005-009  [P1] GAP  facet F04  effort M
- Legacy: Old destination roster has Email and Contact fields `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-23`
- vNext now: New destination uses public displayName/department and omits contact fields `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:60-69`
- Fix: Resolve destination's intentional contact-data privacy exception (U004), not redirect index

## G2-6-004-031  [P2] GAP  facet F07  effort M
- Legacy: Old failed network fetch triggers notification title `Couldn't load contacts` and description `Something went wrong on our end...` `docs/legacy-source/frontend/src/hooks/useContacts.js:29-38`
- vNext now: New page awaits list service without local recoverable load error `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:55-67`
- Fix: Render retryable failure and exact legacy error message for the page

## G2-6-004-033  [P2] GAP  facet F08  effort M
- Legacy: Old query fetch failure displays Ant notification bottomRight, duration 5s `docs/legacy-source/frontend/src/hooks/useContacts.js:31-38`
- vNext now: New service throws into app error boundary, no 5-second notification in page `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:55-67`
- Fix: Show equivalent nonblocking toast with exact duration and location when appropriate

## G2-6-004-034  [P2] GAP  facet F08  effort S
- Legacy: Old search yields count pill (loading `—`) and clear affordance `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:145-157`
- vNext now: New count in live region and Results for quote on active search `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:94-102` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:135-143`
- Fix: Restore count-pill info state; keep accessible live count as additive
