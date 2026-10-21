# Work packet: edit src/app/(authenticated)/learn/projects/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-020  [P1] GAP  facet F05  effort S
- Legacy: Legacy search backend title/course/slug (ProjectsContent.jsx:260-267; projectService.js:6-13)
- vNext now: Current matches title,slug,summary,mentor, but NOT course (learner-project-search-model.ts:5-14; learn/projects/page.tsx:100-104)
- Fix: Include courseLabel in scoped search fields

## G2-15-004-044  [P1] GAP  facet F12  effort S
- Legacy: Legacy archived suppresses review/action and sorts last (ProjectsContent.jsx:130-152,316-329,396-418)
- vNext now: VNext archived attention excluded, but manually authored nextAction still used (learner-attention-service.ts:43-48; learn/projects/page.tsx:180-193)
- Fix: Suppress obsolete actions on archived rows

## G2-15-004-061  [P1] GAP  facet F19  effort L
- Legacy: Legacy API filtering before pagination (`ProjectWorkspaceController.java:91-101`)
- vNext now: VNext allRows filter/sort in memory (`learn/projects/page.tsx:100-140)
- Fix: Preserve total, page size and stable filtered page via DB

## G2-15-004-069  [P1] GAP  facet F23  effort L
- Legacy: Legacy scoped GET paging and recoverable stale-refresh/error UX (ProjectsContent.jsx:195-255)
- vNext now: VNext full-list server reads with no Retry on page (`learn/projects/page.tsx:78-140)
- Fix: Add SQL pagination and recoverable loading/error boundary, enforce role-scope on stale requests
