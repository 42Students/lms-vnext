# Work packet (wave 2): edit src/components/tracker/tracker-issue-copy-actions.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-008  [P2] GAP  facet F03  effort S
- Legacy: `[issueId].js:143-160`: two small icon buttons with CopyOutlined and FileMarkdownOutlined, hover title and aria labels.
- vNext now: `tracker-issue-copy-actions.tsx:11-16`: two full text buttons hidden in `Issue sharing` disclosure.
- Fix: Place copy link and markdown icon buttons next to ID with same tooltip labels.

## G2-16-003-069  [P2] GAP  facet F18  effort M
- Legacy: `trackerMarkdown.js:18-53`: markdown sections `What went wrong`, `Context`, `Engineering` and detailed labels.
- vNext now: `tracker-issue-copy-actions.tsx:13-15`: only a short `# <ID>`, page and description.
- Fix: Build full markdown template including context, dates, links and commits.

## G2-16-003-058  [P3] GAP  facet F15  effort S
- Legacy: `[issueId].js:94-125`; `EngineeringDetails.jsx:68-70`: in-app Ant messages on copy/status/save/retest.
- vNext now: `tracker-workflow-panel.tsx:62-83`; `tracker-issue-copy-actions.tsx:6-16`: toasts for workflow; inline notice for copy.
- Fix: Use toast feedback consistently for copy and field edits with exact strings.

## G2-16-003-061  [P3] GAP  facet F17  effort S
- Legacy: `[issueId].js:149-160`: copy icon buttons have aria-label and title tooltips.
- vNext now: `tracker-issue-copy-actions.tsx:11-16`: text buttons in labelled Issue sharing region.
- Fix: Restore tooltip and aria-label when using compact icon buttons.
