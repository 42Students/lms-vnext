# Work packet (wave 2): edit src/components/placements/tpo-drive-lifecycle-controls.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-11-010-037  [P2] GAP  facet F06  effort M
- Legacy: Publish OK disabled if checklist blocking rows exist. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:503`
- vNext now: vNext publish trigger disabled when readiness denies; confirm also needs reason+checkbox. `src/components/placements/tpo-drive-lifecycle-controls.tsx:102`
- Fix: Show checklist blockers and disabled confirmation equivalent.

## G2-11-010-049  [P2] GAP  facet F09  effort M
- Legacy: Publish AsyncModal lists blockers, warnings and eligible/excluded counts. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:501`
- vNext now: Inline publish pane with reason+checkbox+delivery radios. `src/components/placements/tpo-drive-lifecycle-controls.tsx:114`
- Fix: Present publish checklist in modal equivalent with counts/warnings.

## G2-11-010-056  [P2] GAP  facet F10  effort M
- Legacy: Legacy lifecycle mutates via publish/close/cancel/extend APIs. `docs/legacy-source/frontend/src/api/Services/TpoService.js:23`
- vNext now: vNext lifecycle POST /api/placements/jobs/{id}/tpo-lifecycle with status token/reason. `src/components/placements/tpo-drive-lifecycle-controls.tsx:43`
- Fix: Maintain same state transitions and reporting with new guarded API.

## G2-11-010-075  [P2] MISSING  facet F14  effort S
- Legacy: Copy announcement to navigator.clipboard with Announcement copied toast. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:522`
- vNext now: New publish panel has app-only notice, no Copy announcement action. `src/components/placements/tpo-drive-lifecycle-controls.tsx:127`
- Fix: Add announcement copy action and success toast.

## G2-11-010-085  [P2] MISSING  facet F17  effort S
- Legacy: ReasonPicker has placeholder Tell them why. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:498`
- vNext now: Publish reason textarea required; decline reason picker missing. `src/components/placements/tpo-drive-lifecycle-controls.tsx:116`
- Fix: Label and keyboard-enable decline reason field.

## G2-11-010-098  [P2] GAP  facet F21  effort S
- Legacy: Announcement clipboard copy success; no automatic send. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:522`
- vNext now: App notification send on publish, no copy action. `src/components/placements/tpo-drive-lifecycle-controls.tsx:128`
- Fix: Preserve manual announcement copy as optional after publish.

## G2-3-023-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/components/placements/tpo-drive-lifecycle-controls.tsx:77-154`
- Fix: Legacy immediate publish with optional email differs from required reason+acknowledgement+preflight; match visual treatment without losing safety.

## G2-3-023-018  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:161-173`
- vNext now: `src/components/placements/tpo-drive-lifecycle-controls.tsx:85-162`
- Fix: Legacy cancel/close distinct actions; VNext close preview and lifecycle controls must expose both without ambiguous labels.

## G2-3-023-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:185-193`
- vNext now: `src/components/placements/tpo-drive-lifecycle-controls.tsx:111-168`
- Fix: VNext preflight/InlineNotice replaces legacy generic 409; preserve actionable reason and retry.

## G2-3-023-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:88-95`, `703-714`
- vNext now: `src/components/placements/tpo-drive-lifecycle-controls.tsx:111-168`
- Fix: Legacy deletion/deadline conflict explains next action; ensure typed VNext errors map to literal explanatory copy.
