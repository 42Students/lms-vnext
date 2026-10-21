# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-17/learner-project-detail.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md

## G2-17-004-021  [P2] GAP  facet F10  effort 
- Legacy: src/app/(authenticated)/learn/projects/[projectId]/page.tsx:94-114 resolves goals and activity separately by tab, :115-134 filters Board, :136-203 renders.
- vNext now: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 remount only on account/project, preserving client-side data as tabs change.
- Fix: Check per-tab loading and refresh state behavior for server navigation vs retained client workspace.

## G2-17-004-038  [P2] GAP  facet F20  effort 
- Legacy: src/app/(authenticated)/learn/projects/[projectId]/page.tsx:43-54 canonicalizes legacy meetings/performance/tasks aliases, not preserving original query key as section value.
- vNext now: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 passes router.query.tab changes to child and leaves component key stable.
- Fix: Verify legacy tab alias permalink behavior and avoid unexpected tab header changes.
