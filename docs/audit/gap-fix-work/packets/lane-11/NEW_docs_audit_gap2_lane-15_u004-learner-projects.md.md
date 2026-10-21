# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/u004-learner-projects.md

9 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy normalizer supplies course, mentor, phase, nextDue, progress and status variants (projectService.js:578-627; ProjectsContent.jsx:205-214)
- vNext now: VNext uses projectInstances plus team/progress/due aggregate services (learn/projects/page.tsx:78-94,160-179)
- Fix: Document DTO-to-schema mapping for all fields and missing values

## G2-15-004-017  [P1] GAP  facet F04  effort S
- Legacy: Archived must never display stale manually authored nextAction (ProjectsContent.jsx:396-418)
- vNext now: VNext actionLine can fall through to project.nextAction even if archived (learn/projects/page.tsx:180-193)
- Fix: Suppress actions for archived records, show view-only affordance

## G2-15-004-025  [P1] GAP  facet F05  effort M
- Legacy: Archived last; unrelated projects retain backend order; Team N natural order only within same series (ProjectsContent.jsx:130-152; projectListOrdering.js:1-18)
- vNext now: Archived last but other projects updatedAt DESC, compares Team N across unrelated series (learner-project-sort-model.ts:5-35)
- Fix: Reuse legacy numberedTeamTitle series guard and stable base ordering

## G2-15-004-032  [P1] GAP  facet F07  effort M
- Legacy: GET failure shows `Projects could not be loaded`, explanation and Retry (ProjectsContent.jsx:218-255)
- vNext now: Server awaited multiple reads without page-owned ErrorState/retry (learn/projects/page.tsx:78-95,142-213)
- Fix: Add matching recoverable route boundary and Retry with scoped URL

## G2-15-004-049  [P1] GAP  facet F13  effort M
- Legacy: Legacy initial fetch error offers Retry and unchanged-data guidance (ProjectsContent.jsx:245-255)
- vNext now: No local catch or Retry in route (learn/projects/page.tsx:78-95,142-214)
- Fix: Build route-specific ErrorState + recovery

## G2-15-004-060  [P1] GAP  facet F19  effort L
- Legacy: Legacy DB-backed server page25 plus 350ms requests for current slice (ProjectsContent.jsx:168-178,205-214)
- vNext now: VNext fetches all membership rows + all team/progress/due data then slices (learn/projects/page.tsx:78-140)
- Fix: Push filtered page and attention aggregation to indexed SQL

## G2-15-004-033  [P2] GAP  facet F07  effort M
- Legacy: Same-scope refresh failure `Couldn't refresh projects`, keeps previous cards (ProjectsContent.jsx:125-128,244-255)
- vNext now: No previous-list preservation/error branch in page (learn/projects/page.tsx:78-95)
- Fix: Keep last same-query response with amber warning

## G2-15-004-034  [P2] GAP  facet F07  effort S
- Legacy: Invalid project page query gets 400 BAD_REQUEST (ProjectWorkspaceController.java:91-105)
- vNext now: Invalid URL filter safely becomes undefined/default without notice (learn/projects/page.tsx:25-44,64-76)
- Fix: Show invalid-filter correction rather than silently broaden result set

## G2-15-004-035  [P3] GAP  facet F08  effort S
- Legacy: Refreshing projects… status, read-only browsing has no success toast (ProjectsContent.jsx:244-255)
- vNext now: No refresh status or success toast on page (learn/projects/page.tsx:142-214)
- Fix: Show transient non-blocking refresh status on filter/query reload
