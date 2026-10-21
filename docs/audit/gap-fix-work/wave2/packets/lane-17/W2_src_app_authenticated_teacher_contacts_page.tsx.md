# Work packet (wave 2): edit src/app/(authenticated)/teacher/contacts/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-index.md

## G2-6-005-018  [P2] GAP  facet F10  effort S
- Legacy: Old only side effect is browser history replace `docs/legacy-source/frontend/src/pages/teacher/contacts/index.js:13-17`
- vNext now: New Next redirect returns location to target `src/app/(authenticated)/teacher/contacts/page.tsx:3-5`
- Fix: Check exact replace vs push semantics; use replace-class navigation to avoid extra Back entry
