# Work packet (wave 2): edit src/components/placements/learner-placement-alerts.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md

## G2-13-006-018  [P2] GAP  facet F04  effort S
- Legacy: Update time uses relativeDay(n.createdAt) (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:62-70`)
- vNext now: Personal alerts use learnerAlertSafeDate absolute label (`src/components/placements/learner-placement-alerts.tsx:43-44`)
- Fix: Use matching relative-day words and true timestamp.

## G2-13-006-049  [P2] GAP  facet F13  effort S
- Legacy: Updates zero shows No updates yet. When a round is booked, an offer comes in... (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:59-61`)
- vNext now: New says No personal placement alerts have been delivered to you yet (`src/components/placements/learner-placement-alerts.tsx:26-30`)
- Fix: Restore legacy user-facing zero-state wording.

## G2-13-006-063  [P2] GAP  facet F18  effort S
- Legacy: Old empty personal text mentions rounds, offer, application status (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:59-60`)
- vNext now: New says no personal placement alerts delivered (`src/components/placements/learner-placement-alerts.tsx:26-30`)
- Fix: Use exact old instructional copy.
