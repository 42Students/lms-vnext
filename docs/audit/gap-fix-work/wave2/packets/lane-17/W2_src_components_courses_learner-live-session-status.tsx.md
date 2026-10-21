# Work packet (wave 2): edit src/components/courses/learner-live-session-status.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-005  [P2] GAP  facet F02  effort M
- Legacy: Old large live session card with left date tile and status/time/provider (`syllabus/liveclass.js:157-183`).
- vNext now: New separate StatusBadge and simple Starts/Ends paragraph (`learner-course-workspace.tsx:223-235`; `learner-live-session-status.tsx:15-25`).
- Fix: Use legacy date tile + status panel, typography, teal border and provider line.

## G2-18-008-041  [P2] GAP  facet F12  effort S
- Legacy: Old ended state checks valid raw end is before now (`syllabus/liveclass.js:110-121`).
- vNext now: New status `Date.now()>=end` every 15–30s (`learner-live-class-link.tsx:16-24`; `learner-live-session-status.tsx:5-25`).
- Fix: Define exact equality boundary (< vs <=) and live refresh behavior.

## G2-18-008-048  [P2] GAP  facet F13  effort M
- Legacy: Old invalid start/end renders Scheduled and omits time row while retaining available link (`syllabus/liveclass.js:39-54,94-121,170-181`).
- vNext now: New invalid pair displays `Time unavailable` if status component mounted (`learner-live-session-status.tsx:5-14`).
- Fix: Show Scheduled when no valid date, guard inaccessible or invalid links.

## G2-18-008-008  [P3] GAP  facet F03  effort S
- Legacy: Old live status `Starts in ...`, `Live now` pulsing dot, `Ended`, `Scheduled` (`syllabus/liveclass.js:114-121,165-169`).
- vNext now: New StatusBadge `Starts in...`, `Live now`, `Ended`, `Scheduled` without live pulse (`learner-live-session-status.tsx:5-25`).
- Fix: Add pulse dot and exact placement; retain status computation.

## G2-18-008-042  [P3] GAP  facet F12  effort S
- Legacy: Old countdown rounds remaining minutes using Math.round and removes zero in no-hours case (`syllabus/liveclass.js:30-37,114-121`).
- vNext now: New uses Math.ceil remaining minutes, always prints `N h M min` when hours>0 (`learner-live-session-status.tsx:5-14`).
- Fix: Match rounding, hours/days and string formatting.

## G2-18-008-043  [P3] GAP  facet F12  effort S
- Legacy: Old countdown ≥24h converts to `N day`/`N days` (`syllabus/liveclass.js:33-37`).
- vNext now: New ≥24h prints hours (`learner-live-session-status.tsx:10-14`).
- Fix: Restore day-level countdown at ≥24h.

## G2-18-008-057  [P3] GAP  facet F17  effort S
- Legacy: Old Live status pulse decorative aria-hidden, date tile aria-hidden (`syllabus/liveclass.js:157-168`).
- vNext now: New status paragraph role=status text, no decorative date tile (`learner-live-session-status.tsx:15-25`).
- Fix: Restore decorative-only aria-hidden and readable status live region.
