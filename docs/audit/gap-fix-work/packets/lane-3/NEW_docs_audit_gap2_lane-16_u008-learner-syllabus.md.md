# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u008-learner-syllabus.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u008-learner-syllabus.md

## G2-16-008-027  [P1] GAP  facet F07  effort M
- Legacy: `syllabus.js:895-902`: lesson fetch failed Alert `Could not load course lessons` and Retry.
- vNext now: `page.tsx:58-74`: server failure or notFound, only stateWarnings for optional data in workspace.
- Fix: Recover independently failed lesson list with original titled Alert and Retry.

## G2-16-008-028  [P1] GAP  facet F07  effort S
- Legacy: `syllabus.js:903-908`: learner missing class shows Book icon, `Not assigned to a class` with admin instruction.
- vNext now: `page.tsx:58-80`: missing delivery triggers notFound, no matching readable empty warning.
- Fix: Render class-not-assigned state with guidance for permitted learner.
