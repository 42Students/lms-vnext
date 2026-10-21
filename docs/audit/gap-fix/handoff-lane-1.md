# Cross-lane handoffs — chat-1 (Projects)

- `src/db/schema/project-audit-staged.ts` and a new live Drizzle migration — G2-4-029-066 (plus G2-4-029-011/-013/-014/-019): schema lane 14/15 must promote tenant-scoped `project_resource_audit` with `resourceKey`, actor identity/type, action and complete historical timestamp (staged definition is SOURCE-ONLY, not registered; no live migration). Once deployed, lane-1 can replace the current last-100 generic activity approximation with independently paged full resource audit. Do not import staged schema into production endpoints.
