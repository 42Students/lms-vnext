# Work packet: edit src/components/admin/college-feature-rule-editor.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-14-024-003  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:231-253,261-269 — GET placements-impact and mentor-count per college
- vNext now: src/components/admin/college-feature-rule-editor.tsx:40-51 — generic /impact?module preview
- Fix: Verify same four placements and active mentor counters exposed, not only student population.

## G2-14-024-021  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:225-253 — placements impact read-only preview separate endpoint
- vNext now: src/components/admin/college-feature-rule-editor.tsx:45-51,96-113 — reviewChange shows generic population then confirmation
- Fix: Confirm stage/offer/interview impact counts appear before final disable action.

## G2-14-024-045  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:231-253 — placements preview counts distinct categories, can overlap
- vNext now: src/components/admin/college-feature-rule-editor.tsx:103-111 — acknowledge active learner population if >=100
- Fix: Retain distinct jobs/applications/offers/interviews as separate metrics; do not conflate with learner population.

## G2-10-007-029  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-275` binary immediate enable/disable switch
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:74-93` tri-state Inherit/On/Off and Lock this college rule
- Fix: Create simple toggle mode and separate advanced rule editor

## G2-10-007-050  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:126-134` refetch effective state before successful toast
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:65-69` stores submitted value and refreshes asynchronously
- Fix: Await effective resolver read before final success indication

## G2-10-007-058  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-206` refuses college writes under inherited/college locks
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` blocks ancestor-locked SET only, `src/components/admin/college-feature-rule-editor.tsx:75-83` can edit lock
- Fix: Audit college-local lock mutation authority before adopting editor

## G2-10-019-064  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:30-37 — Broad changes trigger confirmation for college/dept/program or >=100 students.
- vNext now: src/components/admin/college-feature-rule-editor.tsx:53-54,103-110 — Only college editor enforces 100 acknowledgement; descendant generic confirm.
- Fix: Enforce threshold/impact dialogue at each broad academic scope.

## G2-9-036-029  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-275` binary immediate enable/disable switch
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:74-93` tri-state Inherit/On/Off and Lock this college rule
- Fix: Create simple toggle mode and separate advanced rule editor

## G2-9-036-050  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:126-134` refetch effective state before successful toast
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:65-69` stores submitted value and refreshes asynchronously
- Fix: Await effective resolver read before final success indication

## G2-9-036-058  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-206` refuses college writes under inherited/college locks
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` blocks ancestor-locked SET only, `src/components/admin/college-feature-rule-editor.tsx:75-83` can edit lock
- Fix: Audit college-local lock mutation authority before adopting editor

## G2-9-036-116  [P1] GAP  facet F09  effort M
- Legacy: Legacy modal project zero count warns zero isn't safety `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:168-177`
- vNext now: New impact dialog may show generic counts without zero-specific caution `src/components/admin/college-feature-rule-editor.tsx:90-105`
- Fix: Restore zero/unavailable impact caution with exact wording.

## G2-14-024-016  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205 — 409 locked higher level or locked local with specific text
- vNext now: src/components/admin/college-feature-rule-editor.tsx:60-65 — ANCESTOR_LOCKED → A higher-level lock now prevents this override.
- Fix: Differentiate college lock vs ancestor lock in error UI.

## G2-10-007-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` lock conflict explains Module Access remediation
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` and `src/components/admin/college-feature-rule-editor.tsx:61-63` concise ANCESTOR_LOCKED message
- Fix: Add Module Access action to lock error

## G2-10-007-037  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:135-139` persistent mutation alert with Retry and original error
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:59-69` inline feedback without Retry
- Fix: Restore durable retry for exact failed action

## G2-10-007-040  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:131-134` success toast is [module] updated for [college] after refetch
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:65-69` inline Saved. Effective policy is refreshing.
- Fix: Reproduce exact success toast after authoritative effective refetch

## G2-10-007-041  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:180-187` exact Turn off Projects? / Turn off Projects danger copy
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:96-100` generic Confirm college feature policy / Apply change
- Fix: Match Projects disable title and destructive CTA

## G2-10-007-042  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:235-244` exact Turn off Placements for [college]? / Turn off Placements
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:96-100` generic title and CTA
- Fix: Match college-specific Placements warning copy

## G2-9-036-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` lock conflict explains Module Access remediation
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` and `src/components/admin/college-feature-rule-editor.tsx:61-63` concise ANCESTOR_LOCKED message
- Fix: Add Module Access action to lock error

## G2-9-036-037  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:135-139` persistent mutation alert with Retry and original error
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:59-69` inline feedback without Retry
- Fix: Restore durable retry for exact failed action

## G2-9-036-040  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:131-134` success toast is [module] updated for [college] after refetch
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:65-69` inline Saved. Effective policy is refreshing.
- Fix: Reproduce exact success toast after authoritative effective refetch
