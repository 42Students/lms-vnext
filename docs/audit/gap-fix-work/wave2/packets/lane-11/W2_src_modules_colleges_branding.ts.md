# Work packet (wave 2): edit src/modules/colleges/branding.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-043  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:35-36 login_theme intentionally removed shared gradient
- vNext now: src/modules/colleges/branding.ts:141-165 derives per-college colour tokens
- Fix: Confirm login page stays original 42LMS teal regardless college custom primary.
