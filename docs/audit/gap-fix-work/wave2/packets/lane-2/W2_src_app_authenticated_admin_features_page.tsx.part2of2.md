# Work packet (wave 2): edit src/app/(authenticated)/admin/features/page.tsx (part 2 of 2)

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/cross-settings-feature-flags.md, docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md

## G2-9-036-128  [P2] GAP  facet F16  effort M
- Legacy: Old 20-row table pins College and scrolls horizontally `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:251-292,356-365`
- vNext now: New DataTable hides column priorities responsively `src/app/(authenticated)/admin/features/page.tsx:229-263`
- Fix: Restore scroll-x table instead of hiding columns at tablet sizes.

## G2-9-036-129  [P2] GAP  facet F17  effort S
- Legacy: Old switches aria-label 'Projects for <college>' etc `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-277`
- vNext now: New changed-value selects nested in repeated Disclosure `src/app/(authenticated)/admin/features/page.tsx:245-255`
- Fix: Add unique college+module accessible names to every control.

## G2-9-036-130  [P2] GAP  facet F18  effort S
- Legacy: Legacy Feature Controls description explicitly says Courses & Content never switched off `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:303-307`
- vNext now: New says three optional modules including Electives, no core-course caveat `src/app/(authenticated)/admin/features/page.tsx:122-125`
- Fix: Use exact core-module explanation in overview.

## G2-14-024-004  [P3] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:280-285 — GET /modules served from catalog labels
- vNext now: src/app/(authenticated)/admin/features/page.tsx:245-257 — client module headers from OPTIONAL_MODULE_KEYS
- Fix: Expose dynamic catalog with source labels on read if used by clients.

## G2-14-024-035  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:26-29 — Projects / Placements business labels
- vNext now: src/app/(authenticated)/admin/features/page.tsx:245-253 — ModuleState shows Enabled/Disabled
- Fix: Preserve old On/Off labels where required by clone specification.

## G2-10-007-007  [P3] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_admin-list-pages.scss:1578-1582` overview 16px margin and zero shadow
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-135` overview border-top pt-6
- Fix: Apply 16px legacy vertical rhythm and no shadow

## G2-10-007-028  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-341` unbounded Input.Search, empty initial value
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:144-151` q maxLength=100; URL-provided initial
- Fix: Document 100-character cap and retain clear-icon behavior

## G2-10-007-072  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-340` exact aria-label Search feature-control colleges
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:142-152` visible Find college label
- Fix: Maintain explicit accessible search semantics

## G2-10-007-074  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/features.js:11-16` exact Feature Controls page title
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-125` exact title, longer subtitle
- Fix: Retain title and move explanatory text below header

## G2-9-036-007  [P3] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/styles/pages/_admin-list-pages.scss:1578-1582` overview 16px margin and zero shadow
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:127-135` overview border-top pt-6
- Fix: Apply 16px legacy vertical rhythm and no shadow

## G2-9-036-028  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-341` unbounded Input.Search, empty initial value
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:144-151` q maxLength=100; URL-provided initial
- Fix: Document 100-character cap and retain clear-icon behavior

## G2-9-036-072  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:335-340` exact aria-label Search feature-control colleges
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:142-152` visible Find college label
- Fix: Maintain explicit accessible search semantics

## G2-9-036-074  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/features.js:11-16` exact Feature Controls page title
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:122-125` exact title, longer subtitle
- Fix: Retain title and move explanatory text below header
