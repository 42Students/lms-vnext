# Work packet: edit src/app/(authenticated)/teacher/contacts/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-index.md

## G2-6-005-020  [P1] GAP  facet F11  effort M
- Legacy: Old index does not perform role/tenant check, contacts target enforces access `docs/legacy-source/frontend/src/pages/teacher/contacts/index.js:11-19` `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-23`
- vNext now: New index similarly has no auth check in route, target list service gates membership `src/app/(authenticated)/teacher/contacts/page.tsx:3-5` `src/modules/courses/faculty-contacts-service.ts:25-49`
- Fix: Document narrower Faculty-only requirement at destination and ensure non-Faculty staff route resolution
