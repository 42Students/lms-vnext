# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-14/l19-u026-module-access-controller.md

9 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l19-u026-module-access-controller.md

## G2-19-026-001  [P2] GAP  facet F01  effort M
- Legacy: Controller maps `/api/v1/admin/module-access` for both consoles (legacy controller:24-27)
- vNext now: Super Admin landing `/admin/module-access`, detail `/admin/features/[collegeId]` (page:14-35)
- Fix: Provide old-console entry affordance in college admin and route aliases/deep links if needed

## G2-19-026-002  [P2] GAP  facet F01  effort M
- Legacy: Old tree rooted COLLEGE then DEPARTMENT/PROGRAM/BATCH/CLASS (ModuleAccessService:168-199)
- vNext now: New hierarchy uses COLLEGE/DEPARTMENT/PROGRAM/COHORT/SECTION/MEMBERSHIP (service.ts:32-40)
- Fix: Map Batch→Cohort, Class→Section and learner→Membership labels visually

## G2-19-026-004  [P2] GAP  facet F02  effort M
- Legacy: Old tree includes nodes and learnerCount rolled up, canEditCollegeLevel (service:199-205)
- vNext now: New college overview counts scoped learners and visible scope choices separately (detail:67-71,128-160)
- Fix: Attach rolled-up student counts, edit rights and resolved module tuple to every hierarchy node

## G2-19-026-010  [P2] GAP  facet F05  effort M
- Legacy: Learner overrides `/learner-overrides` lists override holders not full student table (controller:151-180)
- vNext now: New trace has overridesOnly=only/locked and module filter (trace page:193-207)
- Fix: Add dedicated college override summary view with direct reset/edit affordance and inherited status

## G2-19-026-037  [P2] GAP  facet F18  effort S
- Legacy: Exact copy `Module access updated`, `collegeId is required`, `scopeType and module are required` (controller:42,101,108)
- vNext now: New schema and page terms `Module Access`, `Effective access`, `Access hierarchy` (admin module page:41-55)
- Fix: Apply exact legacy error/success messages where same action, map jargon consistently

## G2-19-026-039  [P2] GAP  facet F19  effort L
- Legacy: Legacy tree query batches hierarchy/settings and learner counts (service:74-87,95-206)
- vNext now: New listCollegeModuleScopeChoices paginates and reports override rows (descendant-rule-write:45-127)
- Fix: Avoid N+1, add bounded complete-tree endpoint and lazy child expansion for 10k students

## G2-19-026-042  [P2] GAP  facet F20  effort S
- Legacy: Old dedupes repeated learner IDs before 1000 cap (service:579-585)
- vNext now: New `.refine` rejects duplicates, max25 (bulk-service:16)
- Fix: Normalize duplicate selections or display exact rejection without inflated count

## G2-19-026-044  [P2] GAP  facet F21  effort S
- Legacy: Legacy audit and module settings changes synchronous; no queue in controller (service:496-560)
- vNext now: New activity event synchronous per student, optional summary insert (bulk-service:56-80)
- Fix: Disclose partial audit-warning to UI and offer review historical actions

## G2-19-026-046  [P2] GAP  facet F22  effort M
- Legacy: Old scopes LEARNER,CLASS,BATCH,...GLOBAL (ModuleAccessUpdateRequest:15-18)
- vNext now: New MEMBERSHIP,SECTION,COHORT,...GLOBAL (service.ts:32-40)
- Fix: Verify enrollment-aware membership mapping and inaccessible retired student records
