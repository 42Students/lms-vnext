# Work packet (wave 2): edit src/modules/placements/screening-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-13-021-014  [P2] GAP  facet F05  effort M
- Legacy: Legacy rank by job+organization+version, scoped to page application IDs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:38-59`
- vNext now: vNext scoped query with status filter and separate detail history. `src/modules/placements/screening-service.ts:173-227`
- Fix: Offer version filter and stable paginated score sorting.

## G2-13-021-017  [P2] GAP  facet F06  effort M
- Legacy: Legacy screenedBy/method immutable once set per service. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:119-145`
- vNext now: vNext decidedByUserId set per decision transition. `src/modules/placements/screening-service.ts:355-382`
- Fix: Preserve immutable algorithm provenance separate from mutable human decisions.

## G2-13-021-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy repository score reads by job/org/version and application IDs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:16-59`
- vNext now: vNext queue loads scoped screening status not score. `src/modules/placements/screening-service.ts:152-227`
- Fix: Build score query adapters and limit pages.

## G2-13-021-028  [P2] GAP  facet F10  effort M
- Legacy: Legacy screenedAt CreationTimestamp and service explicit now update. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:114-116`
- vNext now: vNext decidedAt only when human decision. `src/modules/placements/screening-service.ts:355-382`
- Fix: Represent createdAt,screenedAt,decidedAt separately.

## G2-13-021-036  [P2] GAP  facet F13  effort M
- Legacy: Legacy retry can reprocess same screening and preserve initial method/actor. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:80-107`
- vNext now: vNext decision concurrency throws STALE when updatedAt changed. `src/modules/placements/screening-service.ts:314-323`
- Fix: Support auto retry by job version with CAS and outcome receipts.

## G2-13-021-039  [P2] GAP  facet F15  effort M
- Legacy: Legacy auto screening asynchronous after application created, not an email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-16`
- vNext now: vNext manual decision sends notifications via activity service; auto screen email absent. `src/modules/placements/screening-service.ts:277-455`
- Fix: Separate algorithm completion from candidate decision notification.

## G2-13-021-045  [P2] GAP  facet F19  effort M
- Legacy: Legacy page-scoped application ID query avoids whole-job N+1. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:50-59`
- vNext now: vNext scoped query, status ordering; no numeric score join. `src/modules/placements/screening-service.ts:152-227`
- Fix: Use batched score lookup if restored.

## G2-13-021-047  [P2] GAP  facet F20  effort M
- Legacy: Legacy source actor and method once-only, screenVersion assigned job current. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:97-107`
- vNext now: vNext CAS and history for manual decisions, no algorithm version. `src/modules/placements/screening-service.ts:355-382`
- Fix: Use immutable provenance + retries with new version history.
