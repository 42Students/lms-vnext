# Work packet (wave 2): edit src/modules/placements/tpo-crm-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md, docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md

## G2-14-022-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy check contact GET /check?emailOrPhone `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:89-93`
- vNext now: New checkTpoLeadContact typed body/service `src/modules/placements/tpo-crm-service.ts:575-603`
- Fix: Map old query and 204/200 response contract for old clients

## G2-14-022-012  [P2] GAP  facet F05  effort S
- Legacy: Legacy board returns whole college list unpaged `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:37-40`
- vNext now: New list all leads ordered updatedAt desc then ID `src/modules/placements/tpo-crm-service.ts:113-124`
- Fix: Document old board ordering and provide stable alternative

## G2-14-022-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy duplicate response 409 with existing lead object `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:54-62`
- vNext now: New create conflict code TPO_CRM_LEAD_DUPLICATE without existing record `src/modules/placements/tpo-crm-service.ts:200-215`
- Fix: Show safe existing lead navigation on collision

## G2-14-022-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy edit source omitted unchanged; blank resets MANUAL/IMPORT `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:68-80` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:151-158`
- vNext now: New update source nullable/optional, result depends on patch semantics `src/modules/placements/tpo-crm-validation.ts:98-110` `src/modules/placements/tpo-crm-service.ts:605-655`
- Fix: Reproduce explicit omitted-vs-null source behavior and fallback

## G2-14-022-030  [P2] GAP  facet F09  effort M
- Legacy: Legacy add followup and move directly via endpoints `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:120-138`
- vNext now: New confirmed queue create/done and move in CRM service `src/modules/placements/tpo-followup-queue-service.ts:129-225` `src/modules/placements/tpo-crm-service.ts:453-483`
- Fix: Align followup edit dialog and due date time picker

## G2-14-022-037  [P2] GAP  facet F11  effort M
- Legacy: Legacy mutation requires TPO/college admin current college matching lead/followup `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:13-19` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAccessGuard.java:132-138`
- vNext now: New college membership and placements.manage on write `src/modules/placements/tpo-crm-service.ts:185-200` `src/modules/placements/tpo-followup-queue-service.ts:29-53`
- Fix: Document college admin equivalent manage access where intentional

## G2-14-022-044  [P2] GAP  facet F13  effort S
- Legacy: Legacy check contact returns 204 empty if no match `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:89-93`
- vNext now: New check service returns matching lead or null `src/modules/placements/tpo-crm-service.ts:575-604`
- Fix: Map distinct no-match HTTP204 for legacy callers

## G2-14-022-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy Not now and follow-up moved wording `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-246`
- vNext now: New typed error needs UI mapping `src/modules/placements/tpo-crm-service.ts:453-483`
- Fix: Map exact error/toast copy

## G2-11-019-060  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:152-161`
- vNext now: `src/modules/placements/tpo-crm-service.ts:328-390`
- Fix: Legacy activity outcome and follow-up generate timeline log, vNext transaction also emits activity/inApp notification; compare recipient/suppression.

## G2-11-019-073  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:19-20`
- vNext now: `src/modules/placements/tpo-crm-service.ts:293-391`
- Fix: Legacy TpoHub getRecruiterLeadPage and TpoService RPC, vNext 3 REST calls plus separate company memory and in-app notification activity.

## G2-11-019-076  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:185-198`
- vNext now: `src/modules/placements/tpo-crm-service.ts:83-107`
- Fix: Legacy stage, invite lifecycle, ownerFacultyId vs vNext manualStage + derived stage + ownerMembershipId, status semantics crosswalk.
