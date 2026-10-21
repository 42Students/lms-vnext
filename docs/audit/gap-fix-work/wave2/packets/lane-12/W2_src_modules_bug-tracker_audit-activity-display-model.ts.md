# Work packet (wave 2): edit src/modules/bug-tracker/audit-activity-display-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-048  [P2] GAP  facet F12  effort M
- Legacy: `ActivityTimeline.jsx:5-19`: four event text mappings for status/retest/resolution and generic fallback.
- vNext now: `issues/[publicId]/page.tsx:147-150`; `audit-activity-display-model.ts`: separates activity type and transition.
- Fix: Mirror exact humanized event sentences and fallback; retain actor/date.
