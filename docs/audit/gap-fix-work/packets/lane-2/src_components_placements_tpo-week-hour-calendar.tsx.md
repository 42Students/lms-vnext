# Work packet: edit src/components/placements/tpo-week-hour-calendar.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-051  [P1] GAP  facet F09  effort M
- Legacy: Legacy empty week-grid click opens New follow-up at clicked time (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:333-341`)
- vNext now: vNext uses time slot editor but gated by DB09 readiness (`src/components/placements/tpo-week-hour-calendar.tsx:61-75`)
- Fix: Ensure verified TPO can create by clicking a slot and preserve time

## G2-5-012-042  [P2] GAP  facet F07  effort S
- Legacy: Legacy future time error Pick a future date and time (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:146-149`)
- vNext now: vNext week dialog says Follow-up must be in the future; New dialog lacks future validation (`src/components/placements/tpo-week-hour-calendar.tsx:103-107`)
- Fix: Unify errors and enforce future time across all entry points
