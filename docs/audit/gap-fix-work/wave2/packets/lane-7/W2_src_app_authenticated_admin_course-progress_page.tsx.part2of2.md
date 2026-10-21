# Work packet (wave 2): edit src/app/(authenticated)/admin/course-progress/page.tsx (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md

## G2-14-003-012  [P3] GAP  facet F03  effort S
- Legacy: Legacy measured work explainer warns resources self-reported; vNext similar work types but additional attendance caveat — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:239-245`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:44-46`
- Fix: Match exact legacy two-part copy and note extra caveat separately

## G2-19-003-003  [P3] GAP  facet F01  effort S
- Legacy: No college AntD warning Select a college to continue `docs/legacy-source/frontend/src/pages/superadmin/course-progress.js:10-21`
- vNext now: No college EmptyState with matching words but different treatment `src/app/(authenticated)/admin/course-progress/page.tsx:32-35`
- Fix: Use warning banner spacing and icon.

## G2-19-003-060  [P3] GAP  facet F18  effort S
- Legacy: Legacy page heading Course Progress `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:235`
- vNext now: vNext Progress `src/app/(authenticated)/admin/course-progress/page.tsx:40`
- Fix: Match title literally.
