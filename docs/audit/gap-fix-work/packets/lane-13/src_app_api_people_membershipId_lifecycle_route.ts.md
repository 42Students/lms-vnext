# Work packet: edit src/app/api/people/[membershipId]/lifecycle/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-1-001-006  [P1] GAP  facet F04  effort M
- Legacy: `AdminUserLifecycleController.java:97-102,129-134` returns `{user: Learner\|Faculty}` including `suspendedAt` and `suspensionReason` (`Learner.java:21-28`; `Faculty.java:25-32`).
- vNext now: `people/[membershipId]/lifecycle/route.ts:39-45` returns `{person}` with `membership.status`; `college/faculty/[membershipId]/lifecycle/route.ts:17-19` returns `{membership}` with only id/status (`college-faculty-lifecycle-service.ts:81`).
- Fix: Standardize response for all lifecycle callers and ensure status, reason and timestamp are available to refresh the affected row.

## G2-18-031-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy learner POST /register, /bulk-validate, /bulk-register, /bulk-imports and undo, PUT /update/{id}, DELETE /delete/{id}; LearnerController.java:338-465,1065-1141
- vNext now: vNext POST /api/people/onboard, /api/people/student-import PREVIEW/IMPORT, /api/people/{membershipId} profile/lifecycle PATCH; college-student-register-form.tsx:42-69;college-student-csv-import.tsx:42-58;api/people/[membershipId]/lifecycle/route.ts:15-49
- Fix: Write route/payload/status migration sheet and explicitly resolve old undo and hard-delete APIs, no unsafe replacement

## G2-18-031-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy suspend PUT /api/v1/admin/users/{userType}/{id}/suspend and reactivate; AdminUserLifecycleController.java:83-167
- vNext now: vNext PATCH /api/people/{membershipId}/lifecycle with {action,reason}; api/people/[membershipId]/lifecycle/route.ts:15-49;membership-service.ts:136-156
- Fix: Explicitly distinguish account-wide vs college membership effects and user ID vs membership ID in API clients

## G2-1-001-014  [P2] GAP  facet F07  effort S
- Legacy: `AdminUserLifecycleController.java:93-94,105-106,145-146,156-157` returns HTTP 404 `{error:'Not found'}`.
- vNext now: `college/faculty/[membershipId]/lifecycle/route.ts:21-25` returns `{error:'NOT_FOUND'}` HTTP 404; generic route sends mapped service error (`people/[membershipId]/lifecycle/route.ts:46-47`).
- Fix: Map legacy-facing 404 text where exact copy parity is required; keep machine code separately.
