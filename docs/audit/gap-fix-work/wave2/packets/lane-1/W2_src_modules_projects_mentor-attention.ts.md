# Work packet (wave 2): edit src/modules/projects/mentor-attention.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u026-mentor-notifications.md, docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-026-003  [P2] GAP  facet F01  effort S
- Legacy: notifications.js:305-308 stalled row links /mentor/projects/{id}?tab=activity
- vNext now: mentor-attention.ts:55-58 uses ?tab=audit
- Fix: Map legacy Activity to vNext Audit and verify target tab

## G2-7-026-018  [P2] GAP  facet F04  effort M
- Legacy: notifications.js:294-296 review title includes project name, description Submitted by learner if present
- vNext now: mentor-attention.ts:39-43 same title but generic description only
- Fix: Include available submittedByName in review text

## G2-7-026-020  [P2] GAP  facet F04  effort M
- Legacy: notifications.js:331-337 meeting title actual meeting — project and formatted ddd, MMM D at startTime/TBD
- vNext now: mentor-attention.ts:73-76 generic Upcoming project meeting with project:title description
- Fix: Render meeting-specific title and time formatting

## G2-7-026-054  [P2] GAP  facet F12  effort M
- Legacy: notifications.js:42-65 exclude blocked/completed/done/archived from stalled, fall back to project update when no activity
- vNext now: mentor-attention.ts:45-58 only PLANNED/ACTIVE, last activity or project updated
- Fix: Crosswalk BLOCKED/READY/IN_PROGRESS statuses before stall classification

## G2-7-026-056  [P2] GAP  facet F12  effort S
- Legacy: notifications.js:329-337 upcoming meeting is strictly future and <=48 hours
- vNext now: mentor-attention.ts:68-76 uses delta>=0 so exactly now qualifies
- Fix: Make window strictly >0 and <=48h

## G2-7-026-073  [P2] GAP  facet F18  effort M
- Legacy: notifications.js:293-296 Review description Submitted by NAME when present
- vNext now: mentor-attention.ts:39-43 always generic teammate message
- Fix: Show submitter attribution when available

## G2-7-026-074  [P2] GAP  facet F18  effort S
- Legacy: notifications.js:333-337 Upcoming meeting title/desc include meeting and formatted time
- vNext now: mentor-attention.ts:73-76 generic title/description
- Fix: Use exact meeting wording and visible schedule

## G2-7-026-082  [P2] GAP  facet F20  effort S
- Legacy: notifications.js:329-331 strict future upcoming threshold > now
- vNext now: mentor-attention.ts:68-70 inclusive delta>=0
- Fix: Exclude exactly-now stale meeting boundary

## G2-7-028-088  [P2] GAP  facet F20  effort S
- Legacy: ProjectsContent.jsx:88-90 missing activity signal not stalled
- vNext now: mentor-attention.ts:45-51 falls back projectUpdatedAt and may flag
- Fix: Avoid false stale alarm when only migration timestamp exists
