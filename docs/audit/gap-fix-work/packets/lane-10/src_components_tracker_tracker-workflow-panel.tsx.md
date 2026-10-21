# Work packet: edit src/components/tracker/tracker-workflow-panel.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-010  [P1] GAP  facet F03  effort M
- Legacy: `[issueId].js:172-187`: right-side editable status Select for managers, read-only pill for others.
- vNext now: `tracker-workflow-panel.tsx:94-100`: always admin-only status selector inside engineering workflow and Save workflow action.
- Fix: Restore immediate status-select mutation and read-only status pill depending on manager scope.

## G2-16-003-023  [P1] GAP  facet F06  effort M
- Legacy: `[issueId].js:115-127`: status dropdown change instantly POST/PATCH status, disables while saving.
- vNext now: `tracker-workflow-panel.tsx:50-69,94-100`: local status changes wait for Save workflow with all fields.
- Fix: Commit status selection immediately using dedicated action with toast; keep CAS and prevent stale writes.

## G2-16-003-031  [P2] GAP  facet F07  effort S
- Legacy: `EngineeringDetails.jsx:123-140`: root/fix 4000 max, SHA 64 max; link appears for >=7 typed chars.
- vNext now: `tracker-workflow-panel.tsx:124-142`: same max but SHA links only 7-40 hex and no field-level max errors.
- Fix: Keep length validation and either match 7-char visibility or show invalid hash helper before link.

## G2-16-003-034  [P2] GAP  facet F08  effort S
- Legacy: `[issueId].js:119-125`: immediate status toast `<ID> moved to <status>` and failure message.
- vNext now: `tracker-workflow-panel.tsx:62-67`: save generic `Engineering details saved` or stale-version error.
- Fix: Emit status-specific toast for changed status; keep conflict reason.

## G2-16-003-028  [P3] GAP  facet F07  effort S
- Legacy: `RetestCard.jsx:19-22`: failure `Retest result could not be saved.` (fallback) via toast.
- vNext now: `tracker-workflow-panel.tsx:81-84`: `Retest could not be recorded` error toast, exception details.
- Fix: Restore exact legacy fallback and keep conflict-specific safe messages.

## G2-16-003-029  [P3] GAP  facet F07  effort S
- Legacy: `EngineeringDetails.jsx:68-70`: failure `Engineering details could not be saved.`.
- vNext now: `tracker-workflow-panel.tsx:64-67`: fallback `Tracker update failed`.
- Fix: Use exact legacy error copy for engineering writes.
