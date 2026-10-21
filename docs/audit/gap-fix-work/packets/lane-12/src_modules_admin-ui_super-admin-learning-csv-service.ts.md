# Work packet: edit src/modules/admin-ui/super-admin-learning-csv-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-3-004-026  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:265-285`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:52-53`; `src/modules/admin-ui/super-admin-learning-csv-service.ts:29-61`
- Fix: Legacy export page has 5 columns, vNext up to 500 filtered rows/13 columns with truncation marker and different filename. Keep page-export option or clearly label expanded export.
