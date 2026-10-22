# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-021-044 [P1] MISSING facet F20
- Files: (none, new feature)
- Legacy: LBE/dto/response/PublicJobResponseDTO.java:31 jobSlug stored as string, stable across job edits if persisted.
- Expected fix: Import old slug mapping and HTTP 301/308 redirects to stable public link.

## G2-18-021-060 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LBE/service/impl/JobServiceImpl.java:1505-1540 includes applied-job dates even when no longer visible (non-deleted).
- Expected fix: Preserve applied-job history event visibility after deadline for learner career continuity.

## G2-7-001-041 [P1] GAP facet F12
- Files: src/modules/projects/risk-signals.ts
- Legacy: LFE/components/admin/projects/adminProjectUtils.js:263-281: pending includes submitted OR under review in resolvedDelivery/delivery.
- Expected fix: Support equivalent under-review semantics or explicitly migrate states.

## G2-7-001-044 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:94-108: bucket counts each pass the current search to the backend.
- Expected fix: Make count scope match search filters or label as unfiltered.

## G2-7-002-080 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:313-455: ungrouped raw event table and detailed payload per record.
- Expected fix: Provide ungroupped audit mode or open individual event details for every grouped item.

## G2-7-005-029 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:145-230: GET only; click Use navigates to creation route.
- Expected fix: Restore CTA to authoritative create route.

## G2-7-008-005 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:49-86: hero Card with topline, status tag, four facts, Primary submission area.
- Expected fix: Use one latest-delivery hero card with four facts and primary evidence actions, keeping version history secondary.

## G2-7-011-016 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:67-68,94-111: keeps all unedited arbitrary overview keys intact.
- Expected fix: Preserve unknown legacy overview keys in compatibility projection or explicitly inventory/migrate them before replace.

## G2-7-013-015 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:147-159: types Link,PDF,DOC,PPT,Video,File (stored Link/PDF/DOC/PPT/Video/File)
- Expected fix: Define exact type enum conversion especially PDF/PPT/VIDEO/DOC; do not silently collapse

## G2-7-014-029 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276 required Title+releaseKey and max500, errors `Item N: Title, Release key required`
- Expected fix: Map exact per-row errors for bulk editor and 500-row cap

## G2-7-015-042 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:479-500 Archive/Delete Popconfirms exact actions and descriptions
- Expected fix: Restore two distinct confirmations, target Deleted workspaces on delete

## G2-7-016-038 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:50-107 College Admin authors tasks in editable plan
- Expected fix: Give College Admin authorized planning endpoint or remove dead-end create control

## G2-7-017-030 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:404-425 enforces total active <=500, not only selected batch
- Expected fix: Raise max to supported 500 with server-safe transactional validation

## G2-7-018-027 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:127-128 older records partial restore warning based on recoverableContent
- Expected fix: Condition restore confirmation on actual recoverable snapshot ability

## G2-7-027-050 [P1] GAP facet F10
- Files: src/components/projects/project-meeting-controls.tsx
- Legacy: PDC:10346-10598 meeting post/update carries notes, followups, retrospective
- Expected fix: Crosswalk mutation payload, record properties and meeting status transitions

## G2-7-027-086 [P1] GAP facet F20
- Files: src/app/(authenticated)/mentor/projects/[projectId]/page.tsx
- Legacy: PDC:861-871 one-time delivery modal open ref
- Expected fix: Preserve once-only open and dismiss state

## G2-7-030-002 [P1] GAP facet F01
- Files: src/modules/projects/admin-audit-query-model.ts
- Legacy: audit/index.js:156-198 URL state status, range, entityId, zero-based page
- Expected fix: Translate old status enum, range, entityId and page deep links before new query

## G2-7-033-035 [P1] GAP facet F10
- Files: src/components/projects/project-template-controls.tsx
- Legacy: AdminService.js:template assignment endpoints assign/unassign and bulkSet uses numeric templateId
- Expected fix: Map numeric IDs/endpoint shape; preserve reassignment semantics and scope checks

## G2-7-035-030 [P1] GAP facet F07
- Files: src/components/projects/project-template-controls.tsx
- Legacy: overview.js:315-327 Save your overview changes before publishing
- Expected fix: Block publish while unsaved Overview editor changes

## G2-7-035-058 [P1] MISSING facet F15
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:409-443 creating workspace triggers membership/mentor notifications via server
- Expected fix: Retain creation-side notifications when restored

## G2-7-035-071 [P1] GAP facet F20
- Files: src/components/projects/project-template-controls.tsx
- Legacy: overview.js:316-319 dirty form blocks publish
- Expected fix: Prevent status changes while unsaved field edits pending

## G2-8-027-011 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy interview ID INT, organizationId INT, Job,JobApplication,Learner FK (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-47).
- Expected fix: Backfill interview-to-slot IDs and enforce application membership link.

## G2-11-030-031 [P1] GAP facet F12
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: 112 valid old statuses ALL/APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/WAITLISTED/REJECTED/OFFERED/WITHDRAWN
- Expected fix: Maintain legacy displayed stage names and mappings for canonical states.

## G2-12-012-014 [P1] GAP facet F11
- Files: src/modules/placements/tpo-company-domain-service.ts, src/modules/placements/public-join/send-code-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:56-61 defines common company-domain rules for recruiter signup, invites, TPO, Settings and Super Admin
- Expected fix: Centralize domain policy across role-gated writes and anonymous verification without leaking domain lookups

## G2-12-021-011 [P1] GAP facet F06
- Files: src/modules/courses/assignment-file-validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:345-351 asset file DTO + uploadReceiptId mandatory
- Expected fix: Support multiple upload receipts under one submission in frontend/API with stable asset order
