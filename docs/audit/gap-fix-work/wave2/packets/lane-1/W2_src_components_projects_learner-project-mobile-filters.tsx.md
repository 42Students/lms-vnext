# Work packet (wave 2): edit src/components/projects/learner-project-mobile-filters.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md

## G2-15-004-019  [P2] GAP  facet F05  effort M
- Legacy: Type-ahead Search Input.Search debounced 350ms, allowClear (ProjectsContent.jsx:168-178,259-268)
- vNext now: Learner desktop GET Apply, mobile collapsed GET Apply, no live debounce (project-participant-list-controls.tsx:65-84,206-215; learner-project-mobile-filters.tsx:22-38,85-91)
- Fix: Restore 350ms live search and clear control while preserving deep links

## G2-15-004-029  [P2] GAP  facet F06  effort M
- Legacy: Input.Search search control 300px and allowClear, aria-label `Search my projects` (ProjectsContent.jsx:259-268)
- vNext now: Desktop full-column native Input, mobile Search Projects field; no clear icon (project-participant-list-controls.tsx:74-84; learner-project-mobile-filters.tsx:32-38)
- Fix: Restore width, search icon and clear control with accessible labels

## G2-15-004-031  [P2] GAP  facet F06  effort S
- Legacy: Legacy Input no visible maxLength attr (ProjectsContent.jsx:259-268)
- vNext now: VNext parser max100; mobile max100; desktop does not enforce DOM max (learn/projects/page.tsx:29-30,69-70; learner-project-mobile-filters.tsx:32-37)
- Fix: Enforce and signal 100 limit consistently instead of silently clearing invalid URL q

## G2-15-004-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy Space wrap filter row within inset card, Input300 and selects170/210 (ProjectsContent.jsx:258-303)
- vNext now: Grid at >=768, collapsed disclosure below 768 (project-participant-list-controls.tsx:65-73; learner-project-mobile-filters.tsx:22-31)
- Fix: Recreate 1280/768/375 wrap and filter panel

## G2-15-004-055  [P2] GAP  facet F17  effort M
- Legacy: Legacy aria-label Search my projects, status/attention labels, aria-busy and SkeletonRegion (ProjectsContent.jsx:259-312)
- vNext now: Desktop label matches; mobile Search Projects, page no aria-busy (project-participant-list-controls.tsx:74-84; learner-project-mobile-filters.tsx:32-38; learn/projects/page.tsx:142-214)
- Fix: Restore status announcements, accessible names and busy region

## G2-15-004-068  [P2] GAP  facet F23  effort M
- Legacy: Legacy compact clickable cards, status+bar+action hierarchy, always-visible inline filters (ProjectsContent.jsx:258-303,340-420)
- vNext now: VNext extra KPIs/summary, no bar, mobile disclosure (project-list.tsx:75-184; learner-project-mobile-filters.tsx:22-101)
- Fix: Restore legacy silhouette and make enhanced metrics secondary
