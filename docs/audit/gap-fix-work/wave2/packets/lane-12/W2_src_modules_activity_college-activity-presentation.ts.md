# Work packet (wave 2): edit src/modules/activity/college-activity-presentation.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-015  [P2] GAP  facet F04  effort M
- Legacy: Actor falls back to System/Student #id/Staff #id (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:164-177`)
- vNext now: Staff #last six UUID digits when displayName/email absent (`src/modules/activity/college-activity-presentation.ts:2-7`)
- Fix: Preserve role-based actor label or document UUID-safe fallback.

## G2-9-001-016  [P2] GAP  facet F04  effort M
- Legacy: Grammar-based action verb/thing with special cases (`docs/legacy-source/frontend/src/components/admin/activity/activityText.js:1-64`)
- vNext now: Humanizes last dotted event key segments only (`src/modules/activity/college-activity-presentation.ts:13-17`)
- Fix: Port action special-case dictionary for legacy event types.

## G2-9-001-017  [P2] GAP  facet F04  effort M
- Legacy: Human target name from payload fields or resolved lookup (`docs/legacy-source/frontend/src/components/admin/activity/activityText.js:67-87`)
- vNext now: Subject label, else subject type + short ID (`src/modules/activity/college-activity-presentation.ts:8-12`)
- Fix: Resolve payload and batched target-name fallback.

## G2-9-001-044  [P2] GAP  facet F12  effort M
- Legacy: Verb taxonomy includes CREATE/DELETE/PROMOTE/RESTORE and exception sentences (`docs/legacy-source/frontend/src/components/admin/activity/activityText.js:10-64`)
- vNext now: Dotted type suffix presentation (`src/modules/activity/college-activity-presentation.ts:13-17`)
- Fix: Port human-readable action resolver.
