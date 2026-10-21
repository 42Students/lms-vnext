# Work packet (wave 2): edit src/modules/courses/super-admin-content-datetime-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md

## G2-19-002-036  [P2] GAP  facet F06  effort L
- Legacy: Legacy live meeting zone choices IST, UTC, America/New_York, America/Los_Angeles, Europe/London `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1525-1536`
- vNext now: vNext edit zone choices only IST and UTC `src/components/courses/super-admin-content-actions.tsx:150-160` `src/modules/courses/super-admin-content-datetime-model.ts:3-17`
- Fix: Support legacy zones with DST-safe parsing or explicitly migrate to IST policy.
