# Work packet (wave 2): edit src/modules/academics/college-lecture-hall-directory-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-lecture-halls.md

## G2-9-017-025  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-425` — Small Ant Table paginated 10 by default, size changer enabled.
- vNext now: `src/modules/academics/college-lecture-hall-directory-model.ts:4-4` — Fixed 25 per page with external pager.
- Fix: Restore 10 default with 10/20/50/100 choices.

## G2-9-017-085  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:413-424` — 10 initial rows, chooser, client pagination after fetch.
- vNext now: `src/modules/academics/college-lecture-hall-directory-model.ts:4-4` — 25 rows fixed, API limit25.
- Fix: Support 10 default, selectable sizes with query.
