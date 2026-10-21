# Work packet (wave 3): edit src/modules/courses/college-course-catalogue-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-18-003-022  [P1] MISSING  facet F04  effort L
- Legacy: Legacy course image from metadata.imageUrl/image_url preview. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:20-24`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-476`
- vNext now: vNext normalized courses schema does not include old metadata image URL in row. `src/db/schema/courses.ts:34-61`, `src/modules/courses/college-course-catalogue-service.ts:52-58`
- Fix: Add authorized course cover image field/link and render in table and creation form.
