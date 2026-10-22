# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-031-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:173-242 create/bulk materializes teams and workspaces.
- Expected fix: Compare transactional team assignment and failed bulk rollback state.

## G2-19-027-092 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/Course.java:24-76 has integer ID/dept ID, optional parent/createdByOrgId, 3 visibility fields, slug, optimistic version, JSON contents.
- Expected fix: Write complete old-to-new schema migration with typed JSON extraction and legacy identity crosswalk.

## G2-7-002-040 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/service/AdminAuditLogService.java:47-82: audit writers saveAndFlush with action/entity/actor/IP/UA/payload.
- Expected fix: Document audit attribution metadata parity, retention and actor context where appropriate.

## G2-7-004-054 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:428-454: `active-readiness-overrides.csv`, six headers Workspace,Workspace ID,Override direction,Override note,Overridden by,Overridden at.
- Expected fix: Restore six headers, workspace UUID/ID and exact labels/values.

## G2-7-007-026 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:21-51: separate GET workspace summary and GET project resource audit (per college/slug), independent error/retry.
- Expected fix: Split dedicated resource-audit read from workspace summary; avoid failing audit on unrelated services.

## G2-7-010-010 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:176-218: twelve field attributes incl Key, Status, Title, Ceremony, Date, Start/end, URL, Linked sprint/task, Agenda, Notes.
- Expected fix: Expose all 12 legacy editable fields with same validation/placeholder semantics.

## G2-7-011-069 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:61-82,108-109: rehydrate form on workspace reload/reset and preserve extra keys.
- Expected fix: Key form to project version or useEffect sync on updatedAt after save.

## G2-7-013-072 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:70-85: remove + Undo local, independent of network failures
- Expected fix: Make archive reversible or require deliberate decision about removal

## G2-7-015-006 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:541-569 snapshot then at-risk alert and linked reason alert
- Expected fix: Rebuild read-first snapshot and source-risk banners before editor

## G2-7-015-081 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LFE/dto/projects/ProjectWorkspaceUpdateDTO.java:9-49 scalar fields+detailsToken+classId
- Expected fix: Map optional/touched-update contract and null-clearing semantics

## G2-7-017-012 [P1] MISSING facet F03
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:168-175 Check roster button only for group workspace
- Expected fix: Add authorized manual team reconciliation action

## G2-7-017-085 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:147-175 managed group Check roster
- Expected fix: Either reinstate authorized group reconciliation or clearly document replacement workflow

## G2-7-018-069 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:19-21 separate Deleted workspaces from normal active workspace list
- Expected fix: Do not silently substitute Archived workspaces for Deleted workspaces

## G2-7-034-030 [P1] MISSING facet F17
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: SuperAdminTemplateShell.jsx:46-52 two focusable Back/Use buttons
- Expected fix: Restore keyboard-accessible Use template control

## G2-8-021-064 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy Attend inherits int identity, createdAt, updatedAt, isDeleted flag (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-38; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:11-15).
- Expected fix: Write migration/compatibility strategy for historic primary keys and soft-delete chronology.

## G2-8-008-052 [P1] GAP facet F19
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: legacy fetch all classes/courses then individual per-pair progress; local refresh (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,136-164`)
- Expected fix: Surface truncation of class choices as well as learner rows; avoid silently hiding valid classes

## G2-11-021-007 [P1] GAP facet F04
- Files: src/app/(authenticated)/tpo/reports/unplaced/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportViews.js:50-59 unplaced Resume field is Uploaded or Missing
- Expected fix: Read verified resume evidence; do not hardcode unavailable

## G2-8-007-008 [P1] GAP facet F04
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: table fields Overview/Course/Lesson/Due Date/Status/Grade/Actions (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:57-67`)
- Expected fix: Show released numeric score and denominator when authorized, keep unreleased privacy guard

## G2-8-007-009 [P1] GAP facet F04
- Files: src/components/courses/learner-assessment-overview.tsx
- Legacy: grade submitted with released results renders latestScore/latestMaxScore (`docs/legacy-source/frontend/src/components/Quiz/Table/table.js:281-293`)
- Expected fix: Expose published numeric score from scoped grade projection where permitted; never leak answer key early

## G2-8-018-010 [P1] GAP facet F04
- Files: src/app/(authenticated)/notifications/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NotificationResponseDTO.java:19-38: class/course/recipient IDs and application/job/assessment/interview context
- Expected fix: Add typed target metadata or safe target-link transformation for every legacy resource.

## G2-8-025-002 [P1] GAP facet F01
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: Legacy reads embedded ContentDataDTO.resourceMaterials by 0-based index (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-104).
- Expected fix: Provide stable legacy index-to-material-ID adapter for existing links.

## G2-8-025-004 [P1] GAP facet F02
- Files: src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts
- Legacy: Old endpoint is backend-only; file material selected from lesson resource card list (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:31-35,94-104).
- Expected fix: Ensure card row's Download link binds correct material ID and title, not parent content key.

## G2-8-025-008 [P1] GAP facet F04
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: Old indexes materials list by materialIndex integer and preserves order from ContentDataDTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-100).
- Expected fix: Migrate exact index ordering and preserve historical references even after reorder.

## G2-8-025-011 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Legacy material fetched by exact array index; invalid index returns 404 (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-56,94-103).
- Expected fix: Prevent legacy resources with >20 materials being invisibly truncated; paginate/show count.

## G2-8-024-019 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy grant capabilities unknown value rejected with UNKNOWN_CAPABILITY (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:523-532).
- Expected fix: Add capability controls or intentionally default exact permission contract.
