# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u006-learner-course-redirect.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u006-learner-course-redirect.md

## G2-16-006-002  [P1] GAP  facet F01  effort S
- Legacy: `index.js:13-20`: retains full query suffix, including `?cls=...` and context.
- vNext now: `[deliveryId]/page.tsx:8-9`: redirect URL has no query suffix.
- Fix: Accept searchParams, retain allowlisted query context (including cls), append serialized parameters to redirect URL.

## G2-16-006-012  [P1] GAP  facet F05  effort S
- Legacy: `index.js:13-20`: redirects to /home even if cls query provided; no query parsing or sorting.
- vNext now: `[deliveryId]/page.tsx:8-9`: same destination but cls lost.
- Fix: Preserve cls; leave home tab to validate class scope.

## G2-16-006-021  [P1] GAP  facet F10  effort L
- Legacy: `[...courseTab].js:60-76`: target resolves course by slug/numeric ID and may canonicalize to slug.
- vNext now: `[...courseTab]/page.tsx:58-74`: target uses deliveryId keyed learner workspace, no slug canonicalization.
- Fix: Provide documented legacy courseId/slug-to-deliveryId resolution or redirect compatibility map so older links work.

## G2-16-006-034  [P1] GAP  facet F18  effort S
- Legacy: `index.js:13-16`: documentation specifically identifies `?cls=...` classroom query.
- vNext now: `[deliveryId]/page.tsx:9`: strips cls; resulting home may select wrong class context.
- Fix: Append cls query exactly within validated URLSearchParams.

## G2-16-006-041  [P1] GAP  facet F23  effort M
- Legacy: `index.js:13-20`: query-preserving, browser-replace /home redirect.
- vNext now: `[deliveryId]/page.tsx:9`: query-dropping redirect, changed ID semantics.
- Fix: Fix query and verify old slug vs deliveryId routing before declaring parity.

## G2-16-006-017  [P2] GAP  facet F07  effort M
- Legacy: `[...courseTab].js:121-135`: failed legacy load shows `Could not load course` with Try again and Back to Courses.
- vNext now: `[...courseTab]/page.tsx:58-74`: server data load/notFound; no same retry UI on redirect wrapper.
- Fix: Document and align destination error/retry state for redirect handoff.
