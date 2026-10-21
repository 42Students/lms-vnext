# Work packet (wave 2): edit src/modules/projects/mentor-paged-project-list-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-028-051  [P2] GAP  facet F10  effort L
- Legacy: projectService.js:6-14 GET /api/v1/projects/me/page page,size,search,status,attention
- vNext now: mentor-paged-project-list-service.ts:16-80 SQL query/limit on standard filters; mentor/projects/page.tsx:74-81 full fallback for advanced
- Fix: Document endpoint query parity and bounded loading for advanced views

## G2-7-028-083  [P2] GAP  facet F19  effort L
- Legacy: projectService.js:6-14 page size max50 and backend query
- vNext now: mentor-paged-project-list-service.ts:59-80 DB page 10/25/50, fallback full set on advanced filters
- Fix: Ensure advanced filters are paged or bounded for colleges with many workspaces

## G2-7-028-093  [P2] GAP  facet F22  effort L
- Legacy: ProjectWorkspaceServiceImpl:1683-1704 paged DTO query filters numeric statuses and attention
- vNext now: mentor-paged-project-list-service.ts:29-80 SQL status, search and sort; advanced in-memory handling
- Fix: Document relational enum/status/attention query equivalence
