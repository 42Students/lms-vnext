# Work packet (wave 2): edit src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u006-learner-course-redirect.md

## G2-16-006-001  [P2] GAP  facet F01  effort S
- Legacy: `index.js:7-21`: client redirects /learn/courses/:courseId to /home once router.isReady.
- vNext now: `src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx:3-10`: server redirect to /home after awaited params.
- Fix: Preserve route target but explicitly choose client-vs-server redirect for visual parity; server redirect changes first-paint transition.
