# Work packet (wave 2): edit src/modules/courses/faculty-contacts-filter-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-6-004-027  [P2] GAP  facet F06  effort S
- Legacy: Old search box is uncontrolled by URL, placeholder `Search contacts...`, no length limit `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:75-76` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157`
- vNext now: New q URL maxLength 200, placeholder `Name or department` `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:104-112` `src/modules/courses/faculty-contacts-filter-model.ts:3-7`
- Fix: Restore exact placeholder, search icon, clear behavior; retain defensive max length
