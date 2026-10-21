# Work packet: NEW / MISSING items from docs/audit/gap2/lane-14/l18-u018-lesson.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l18-u018-lesson.md

## G2-18-018-035  [P1] GAP  facet F12  effort S
- Legacy: No negative sequence; legacy `sequence=0` on update means leave unchanged, on create append (`LessonServiceImpl.java:133-142,327-350`).
- vNext now: vNext `.min(0).max(10000)` create & update and `sequence=0` writes zero (`validation.ts:258-282`).
- Fix: Preserve zero sentinel legacy behavior or explicitly migrate UI semantics and errors.
