# Work packet (wave 2): edit src/modules/courses/learner-live-link-availability-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-071  [P2] GAP  facet F23  effort M
- Legacy: Old Live status may show `Scheduled` with no start when link available (`syllabus/liveclass.js:114-121,185-214`).
- vNext now: New scheduled release note/generic warning and server availability gating (`learner-course-workspace.tsx:238-252`; `learner-live-link-availability-model.ts:12-20`).
- Fix: Preserve legacy scheduled-but-joinable semantics where link published, including missing start time.
