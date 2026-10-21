# Work packet (wave 3): edit src/db/schema/college-branding.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-15-020-016  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50 login_methods four enum values, null→EMAIL_PHONE
- vNext now: src/db/schema/college-branding.ts:27-50 and src/modules/colleges/branding-service.ts:20-31 lack loginMethods
- Fix: Add tenant login mode in schema/service/auth or explicitly retire policy.

## G2-15-020-044  [P1] MISSING  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50 mode defaults EMAIL_PHONE
- vNext now: src/db/schema/college-branding.ts:27-50 no login mode
- Fix: Owner decision on preserving per-college sign-in restrictions.

## G2-15-020-073  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50 login methods in legacy
- vNext now: src/db/schema/college-branding.ts:27-50 dropped from vNext
- Fix: Owner decision on exact login method parity.
