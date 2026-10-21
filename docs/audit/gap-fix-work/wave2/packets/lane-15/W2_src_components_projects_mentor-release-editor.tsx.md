# Work packet (wave 2): edit src/components/projects/mentor-release-editor.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md

## G2-17-017-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:54-77 — Release loading, error and no-releases alerts before Sprint form.
- vNext now: src/components/projects/mentor-release-editor.tsx:68-94 — Inline editor error, no separate release-list states.
- Fix: Retain exact loading/error/empty release list states.

## G2-17-017-008  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:44-45 — Notes TEXT field.
- vNext now: src/components/projects/mentor-release-editor.tsx:77-79 — What ships in this release? maps to description, max4000.
- Fix: Map legacy notes to description without truncating valid old notes.

## G2-17-017-021  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:54-77 — AntD alerts with Retry for release list failure.
- vNext now: src/components/projects/mentor-release-editor.tsx:93-104 — ConfirmDialog for discard/delete; error role alert.
- Fix: Use same warning/confirm copy and placement.

## G2-17-017-033  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:59-69 — Failure alert has Retry and original error detail.
- vNext now: src/components/projects/mentor-release-editor.tsx:93-94 — Generic save error, no list-fetch Retry in editor.
- Fix: Add retry where release list fetch fails.

## G2-17-017-036  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:29-93 — Sprints editor uses alerts/grid; release select rendered in form.
- vNext now: src/components/projects/mentor-release-editor.tsx:68-92 — Stacked inline editor responsive buttons.
- Fix: Compare widths/breakpoints and sticky Save to legacy UI.

## G2-17-017-048  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectReleaseDTO.java:18-27 — DTO exposes rolled-up committed/completed sprint points.
- vNext now: src/components/projects/mentor-release-editor.tsx:10-12 — Editor only shows linkedSprints input count.
- Fix: Show matching points and completed count on release cards.

## G2-17-017-003  [P3] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:29-40 — Sprints editor prominently says Plan work in clear, release-bound increments.
- vNext now: src/components/projects/mentor-release-editor.tsx:68-73 — Compact add/edit release form, no equivalent hero line.
- Fix: Place release controls in legacy Sprints section hierarchy.

## G2-17-017-032  [P3] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:71-77 — No releases: explicit create/seed project release guidance.
- vNext now: src/components/projects/mentor-release-editor.tsx:68-75 — Editor Add release even if zero; no same warning.
- Fix: Restore legacy empty-state copy.

## G2-17-017-038  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:76-77 — `No releases on this project yet` with create guidance.
- vNext now: src/components/projects/mentor-release-editor.tsx:71-73 — `Add release` / `New release`.
- Fix: Match heading/empty-state wording.
