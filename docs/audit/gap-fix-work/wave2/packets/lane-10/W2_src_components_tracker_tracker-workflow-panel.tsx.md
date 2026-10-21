# Work packet (wave 2): edit src/components/tracker/tracker-workflow-panel.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-026  [P2] GAP  facet F06  effort M
- Legacy: `EngineeringDetails.jsx:39-73,109-162`: disclosure sets values from issue and independently saves engineering fields.
- vNext now: `tracker-workflow-panel.tsx:35-69`: fields initialized once in client state, all workflow/status submitted together.
- Fix: Split status action from Engineering details save; resync field values on updated issue version.

## G2-16-003-037  [P2] GAP  facet F09  effort M
- Legacy: `EngineeringDetails.jsx:76-86`: collapsed `Engineering details` summary and explanatory microcopy.
- vNext now: `tracker-workflow-panel.tsx:89-95,121-145`: whole workflow expanded, only `Engineering evidence` collapsed.
- Fix: Collapse whole engineering panel and restore summary microcopy and chevron.

## G2-16-003-040  [P2] GAP  facet F10  effort M
- Legacy: `BugTrackerService.js:72-78`; `SuperAdminBugTrackerController.java` via service: PATCH immediate status.
- vNext now: `tracker-workflow-panel.tsx:50-69`: one PATCH workflow includes status and other fields.
- Fix: Support direct status mutation UI and preserve workflow audit events.

## G2-16-003-066  [P2] GAP  facet F18  effort S
- Legacy: `EngineeringDetails.jsx:80-82`: `Engineering details` + helper `Root cause, fix commits, regression coverage and production verification`.
- vNext now: `tracker-workflow-panel.tsx:90-92,121-123`: `Engineering workflow` and `Super Admin only...`, nested `Engineering evidence`.
- Fix: Match heading/helper text and details label.

## G2-16-003-084  [P2] GAP  facet F23  effort M
- Legacy: `[issueId].js:115-127`: quick one-field status save; engineering edit separate.
- vNext now: `tracker-workflow-panel.tsx:50-69`: combined Save workflow action; version check extra.
- Fix: Restore independent status action while keeping CAS.

## G2-16-003-011  [P3] GAP  facet F03  effort S
- Legacy: `RetestCard.jsx:43-59`: `Still broken` red button before `Works now` primary.
- vNext now: `tracker-workflow-panel.tsx:161-164`: Works now button before Still broken.
- Fix: Swap button order to legacy sequence.

## G2-16-003-012  [P3] GAP  facet F03  effort S
- Legacy: `EngineeringDetails.jsx:159-161`: `Save details` button inside engineering disclosure.
- vNext now: `tracker-workflow-panel.tsx:151-153`: `Save workflow` button outside evidence disclosure.
- Fix: Match `Save details` text and placement.

## G2-16-003-027  [P3] GAP  facet F06  effort S
- Legacy: `EngineeringDetails.jsx:113,118,148`: enums searchable Ant selects with clear option on affected layer/resolution.
- vNext now: `tracker-workflow-panel.tsx:95-119`: native select fields with Not set/No resolution, no searchable behaviour.
- Fix: Match clearable input interaction and placeholders.

## G2-16-003-058  [P3] GAP  facet F15  effort S
- Legacy: `[issueId].js:94-125`; `EngineeringDetails.jsx:68-70`: in-app Ant messages on copy/status/save/retest.
- vNext now: `tracker-workflow-panel.tsx:62-83`; `tracker-issue-copy-actions.tsx:6-16`: toasts for workflow; inline notice for copy.
- Fix: Use toast feedback consistently for copy and field edits with exact strings.

## G2-16-003-067  [P3] GAP  facet F18  effort S
- Legacy: `RetestCard.jsx:30-40`: title `Does it work now?`, placeholder `Optional note — what did you observe?`.
- vNext now: `tracker-workflow-panel.tsx:157-160`: same title but placeholder `Optional retest note`.
- Fix: Change retest note placeholder to exact legacy.
