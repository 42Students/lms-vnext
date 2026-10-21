# Work packet (wave 2): edit src/app/(authenticated)/tpo/placements/new/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-new.md

## G2-11-013-002  [P2] GAP  facet F01  effort M
- Legacy: New drive opens shared DriveFormPage used for edit. `docs/legacy-source/frontend/src/pages/tpo/drives/new.js:9`
- vNext now: New route renders PlacementJobCreateWorkspace with alternate entrypoints. `src/app/(authenticated)/tpo/placements/new/page.tsx:22`
- Fix: Preserve same full-form content and legacy create flow.

## G2-11-013-024  [P2] GAP  facet F05  effort M
- Legacy: RecordedOutside checkbox hides ordinary application flow. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:608`
- vNext now: Recorded outside moved to separate entry route. `src/app/(authenticated)/tpo/placements/new/page.tsx:27`
- Fix: Preserve toggle/suppression or equivalent explicit route.
