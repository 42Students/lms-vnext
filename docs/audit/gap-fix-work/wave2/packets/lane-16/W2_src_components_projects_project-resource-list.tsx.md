# Work packet (wave 2): edit src/components/projects/project-resource-list.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md

## G2-16-028-004  [P2] GAP  facet F02  effort S
- Legacy: WorkspaceResourcesEditor.jsx:21-39 orders Project references eyebrow, headline, help copy, then four metrics.
- vNext now: project-resource-list.tsx:93-100 renders metrics before filtering; project-workspace.tsx:1432-1452 puts Resource heading before list.
- Fix: Restore old headline, explanatory text and metrics position exactly for SA resource tab.

## G2-16-028-006  [P2] GAP  facet F03  effort S
- Legacy: WorkspaceResourcesEditor.jsx:13-18 counts Resources, Links, Files & media, With access notes.
- vNext now: project-resource-list.tsx:93-100 counts Total, Showing, Links, Files, Other, Drafts, Archived, Pinned.
- Fix: Restore four exact legacy labels/count tiles in Super Admin view; show extra counts separately only if intended.

## G2-16-028-007  [P2] GAP  facet F03  effort M
- Legacy: RepeatingItemEditor.jsx:111-146 has row expand/collapse, Move up/down icon actions, Delete icon, Undo remove after removal.
- vNext now: project-resource-list.tsx:163-221 shows inline Move up/down and edit/archive actions, no undo for just-deleted draft row.
- Fix: Add unsaved row deletion/undo and compact per-row expand/collapse while whole form editing.

## G2-16-028-009  [P2] GAP  facet F04  effort S
- Legacy: WorkspaceResourcesEditor.jsx:8-18 treats every non-LINK row as `Files & media` and rows with trimmed accessNotes as With access notes.
- vNext now: project-resource-list.tsx:84-99 only resourceType FILE counts Files, and no With access notes metric.
- Fix: Compute legacy category buckets (`rows.length - links`, nonblank accessNotes) and display accurate counts.

## G2-16-028-011  [P2] MISSING  facet F04  effort M
- Legacy: ProjectResource.java:24-29 resourceKey and resourceOrder are first-class persistence values.
- vNext now: projects.ts:558-626 uses templateKey and sequence; project-resource-list.tsx:163-221 does not show key editor.
- Fix: Expose stable resource key and map legacy resource_order to sequence, preserving imported keys.

## G2-16-028-012  [P2] GAP  facet F05  effort M
- Legacy: RepeatingItemEditor.jsx:46-51,98-102 only displays search after >12 rows and searches title or JSON content.
- vNext now: project-resource-list.tsx:26-35,103-106 always shows search and filters only title+description.
- Fix: Match search threshold and include key/type/URL/access notes in searchable text.

## G2-16-028-014  [P2] GAP  facet F05  effort M
- Legacy: RepeatingItemEditor.jsx:98-114 lists all 0-500 resources, collapses by default only above 12; no pagination.
- vNext now: project-resource-list.tsx:38-41,163-221 allows reorder only when <=250 active and unfiltered; no pagination.
- Fix: Define 251-500 behavior without losing move ordering, and mirror collapse threshold.

## G2-16-028-039  [P2] GAP  facet F16  effort M
- Legacy: RepeatingItemEditor.jsx:157-174 uses xs24, md12 for half fields and full-width mobile rows.
- vNext now: project-resource-controls.tsx:73-173 forms are a single column; project-resource-list.tsx:93-101 two columns mobile and four sm.
- Fix: Apply old 375px/768px breakpoints for resource editor field pairing and metrics.

## G2-16-028-041  [P2] GAP  facet F17  effort M
- Legacy: RepeatingItemEditor.jsx:115-145 row toggles aria-expanded and move/delete explicit aria-label; undo removal role=status.
- vNext now: project-resource-list.tsx:163-221 drag/drop and button move controls, no unsaved undo live region.
- Fix: Add keyboard-supported unsaved move and undo announcements/controls.

## G2-16-028-044  [P2] GAP  facet F19  effort L
- Legacy: RepeatingItemEditor.jsx:98-117 collapses rows >12 and hides search for <=12; 500-section validation at 260-274.
- vNext now: project-resource-list.tsx:38-41 limits reorder to <=250 active and renders all rows.
- Fix: Add collapsed rows/virtual paging for >12 and an explicit action on >250 resources.

## G2-16-028-035  [P3] GAP  facet F13  effort S
- Legacy: RepeatingItemEditor.jsx:108-110 empty copy `No resources yet. Add only the references the team will actually use.`
- vNext now: project-resource-list.tsx:158-162 empty title `No resources yet` + different description.
- Fix: Use exact legacy empty message in SA resources editor.

## G2-16-028-040  [P3] GAP  facet F17  effort S
- Legacy: WorkspaceResourcesEditor.jsx:33-38 gives metric area aria-label `Resource library summary`; RepeatingItemEditor.jsx:98-107 has labeled search/live status.
- vNext now: project-resource-list.tsx:93-105 uses `Resource counts` and `Search resources` aria labels.
- Fix: Keep exact summary/search accessible labels in superadmin workspace.

## G2-16-028-043  [P3] GAP  facet F18  effort S
- Legacy: WorkspaceResourcesEditor.jsx:24-31 `Project references`, `Keep everything the team needs in one curated place` and exact helper sentence.
- vNext now: project-resource-list.tsx:93-105 starts directory labels instead.
- Fix: Copy exact legacy eyebrow/headline/help text; retain curated-library intent.
