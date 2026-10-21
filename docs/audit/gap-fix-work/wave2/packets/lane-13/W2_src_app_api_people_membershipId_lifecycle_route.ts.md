# Work packet (wave 2): edit src/app/api/people/[membershipId]/lifecycle/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-002  [P2] GAP  facet F01  effort L
- Legacy: `AdminUserLifecycleController.java:43,83,137` exposes two `PUT /api/v1/admin/users/{userType}/{userId}/{suspend\|reactivate}` routes.
- vNext now: `people/[membershipId]/lifecycle/route.ts:15-45` exposes `PATCH /api/people/{membershipId}/lifecycle`; faculty also `PATCH /api/college/faculty/{membershipId}/lifecycle` (`route.ts:10-19`).
- Fix: Document explicit compatibility redirects/adapters for old bookmarked or external API clients, or record contract intentionally retired.
