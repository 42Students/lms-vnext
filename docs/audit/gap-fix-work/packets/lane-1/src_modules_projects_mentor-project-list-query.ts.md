# Work packet: edit src/modules/projects/mentor-project-list-query.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-028-004  [P1] GAP  facet F01  effort M
- Legacy: ProjectsContent.jsx:154-193 URL search,status,attention,page uses page=0-based
- vNext now: mentor-project-list-query.ts:14-16 page is 1-based and converts page=0 to1
- Fix: Translate old positive 0-based bookmarked page numbers without off-by-one

## G2-7-028-086  [P1] GAP  facet F20  effort M
- Legacy: ProjectsContent.jsx:154-165 accepts 0-based URL page bookmarks
- vNext now: mentor-project-list-query.ts:14-16 converts page=0 to1 but page>0 interpreted 1-based
- Fix: Migrate all old bookmark pages consistently
