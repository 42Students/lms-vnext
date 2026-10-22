# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-001-055 [P1] GAP facet F14
- Files: src/components/tpo/tpo-students-spreadsheet.tsx
- Legacy: Legacy Excel/CSV export selected/view with academics and view filename; vNext XLSX and CSV exist with different columns — `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:321-335`; `docs/legacy-source/frontend/src/pages/tpo/students/index.js:142-178`
- Expected fix: Align export field ordering, marks and saved-view names

## G2-18-013-001 [P1] GAP facet F01
- Files: src/app/api/placements/jobs/route.ts, src/modules/placements/learner-job-service.ts
- Legacy: Legacy JobSearchCache initializes on service startup and backs /api/v2/jobs/search and category/popular endpoints; JobSearchCache.java:32-63;JobSearchController.java:37-41,121-139
- Expected fix: Inventory legacy callers of /api/v2/jobs/* and map to new role/tenant-scoped endpoints before removing compatibility

## G2-18-013-017 [P1] GAP facet F07
- Files: src/app/api/placements/jobs/route.ts
- Legacy: Legacy startup load failure caught/logged, cache may remain empty; JobSearchCache.java:116-143
- Expected fix: Separate empty results from failed DB requests, show retry and log failure

## G2-18-028-009 [P1] GAP facet F04
- Files: src/modules/projects/workspace-brief-model.ts
- Legacy: Legacy workspace.overview goal/deliverables/definitionOfDone/personas plus arbitrary map facts; overview.js:41-66
- Expected fix: Map definitionOfDone to completionConditions, inherited map keys and intentional empty values

## G2-18-028-019 [P1] GAP facet F07
- Files: src/modules/projects/workspace-brief-model.ts
- Legacy: Old deliverables must contain nonblank line: Add at least one deliverable.; WorkspaceOverviewEditor.jsx:60-65
- Expected fix: Align required deliverables for published workspace, distinguish draft policy

## G2-18-028-030 [P1] GAP facet F12
- Files: src/modules/projects/workspace-brief-model.ts, src/modules/projects/workspace-brief-service.ts
- Legacy: Old overviewFactsRef re-sends unedited opaque JSON keys; overview.js:41-56,80-97
- Expected fix: Migrate or preserve opaque template fields, never erase silently

## G2-18-028-044 [P1] GAP facet F22
- Files: src/modules/projects/workspace-brief-model.ts, src/modules/projects/workspace-brief-service.ts
- Legacy: Old flexible overview JSON and definitionOfDone key; overview.js:41-66
- Expected fix: Specify one-to-one migration including opaque facts, defaults and clear values

## G2-15-002-035 [P1] MISSING facet F07
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Profile schema form validates before update; invalid JSON shows toast `Invalid JSON` (`ProfileSectionsPanel.js:243-261`).
- Expected fix: Add field-level form validation and matching JSON fallback when applicable.

## G2-15-005-041 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy `GET /api/v1/jobs/{id}/visibility/{learnerId}` and getApplyCheck; detail data scoped (JobDetailContent.jsx:220-252)
- Expected fix: Use ID-scoped authorized job query to avoid broad expensive whole-feed load, preserve restricted statuses

## G2-15-005-075 [P1] GAP facet F22
- Files: src/modules/placements/learner-historical-drive-service.ts
- Legacy: Legacy one application/receipt record carries resumeUrl and nextInterview, direct status transitions (JobDetailContent.jsx:320-387,448-481,572-593)
- Expected fix: Document application-to-role ID, submission receipt, resume evidence and withdrawal history model, migrations if required

## G2-15-008-014 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Old types resource/video/assignment/youtube/live_class/quiz with synonyms assessment, quiz_v2 (syllabusDetail.js:44-76,517-561)
- Expected fix: Map all legacy type aliases and inline item order so assessment/quiz variants not silently lost

## G2-16-001-027 [P1] GAP facet F07
- Files: src/modules/bug-tracker/independent-finding-actions-model.ts, src/components/tracker/independent-finding-actions.tsx
- Legacy: `AuditFindingService.java:133-147,155-188`: exact server messages for unknown status, duplicate, same value, reason, assignee length, SHA.
- Expected fix: Map per-case validation to legacy wording while retaining conflict/version handling; show API reason field to user.

## G2-16-001-044 [P1] GAP facet F12
- Files: src/modules/bug-tracker/independent-finding-actions-model.ts, src/components/tracker/independent-finding-actions.tsx
- Legacy: `AuditFindingService.java:184-193`; `auditFindingsModel.js:31`: repo enum `lms`, `lms2-fe`, `both`, `infra`, `other`, lowercase SHA.
- Expected fix: Restore repo dropdown enum, default `lms2-fe`, and lowercase SHA rule for old data.

## G2-16-002-060 [P1] GAP facet F13
- Files: src/app/(authenticated)/tracker/page.tsx
- Legacy: `index.js:194`: public route usable when no user session.
- Expected fix: Expose deliberate unavailable/expired-session recovery to public reporter if public policy reinstated.

## G2-16-004-019 [P1] GAP facet F05
- Files: src/app/(authenticated)/tracker/issues/page.tsx, src/modules/bug-tracker/issues-query-model.ts
- Legacy: `issues/index.js:99-122`: GET filters status/environment/reporter/search/sort, default 20 per page.
- Expected fix: Restore legacy visible 20/page and equivalent query/filter contract, retain new severity filter as optional enhancement.

## G2-16-007-051 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/semester-courses/page.tsx
- Legacy: `SemesterCourseMapping.js:336-341`: independent lookup error Alert lists failed keys and Retry.
- Expected fix: Return partial lookup failures and Retry instead of losing entire page.

## G2-16-022-010 [P1] GAP facet F06
- Files: src/modules/placements/tpo-public-join-link-model.ts
- Legacy: TpoPublicLinkController.java:24-27 enabled and postDirect nullable fields.
- Expected fix: Add independent validated posting policy field.

## G2-17-013-001 [P1] GAP facet F01
- Files: src/app/api/placements/jobs/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:36-41 — Dedicated /api/v2/jobs search controller with CORS and authenticated scope.
- Expected fix: Map legacy search route callers to scoped vNext filter endpoint.

## G2-17-013-027 [P1] GAP facet F10
- Files: src/app/api/placements/jobs/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:121-213 — GET /search with query/limit/learnerId/deptId/programId/jobType.
- Expected fix: Build /search scoped query route and filtering logic.

## G2-17-004-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/projects/[projectId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:7-15 mounts ProjectDetailContent for /learn/projects/[projectId] and passes projectId through router query.
- Expected fix: Decide legacy numeric/string project-link compatibility; route old IDs through resolver or document unsupported links.

## G2-17-012-002 [P1] GAP facet F01
- Files: src/app/api/placements/jobs/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:132-153 — Legacy GET list derives org from current principal.
- Expected fix: Map super-admin organization selector/college scope explicitly.

## G2-17-012-028 [P1] GAP facet F10
- Files: src/app/api/placements/jobs/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:248-273 — Legacy POST /api/v1/placement-jobs derives principal organization/user.
- Expected fix: Provide organization-wide create path for authorized super admins.

## G2-18-011-049 [P1] GAP facet F12
- Files: src/modules/placements/learner-offer-decision-model.ts, src/modules/placements/application-service.ts
- Legacy: Legacy one accepted offer per learner, cascade to other active applications (`JobServiceImpl.java:1168-1255,1325-1390`).
- Expected fix: Cross-check offer acceptance cross-application cascade against college max-held offers rules.

## G2-18-010-071 [P1] GAP facet F23
- Files: src/modules/placements/tpo-student-nudge-send-service.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy support recruiter/system/student email under one branded abstraction (`TpoMailService.java:73-110`).
- Expected fix: Create event/channel coverage matrix, add missing mail event integrations intentionally.

## G2-18-002-064 [P1] GAP facet F10
- Files: src/app/api/courses/lessons/[lessonId]/route.ts, src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy update PUT `/api/v1/lesson/update/:id`, mutable course, name, active, enabled, sequence. `docs/legacy-source/frontend/src/api/Services/AdminService.js:576-578`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-315`
- Expected fix: Document immutable parent as deliberate change or implement audited move with transactional child data consistency.
