# Work packet (wave 2): edit src/modules/placements/tpo-recruiter-grant-write-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-14/u016-recruiter-college-access.md

## G2-15-022-028  [P2] GAP  facet F10  effort M
- Legacy: GET lists grants, POST extend, POST revoke, writes grant and `tpo_audit_log`; TpoRecruiterAccessController.java:58-85,93-111,118-136
- vNext now: List paginated; change transaction logs activityEvents; tpo-recruiter-access-service.ts:35-234; tpo-recruiter-grant-write-service.ts:132-174
- Fix: Produce exact endpoint/side-effect crosswalk including audit entity/action and response shape.

## G2-15-022-044  [P2] GAP  facet F20  effort M
- Legacy: Repeated revoke: 204 and no second audit write; TpoRecruiterAccessController.java:127-136
- vNext now: vNext only finds active matching grant and otherwise conflict; tpo-recruiter-grant-write-service.ts:119-130,159-165
- Fix: Make re-revoke idempotent success when same already-revoked grant is authorized, without extra activity event.

## G2-14-016-031  [P2] GAP  facet F10  effort M
- Legacy: Legacy grant same recruiter+college can be reactivated after revoke `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:19-21`
- vNext now: New GRANT inserts separate row when prior ACTIVE absent; revoked history remains `src/modules/placements/tpo-recruiter-grant-write-service.ts:84-107` `src/db/schema/placements.ts:255-260`
- Fix: Define historical reactivation or new-row provenance

## G2-14-016-034  [P2] GAP  facet F10  effort S
- Legacy: Legacy already-revoked revoke is no-op returning 204 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:127-128`
- vNext now: New refuses non-ACTIVE with conflict `src/modules/placements/tpo-recruiter-grant-write-service.ts:127-131` `src/modules/placements/tpo-recruiter-grant-write-service.ts:158-164`
- Fix: Make repeat revoke idempotent or explicitly show already revoked

## G2-14-016-041  [P2] GAP  facet F12  effort M
- Legacy: Legacy version nullable until insert, then JPA optimistic lock `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:75-78`
- vNext now: New expectedUpdatedAt CAS with ms date truncation `src/modules/placements/tpo-recruiter-grant-write-service.ts:127-145`
- Fix: Specify version-to-timestamp concurrency crosswalk

## G2-14-016-043  [P2] GAP  facet F13  effort S
- Legacy: Legacy absent college returns A college must be selected `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAccessService.java:70-76`
- vNext now: New grant write requires membership, returns permission error `src/modules/placements/tpo-recruiter-grant-write-service.ts:22-31`
- Fix: Map missing college vs forbidden copy

## G2-14-016-048  [P2] GAP  facet F15  effort M
- Legacy: Legacy extend and revoke audit TPO event names and actor `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:104-108` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:129-135`
- vNext now: New writes placement activity events for extend and revoke `src/modules/placements/tpo-recruiter-grant-write-service.ts:147-155` `src/modules/placements/tpo-recruiter-grant-write-service.ts:165-174`
- Fix: Crosswalk audit taxonomy and preserve actor type/reason

## G2-14-016-059  [P2] GAP  facet F20  effort S
- Legacy: Legacy revoke idempotent on already-revoked grant `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:127-128`
- vNext now: New stale/invalid throws conflict `src/modules/placements/tpo-recruiter-grant-write-service.ts:127-131`
- Fix: Support safe idempotent repeat revoke response
