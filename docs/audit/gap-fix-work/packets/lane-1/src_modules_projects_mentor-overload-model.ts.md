# Work packet: edit src/modules/projects/mentor-overload-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-7-021-018  [P1] GAP  facet F04  effort S
- Legacy: reassign-mentor.js:155-163 threshold max(avg*1.5, avg+3), >= threshold
- vNext now: mentor-overload-model.ts:3-10 threshold activeCount > avg*1.5
- Fix: Match floor threshold plus >= comparison on boundary

## G2-7-021-056  [P1] GAP  facet F12  effort S
- Legacy: reassign-mentor.js:158-163 overload threshold max(1.5x average, average+3), >=
- vNext now: mentor-overload-model.ts:7-10 >1.5x only
- Fix: Match floor and threshold boundary exactly
