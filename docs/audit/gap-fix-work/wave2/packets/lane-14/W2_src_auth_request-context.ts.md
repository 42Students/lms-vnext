# Work packet (wave 2): edit src/auth/request-context.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-2-036-058  [P2] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:201-203 JWT+ScopeContext+RecruiterFence chain
- vNext now: src/auth/request-context.ts:57-84 identity cookie and context
- Fix: Document exact request filter/identity boundary and order.
