# Work packet: edit src/app/api/college/faculty/[membershipId]/lifecycle/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-006  [P1] GAP  facet F04  effort M
- Legacy: `AdminUserLifecycleController.java:97-102,129-134` returns `{user: Learner\|Faculty}` including `suspendedAt` and `suspensionReason` (`Learner.java:21-28`; `Faculty.java:25-32`).
- vNext now: `people/[membershipId]/lifecycle/route.ts:39-45` returns `{person}` with `membership.status`; `college/faculty/[membershipId]/lifecycle/route.ts:17-19` returns `{membership}` with only id/status (`college-faculty-lifecycle-service.ts:81`).
- Fix: Standardize response for all lifecycle callers and ensure status, reason and timestamp are available to refresh the affected row.

## G2-1-001-014  [P2] GAP  facet F07  effort S
- Legacy: `AdminUserLifecycleController.java:93-94,105-106,145-146,156-157` returns HTTP 404 `{error:'Not found'}`.
- vNext now: `college/faculty/[membershipId]/lifecycle/route.ts:21-25` returns `{error:'NOT_FOUND'}` HTTP 404; generic route sends mapped service error (`people/[membershipId]/lifecycle/route.ts:46-47`).
- Fix: Map legacy-facing 404 text where exact copy parity is required; keep machine code separately.
