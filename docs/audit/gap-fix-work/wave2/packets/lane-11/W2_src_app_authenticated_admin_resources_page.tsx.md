# Work packet (wave 2): edit src/app/(authenticated)/admin/resources/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-19-002-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy one `/superadmin/lesson-content?type=video\|live-classes\|resources` route selects `LessonContent` or `AdminResources` `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:68-75`
- vNext now: vNext three routes `/admin/videos`, `/admin/live-classes`, `/admin/resources` `src/app/(authenticated)/admin/videos/page.tsx:1-5` `src/app/(authenticated)/admin/live-classes/page.tsx:1-5` `src/app/(authenticated)/admin/resources/page.tsx:1-5`
- Fix: Maintain redirects with tab semantics and exact Course & Content group navigation.

## G2-9-025-001  [P2] GAP  facet F01  effort S
- Legacy: Old Resources is a standalone ln-module admin-list-page with heading h2 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:324-328`
- vNext now: Admin route wraps centralized PageHeader Resources and Courses back link `src/app/(authenticated)/admin/resources/page.tsx:1-6` `src/components/courses/super-admin-content-directory-page.tsx:85-89`
- Fix: Match legacy heading scale/spacing and remove additional back-link from primary head.
