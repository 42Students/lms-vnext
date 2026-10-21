# Work packet: edit src/components/courses/super-admin-content-directory-page.tsx (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md

## G2-17-003-024  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:27-30 scopeApplyError reports 'College scope could not be applied' and instructs reselect/refresh.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 only no-college empty state; scope-application failure reason absent.
- Fix: Differentiate token/scope mismatch from genuinely unselected college.

## G2-19-002-042  [P2] GAP  facet F07  effort M
- Legacy: Legacy classes/faculty/course/lessons lookup errors targeted with Retry and create disabled `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1148-1155` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1560-1564`
- vNext now: vNext separate authoring options unavailable banner yet directory remains visible; no individual `Retry faculty/courses` `src/components/courses/super-admin-content-directory-page.tsx:67-93`
- Fix: Restore per-lookup warning copy and retry actions without blocking unaffected list.
