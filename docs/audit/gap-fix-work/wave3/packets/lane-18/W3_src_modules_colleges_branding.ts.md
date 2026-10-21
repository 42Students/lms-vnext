# Work packet (wave 3): edit src/modules/colleges/branding.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-021  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50 explicit login mode enum and effective default
- vNext now: src/modules/colleges/branding.ts:43-70 branding input does not include loginMethods
- Fix: Restore four-choice validated login configuration/default.
