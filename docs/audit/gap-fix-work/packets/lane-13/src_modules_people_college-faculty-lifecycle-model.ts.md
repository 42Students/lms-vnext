# Work packet: edit src/modules/people/college-faculty-lifecycle-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-011  [P1] GAP  facet F06  effort M
- Legacy: `AdminUserLifecycleService.js:5-6`, `Faculty.js:495`, `Students.js:645` send `{}` with no reason; legacy controller treats body and reason as optional (`AdminUserLifecycleController.java:86-90`).
- vNext now: `validation.ts:69-86` requires trimmed nonempty reason max 1000; faculty alternative requires 3-500 and confirm=true (`college-faculty-lifecycle-model.ts:4-16`).
- Fix: Define one reason policy and apply it consistently to learner/faculty/superadmin lifecycle surfaces; preserve legacy no-reason behaviour only if owner opts in.
