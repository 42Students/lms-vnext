# Work packet (wave 2): edit src/components/admin/college-feature-rule-editor.tsx

33 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-14-024-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:146-150 — PUT /{collegeId} toggle module
- vNext now: src/components/admin/college-feature-rule-editor.tsx:53-69 — PUT college rule endpoint with policy action/expected state
- Fix: Map primitive boolean toggle to tri-state stored rule model.

## G2-14-024-034  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205 — Locked at X level. Change it in Module Access; own lock tells user to unlock
- vNext now: src/components/admin/college-feature-rule-editor.tsx:73-74 — Locked by a broader policy. Only Inherit is available for cleanup
- Fix: Match lock source detail and link to Module Access.

## G2-10-007-030  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:275-276` disabled on inherited lock, loading, stale scope, global save, confirm
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:25-27`,74-92 local busy/confirm and ancestor lock
- Fix: Replicate global mutation/confirm disabled policy

## G2-10-007-031  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:149-192` modal confirmation only when Projects switched OFF
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:40-54`,96-113 confirms all edits
- Fix: Scope confirm to disable risk when clone mode enabled

## G2-10-007-032  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:194-249` placements disable has specialized width560 warning dialog
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:96-113` generic ConfirmDialog
- Fix: Create legacy Placements modal variant width 560

## G2-10-007-045  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:316-331` dismissible Feature control was not changed alert with Retry
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:95` and `src/components/admin/college-feature-rule-editor.tsx:59-69` inline error only
- Fix: Add retryable dismissible alert above matrix

## G2-10-007-048  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:58-62` mentor-count/placements-impact only for OFF action
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:40-50` GET /impact?module before any policy change
- Fix: Retain risk-specific disable previews or explain broader review rule

## G2-10-007-051  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:44-45`,116-124 savingRef/confirmRef serialize all toggles
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:17-27` local editor state permits concurrent different-row mutations
- Fix: Serialize page-level policy writes or justify independent CAS

## G2-10-007-054  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` blocks inherited and college lock simple toggle
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:73-83` and `src/modules/module-access/admin-college-rule-write.ts:31-39` permit Inherit cleanup but block ancestor SET
- Fix: Clarify locally locked edit paths and do not silently bypass lock

## G2-10-007-071  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:275-276` switches have aria-label [module] for [college]
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:75-84` editor controls named by action only within repeated rows
- Fix: Give each editor field the college-specific accessible name

## G2-10-007-077  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:321-327` Feature control was not changed / Retry
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:60-69` Change failed (...) and no Retry action
- Fix: Use exact legacy error header and CTA

## G2-10-007-085  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:140-146` rejected dialog confirm retains action recovery
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:59-70` catches error then closes dialog in finally
- Fix: Keep confirm dialog open on failed mutation

## G2-10-019-012  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:670-675 — Blue info panel when College-level edits unavailable.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:153-156; src/components/admin/college-feature-rule-editor.tsx:72-85 — College editor offered to superadmin; no same notice.
- Fix: Show role-specific notice for unauthorized college editing.

## G2-10-019-032  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:435-457 — College row disables when backend `canEditCollegeLevel` false; locked-ancestor disables.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:153-156; src/components/admin/college-feature-rule-editor.tsx:25-27 — Separate editor checks ancestorLocked and permission; no integrated row affordance.
- Fix: Drive disabled state from resolved rights/locks at each node.

## G2-10-019-060  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:527-538 — Lock icon only when isSuperAdmin true.
- vNext now: src/components/admin/college-feature-rule-editor.tsx:72-84; src/components/admin/descendant-feature-rule-editor.tsx:64-66 — Lock checkboxes available in their admin surfaces.
- Fix: Confirm server permits only Super Admin locking, hide otherwise.

## G2-10-019-089  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:670-675 — 'College-level settings are managed by 42Students'.
- vNext now: src/components/admin/college-feature-rule-editor.tsx:73-79 — Different ancestor-lock warning.
- Fix: Preserve distinct permission notice.

## G2-10-019-098  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:398-433,459-499 — confirmRef guards repeated modal dialogs and stale scope operations.
- vNext now: src/components/admin/college-feature-rule-editor.tsx:17-27,96-114 — confirm state and impact check; descendant generic confirm.
- Fix: Gate simultaneous confirmations per unit and after scope switch.

## G2-9-036-030  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:275-276` disabled on inherited lock, loading, stale scope, global save, confirm
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:25-27`,74-92 local busy/confirm and ancestor lock
- Fix: Replicate global mutation/confirm disabled policy

## G2-9-036-031  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:149-192` modal confirmation only when Projects switched OFF
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:40-54`,96-113 confirms all edits
- Fix: Scope confirm to disable risk when clone mode enabled

## G2-9-036-032  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:194-249` placements disable has specialized width560 warning dialog
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:96-113` generic ConfirmDialog
- Fix: Create legacy Placements modal variant width 560

## G2-9-036-045  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:316-331` dismissible Feature control was not changed alert with Retry
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:95` and `src/components/admin/college-feature-rule-editor.tsx:59-69` inline error only
- Fix: Add retryable dismissible alert above matrix

## G2-9-036-048  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:58-62` mentor-count/placements-impact only for OFF action
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:40-50` GET /impact?module before any policy change
- Fix: Retain risk-specific disable previews or explain broader review rule

## G2-9-036-051  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:44-45`,116-124 savingRef/confirmRef serialize all toggles
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:17-27` local editor state permits concurrent different-row mutations
- Fix: Serialize page-level policy writes or justify independent CAS

## G2-9-036-054  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` blocks inherited and college lock simple toggle
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:73-83` and `src/modules/module-access/admin-college-rule-write.ts:31-39` permit Inherit cleanup but block ancestor SET
- Fix: Clarify locally locked edit paths and do not silently bypass lock

## G2-9-036-071  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:275-276` switches have aria-label [module] for [college]
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:75-84` editor controls named by action only within repeated rows
- Fix: Give each editor field the college-specific accessible name

## G2-9-036-077  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:321-327` Feature control was not changed / Retry
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:60-69` Change failed (...) and no Retry action
- Fix: Use exact legacy error header and CTA

## G2-9-036-085  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:140-146` rejected dialog confirm retains action recovery
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:59-70` catches error then closes dialog in finally
- Fix: Keep confirm dialog open on failed mutation

## G2-9-036-110  [P2] GAP  facet F06  effort M
- Legacy: Old Projects OFF action first requests mentor count `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:149-178`
- vNext now: vNext editor impact fetch before rule change `src/components/admin/college-feature-rule-editor.tsx:40-50`
- Fix: Match action-trigger order and guard one in-flight modal.

## G2-9-036-117  [P2] GAP  facet F09  effort S
- Legacy: Legacy disabling Placements 560px dialog explicitly 'Nothing is deleted; turning it back on restores access' `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:212-249`
- vNext now: New generic confirm policy changes `src/components/admin/college-feature-rule-editor.tsx:90-105`
- Fix: Use old dedicated disable confirmation and prominent reversible-data warning.

## G2-9-036-131  [P2] GAP  facet F18  effort S
- Legacy: Legacy placments impact modal text hides module for placement cell/admins/students/recruiters `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:213-226`
- vNext now: New generic confirmation does not name impacted roles `src/components/admin/college-feature-rule-editor.tsx:90-105`
- Fix: Restore exact four-role impact statement.

## G2-14-024-015  [P3] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:159-167 — missing both fields 400; unknown module 400
- vNext now: src/components/admin/college-feature-rule-editor.tsx:59-65 — generic request error code presentation
- Fix: Return actionable exact invalid-module/mandatory field messages.

## G2-10-007-067  [P3] GAP  facet F15  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:131-134` transient success toast
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:65-69` inline success state
- Fix: Use legacy toast copy/duration; verify duration live

## G2-9-036-067  [P3] GAP  facet F15  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:131-134` transient success toast
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:65-69` inline success state
- Fix: Use legacy toast copy/duration; verify duration live
