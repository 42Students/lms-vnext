# Work packet (wave 2): edit src/components/placements/learner-schedule-reschedule.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md

## G2-19-004-009  [P2] GAP  facet F03  effort S
- Legacy: Old card actions `Join link`, `Open test`, `Can't make it?` buttons `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-104`
- vNext now: vNext `Join online round`, `Open test`, long `Can't make it? Ask to reschedule` disclosure `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:74-77` `src/components/placements/learner-schedule-reschedule.tsx:32-38`
- Fix: Match action copy and grouping, preserve secure new links.

## G2-19-004-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy preferred-times input max200, example Any time after 2 PM on 16 Oct `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:116-117`
- vNext now: vNext datetime-local field, no free-text preferred-times input `src/components/placements/learner-schedule-reschedule.tsx:42-44`
- Fix: Provide optional free text max200 in addition to structured request.

## G2-19-004-028  [P2] GAP  facet F06  effort M
- Legacy: Legacy reschedule `Can't make it?` opens modal and submit `Send to the placement cell` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:103-119`
- vNext now: vNext expands inline form with button `Send request` `src/components/placements/learner-schedule-reschedule.tsx:32-61`
- Fix: Restore modal/dialog semantics, focus trap and exact submit text.

## G2-19-004-037  [P2] GAP  facet F09  effort M
- Legacy: Legacy ask-reschedule AntD Modal with disabled mask/close when busy `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-119`
- vNext now: vNext inline bordered disclosure controlled by open state `src/components/placements/learner-schedule-reschedule.tsx:32-61`
- Fix: Use modal with correct focus management and busy close restrictions.

## G2-19-004-067  [P2] GAP  facet F17  effort M
- Legacy: Legacy reschedule Modal owns input focus and confirmation busy `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-119`
- vNext now: vNext inline disclosure expansion, no modal focus trap required, but diverges screenreader flow `src/components/placements/learner-schedule-reschedule.tsx:32-61`
- Fix: Match modal role, focus return, busy state and escape/backdrop behavior.

## G2-19-004-071  [P2] GAP  facet F18  effort S
- Legacy: Legacy modal labels `Why can't you make it?`, `Times that work for you (optional)` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:109-118`
- vNext now: vNext `Reason (3–900 characters)` + `Preferred date and time`, mode/venue `src/components/placements/learner-schedule-reschedule.tsx:37-55`
- Fix: Use legacy question labels for compatible fields; explain structured fields separately.
