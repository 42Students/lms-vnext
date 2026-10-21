# Work packet (wave 2): edit src/modules/academics/super-admin-lecture-hall-directory-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-lecture-halls.md

## G2-10-018-020  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-421 — Client Table defaults 10/page, size changer, range 'a-b of total'.
- vNext now: src/modules/academics/super-admin-lecture-hall-directory-model.ts:9-26; src/app/(authenticated)/admin/lecture-halls/page.tsx:140-153 — Server 10/page and 10/25/50/100 options (advanced filter), separate paginator.
- Fix: Put size chooser and range within table footer.
