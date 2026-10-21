# Work packet: edit src/modules/placements/tpo-recruiter-grant-write-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-15-022-018  [P1] GAP  facet F06  effort M
- Legacy: Extend from later of now/current validUntil; 0 sets NULL; TpoRecruiterAccessController.java:103-106
- vNext now: EXTEND uses calculated base and expiry; tpo-recruiter-grant-write-service.ts:132-146
- Fix: Compare expiry function leap-month semantics and explicitly support infinity, audit both paths.

## G2-15-022-029  [P1] GAP  facet F10  effort M
- Legacy: Revoke status, revokedAt, revokedByUserId/Type=FACULTY, reason; TpoRecruiterAccessController.java:128-134
- vNext now: Revoke status/actor/date but not reason/type; tpo-recruiter-grant-write-service.ts:159-166
- Fix: Store reason and actor role where audit needs it; preserve version-safe transaction.

## G2-14-016-033  [P1] GAP  facet F10  effort M
- Legacy: Legacy revoke sets status,revokedAt/by/type and reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:127-135`
- vNext now: New sets status/time/by, logs activity but reason not saved `src/modules/placements/tpo-recruiter-grant-write-service.ts:158-174`
- Fix: Persist reason and role audit

## G2-15-022-021  [P2] GAP  facet F07  effort S
- Legacy: Missing college/grant emits `Not found`; revoked extend `This recruiter's access was revoked; invite them again instead`; TpoRecruiterAccessController.java:96-102
- vNext now: Generic `TPO_RECRUITER_GRANT_STALE_OR_INVALID` conflict; tpo-recruiter-grant-write-service.ts:18-20,119-134
- Fix: Differentiate revoked versus stale/not-found with exact safe copy, never leak cross-college records.

## G2-14-016-022  [P2] GAP  facet F07  effort S
- Legacy: Legacy revoked grant extend says This recruiter's access was revoked; invite them again instead `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:95-101`
- vNext now: New status invalid or stale returns generic TPO_RECRUITER_GRANT_STALE_OR_INVALID `src/modules/placements/tpo-recruiter-grant-write-service.ts:118-131`
- Fix: Restore actionable revoked-versus-stale copy

## G2-14-016-026  [P2] GAP  facet F08  effort S
- Legacy: Legacy extend returns validUntil, audit note No end date or Until DATE `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:104-111`
- vNext now: New returns outcome extended and ISO validUntil `src/modules/placements/tpo-recruiter-grant-write-service.ts:141-156`
- Fix: Render exact date and no-end message if indefinite allowed

## G2-14-016-027  [P2] GAP  facet F08  effort S
- Legacy: Legacy revoke returns 204 empty and writes audit `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:118-136`
- vNext now: New returns outcome revoked and grantId object `src/modules/placements/tpo-recruiter-grant-write-service.ts:158-175`
- Fix: Define caller success toast and backwards response compatibility
