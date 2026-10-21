# Work packet: edit src/components/courses/faculty-contacts-table.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-6-004-012  [P1] GAP  facet F04  effort L
- Legacy: Old All table columns Name, Email, Contact, Role `docs/legacy-source/frontend/src/components/contacts/contactColumns.js:3-27`
- vNext now: New table columns Contact, Department, Current college roles `src/components/courses/faculty-contacts-table.tsx:38-55`
- Fix: Restore Email/Contact columns only where privacy policy permits; otherwise mark approved deviation
