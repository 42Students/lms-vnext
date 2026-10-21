# Work packet (wave 2): edit src/components/courses/admin-offering-section-tabs.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy has two tabs Home and Syllabus, Home default `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:29-46` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:167-179`
- vNext now: vNext four tabs Home, Syllabus, Who teaches it, Section content `src/components/courses/admin-offering-section-tabs.tsx:7-12` `src/components/courses/admin-offering-learning-page.tsx:81-107`
- Fix: Retain Home/Syllabus first two as legacy primary and place extra navigation secondarily.

## G2-19-007-013  [P2] GAP  facet F03  effort M
- Legacy: Legacy course-title tabs Home/Syllabus use AntD ink bar animated tab panes `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:172-179`
- vNext now: vNext custom Tabs renderPanel false anchor links `src/components/courses/admin-offering-section-tabs.tsx:29-32`
- Fix: Implement selected pane focus, animation and underline parity.

## G2-19-007-061  [P2] GAP  facet F17  effort M
- Legacy: Legacy AntD Tabs owns keyboard selection/focus and panes `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:172-179`
- vNext now: vNext Tabs renderPanel false uses anchor hash `src/components/courses/admin-offering-section-tabs.tsx:29-32`
- Fix: Make tabs real panels with correct ARIA-controls and selected state.
