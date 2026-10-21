# Work packet: edit drizzle/0000_hard_the_spike.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md

## G2-1-001-046  [P1] GAP  facet F22  effort L
- Legacy: `Learner.java:21-28,64-74` and `Faculty.java:25-32,59-69` store per-account `suspended_at`, `suspension_reason`, `token_version`, JPA `version`; `AdminUserLifecycleController.java:97-99` mutates person table.
- vNext now: `memberships.ts:17-49`; `drizzle/0000_hard_the_spike.sql:46-55` store per-college state and reason; `users.ts:12-25` has platform status and no per-user token_version.
- Fix: Preserve equivalent immediate token invalidation using device-session/auth checks instead of removed token_version; document one-account-to-many-memberships mapping.
