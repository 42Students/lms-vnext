# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-006  [P1] MISSING  facet F03  effort L
- Legacy: `audit-findings.js:110-117`: 22px title and SyncOutlined spinner inside `Sync now` button.
- vNext now: `page.tsx:32-33,114-124`: title plus import status; no runnable Sync button.
- Fix: Provide credential-gated POST sync action with spinner/disabled state and reload, or explicitly document why disabled.
