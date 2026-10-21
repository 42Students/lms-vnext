# Work packet (wave 2): edit src/auth/origin.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-2-036-046  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/configuration/WebSecurityConfig.java:114 CORS preflight permit-all
- vNext now: src/auth/origin.ts:1-26 validates mutation Origin
- Fix: Ensure valid tenant custom domains send acceptable Origin.
