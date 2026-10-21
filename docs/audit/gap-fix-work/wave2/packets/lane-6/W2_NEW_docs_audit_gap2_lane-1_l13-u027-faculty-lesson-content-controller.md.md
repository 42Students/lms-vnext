# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-13-027-045  [P2] GAP  facet F23  effort M
- Legacy: src/components/courses/faculty-lesson-authoring.tsx:432-438 — not legacy; vNext publish is separate potential failure
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-282 — legacy creates immediately, content visibility governed by dto active/enabled
- Fix: Document deliberate two-step publish and recovery; don't lose saved draft on failure.
