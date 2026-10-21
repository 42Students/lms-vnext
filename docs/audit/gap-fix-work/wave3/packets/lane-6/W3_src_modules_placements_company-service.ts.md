# Work packet (wave 3): edit src/modules/placements/company-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u020-college-company.md

## G2-14-020-027  [P1] MISSING  facet F09  effort L
- Legacy: Legacy flow contains OTP/sendCode and company join form `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-198`
- vNext now: New company service exposes only managed relationship editing `src/modules/placements/company-service.ts:378-426`
- Fix: Implement secure join modal/public flow with verified email
