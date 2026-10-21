# Work packet (wave 2): edit src/components/courses/learner-course-workspace.tsx (part 3 of 3)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-18-008-060  [P3] GAP  facet F18  effort S
- Legacy: Old `Attended this session?` hint always before complete control (`syllabus/liveclass.js:221-225`).
- vNext now: New hint exists inside ConfirmDialog only, footer just Mark as complete (`resource-progress-control.tsx:71-87`; `learner-course-workspace.tsx:330-339`).
- Fix: Show inline question alongside action, not solely dialog title.
