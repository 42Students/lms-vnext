# Work packet (wave 3): edit drizzle/0057_college_branding.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-068  [P1] MISSING  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:39-44 login_methods in legacy migration V199
- vNext now: drizzle/0057_college_branding.sql:1-27 omits login_methods
- Fix: Add explicit login-mode schema and data migration.
