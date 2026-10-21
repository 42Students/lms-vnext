# Work packet (wave 2): edit src/components/projects/project-participant-list-controls.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md, docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-15-004-063  [P2] GAP  facet F20  effort M
- Legacy: Legacy URL search/status/attention/page0 shallow updates (ProjectsContent.jsx:154-193)
- vNext now: VNext GET URL adds work/sort/pageSize and page1 (learn/projects/page.tsx:64-76; project-participant-list-controls.tsx:219-265)
- Fix: Translate legacy bookmarked page0 and preserve known filters

## G2-7-028-007  [P2] GAP  facet F02  effort M
- Legacy: ProjectsContent.jsx:258-303 filter card with one horizontal Space of three controls and Clear
- vNext now: project-participant-list-controls.tsx:65-215 multicolumn grid with eight fields and Apply
- Fix: Make legacy core three controls compact above list; extras optional

## G2-7-028-009  [P2] GAP  facet F02  effort S
- Legacy: ProjectsContent.jsx:425-445 center pagination under list only if total>pageSize
- vNext now: project-participant-list-controls.tsx:267-313 range always shown with prev/next when >1
- Fix: Match conditional pagination placement and control style

## G2-7-028-011  [P2] GAP  facet F03  effort S
- Legacy: ProjectsContent.jsx:260-268 Search box 300px, allowClear icon and Search affordance
- vNext now: project-participant-list-controls.tsx:74-84 plain search Input full grid column
- Fix: Restore suffix icon, 300px desktop width and clear behavior

## G2-7-028-012  [P2] GAP  facet F03  effort S
- Legacy: ProjectsContent.jsx:269-284 status picker 170px, clearable, placeholder All statuses
- vNext now: project-participant-list-controls.tsx:86-105 native Select and All statuses option
- Fix: Mirror picker dropdown/clear chrome and dimension

## G2-7-028-034  [P2] GAP  facet F05  effort M
- Legacy: ProjectsContent.jsx:425-444 AntD numeric page-picker and page-size changer
- vNext now: project-participant-list-controls.tsx:275-310 Previous/Next only, Rows select above
- Fix: Match numeric page affordance, disabled states and placement

## G2-7-028-036  [P2] GAP  facet F06  effort S
- Legacy: ProjectsContent.jsx:269-296 allowClear Select immediately changes filter and page
- vNext now: project-participant-list-controls.tsx:65-71 auto-submit after 350ms, plus Apply button
- Fix: Apply filter immediately without redundant Apply click and delay for select

## G2-7-028-054  [P2] GAP  facet F10  effort M
- Legacy: ProjectsContent.jsx:154-193 URL state persisted via shallow replace
- vNext now: project-participant-list-controls.tsx:65-72 GET forms and page link queries
- Fix: Translate old query bookmarks and restore state after browser Back

## G2-7-028-072  [P2] GAP  facet F16  effort M
- Legacy: ProjectsContent.jsx:258-303 Space wrap, 300/170/210px inline filters
- vNext now: project-participant-list-controls.tsx:65-72 grid 1/2/4 columns
- Fix: Match filter wrapping and widths at 375/768/1280

## G2-7-028-077  [P2] GAP  facet F17  effort M
- Legacy: ProjectsContent.jsx:427-444 AntD Pagination selects numbered pages
- vNext now: project-participant-list-controls.tsx:275-310 Previous/Next links
- Fix: Restore page number context and keyboard control

## G2-7-028-014  [P3] GAP  facet F03  effort S
- Legacy: ProjectsContent.jsx:297-301 Clear filters only if one filter active
- vNext now: project-participant-list-controls.tsx:209-214 Clear link under any hasFilters, including sort/size
- Fix: Match condition when only legacy fields changed

## G2-7-028-037  [P3] GAP  facet F06  effort S
- Legacy: ProjectsContent.jsx:260-267 Input.Search has Enter search and clear icon
- vNext now: project-participant-list-controls.tsx:74-84 simple type=search
- Fix: Preserve search-on-enter and clear affordance
