# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md

## G2-7-013-004  [P1] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:20-31: `Resource library` Card, eyebrow, headline, long help paragraph
- vNext now: V/components/projects/project-workspace.tsx:1432-1463: Resources heading, create control, filterable directory, files panel
- Fix: Rebuild card heading/intro while preserving directory extras

## G2-7-013-006  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:42-61: inline repeating form, Save resource library footer
- vNext now: V/components/projects/project-workspace.tsx:1444-1463: Add resource Dialog and per-row actions, no single Save
- Fix: Provide bulk edit + one scoped Save or fully equivalent multi-edit flow

## G2-7-013-014  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168: editable key,type,title,url,accessNotes,description,isPinned,isRequired
- vNext now: V/components/projects/project-resource-controls.tsx:67-174: title,url,description,resourceType,status,pinned,accessNotes,sprintId,taskId,visibility,required
- Fix: Map isPinned -> pinned and isRequired -> required; preserve stable key on migration

## G2-7-013-015  [P1] GAP  facet F04  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:147-159: types Link,PDF,DOC,PPT,Video,File (stored Link/PDF/DOC/PPT/Video/File)
- vNext now: V/components/projects/project-resource-controls.tsx:115-120: FILE/LINK/DOCUMENT/CODE/NOTE/ENVIRONMENT
- Fix: Define exact type enum conversion especially PDF/PPT/VIDEO/DOC; do not silently collapse

## G2-7-013-016  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144: optional key preview from title, saved stable generated key
- vNext now: V/db/schema/projects.ts:558-574: UUID id, nullable templateKey, no visible key input
- Fix: Preserve legacy resource key identity and link references during migration

## G2-7-013-019  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:62-95,113-139: add/remove/undo/move rows unsaved, stable original order
- vNext now: V/components/projects/project-resource-list.tsx:37-73,164-179: immediate persisted reorder; archive replaces removal
- Fix: Restore unsaved batch/Undo semantics or deliberate separate CRUD design

## G2-7-013-023  [P1] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168: Title required; URL optional and type may be file/PDF/video without URL
- vNext now: V/components/projects/project-resource-controls.tsx:218-225: title required plus either URL or description
- Fix: Verify legacy empty URL+description resource can be saved; align or document restriction

## G2-7-013-029  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:28-37: whole form dirty unload/tab guard
- vNext now: V/components/projects/project-resource-controls.tsx:200-212,360-384: beforeunload and modal discard, tab switch not caught
- Fix: Guard route/tab navigation and Cancel for any unsaved resource edit

## G2-7-013-030  [P1] GAP  facet F07  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276: max500 rows exact error, missing title `Item N: Title required`
- vNext now: V/modules/projects/resource-service.ts:431-460: reorder capped250; validation.ts:696-727 uses field max and URL rules; no batch 500 editor
- Fix: Expose equivalent row limit/errors with new per-row semantics

## G2-7-013-037  [P1] GAP  facet F09  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:105-107: Undo remove inline hyperlink immediately
- vNext now: V/components/projects/project-resource-controls.tsx:445-469: Archive irreversible from current list UI
- Fix: Add reversible removal path and confirm persistence semantics

## G2-7-013-042  [P1] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:55-57: resourcesToken stale snapshot used for whole section CAS
- vNext now: V/modules/projects/resource-service.ts:253-258 and 399-401: per-resource expectedUpdatedAt CAS
- Fix: Specify conflict handling for concurrent add/remove/reorder vs legacy section snapshot

## G2-7-013-047  [P1] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168: field `isPinned` and `isRequired` booleans
- vNext now: V/db/schema/projects.ts:574-590: `pinned` and `required` booleans
- Fix: Explicitly convert old keys in imports and seeded DTOs

## G2-7-013-048  [P1] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144, resource.js:50-57: generated stable slug key unique among siblings
- vNext now: V/db/schema/projects.ts:558-635: UUID key and unique project/template_key, no per-edit visible key
- Fix: Preserve stable identifiers and detect duplicate legacy keys

## G2-7-013-064  [P1] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61: keyboard route Back guarded for changed form
- vNext now: V/components/projects/project-resource-controls.tsx:200-212: beforeunload only, not internal navigation
- Fix: Guard keyboard/browser/tab navigation on dirty dialogs

## G2-7-013-070  [P1] GAP  facet F19  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276: bulk section 500 cap
- vNext now: V/modules/projects/resource-service.ts:435-460: reorder max250; create list no same cap
- Fix: Clarify supported large workspaces and prevent editor dead end

## G2-7-013-072  [P1] GAP  facet F20  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:70-85: remove + Undo local, independent of network failures
- vNext now: V/components/projects/project-resource-controls.tsx:403-453: archive API immediate, no undo
- Fix: Make archive reversible or require deliberate decision about removal

## G2-7-013-076  [P1] GAP  facet F22  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:144-168 and LBE/dto/projects/ProjectWorkspaceUpdateDTO.java:21,34: resources JSON section+token
- vNext now: V/db/schema/projects.ts:558-635: normalized project_resources row UUID, sequence, template_key and metadata
- Fix: Specify field-by-field JSON-to-table migration preserving order and stable keys

## G2-7-013-077  [P1] GAP  facet F22  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:147-167: type Link/PDF/DOC/PPT/Video/File; flags isRequired/isPinned
- vNext now: V/db/schema/projects.ts:574-625: resourceType enum FILE/LINK/DOCUMENT/CODE/NOTE/ENVIRONMENT, required/pinned columns
- Fix: Create enum+flag conversion and lossless legacy media type metadata

## G2-7-013-080  [P1] GAP  facet F23  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:70-85: reversible unsaved remove; every edited item saved together
- vNext now: V/components/projects/project-resource-controls.tsx:329-578: per-row Edit and Archive, no one-shot save/undo
- Fix: Restore atomic multi-edit user journey or mark owner-approved reduction

## G2-7-013-031  [P2] GAP  facet F07  effort S
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:229-236: required field inline `Title is required`
- vNext now: V/components/projects/project-resource-controls.tsx:74-82: native required input with generic form browser validation
- Fix: Provide matching inline per-resource error
