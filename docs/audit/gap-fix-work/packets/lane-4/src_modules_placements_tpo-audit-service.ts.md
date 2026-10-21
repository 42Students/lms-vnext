# Work packet: edit src/modules/placements/tpo-audit-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-11-006-012  [P1] GAP  facet F04  effort L
- Legacy: Reads id,actorType,actorId,actorName,action,entityType,entityId,detail,createdAt. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:82`
- vNext now: Read row has id,kind,eventType,title,detail,occurredAt,jobId,entityHref,actorName. `src/modules/placements/tpo-audit-service.ts:76`
- Fix: Introduce explicit compatibility projection for missing actor/entity attributes.

## G2-11-006-027  [P1] GAP  facet F06  effort L
- Legacy: Four filter facets accept multi-select option arrays in URL f_* keys. `docs/legacy-source/frontend/src/components/tpo/filters/filterModel.js:9`
- vNext now: kind singleton enum; who substring; from/to dates. `src/modules/placements/tpo-audit-service.ts:34`
- Fix: Use multi-value filter schema OR within facet/AND between facets.

## G2-11-006-039  [P1] GAP  facet F10  effort M
- Legacy: GET /api/v1/tpo/audit?limit=500 by default or 5000&from&to; response rows + headers. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:33`
- vNext now: VNext direct server getTpoAuditLog from UNION of source tables, no legacy audit endpoint. `src/modules/placements/tpo-audit-service.ts:435`
- Fix: Build source/action parity map and compatibility test for API return.

## G2-11-006-040  [P1] GAP  facet F10  effort L
- Legacy: Legacy action writers persist to tpo_audit_log; logAtMostEvery de-dupes repeated updates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:22`
- vNext now: VNext reads activity_events and seven domain histories, without equivalent source row projection. `src/modules/placements/tpo-audit-service.ts:132`
- Fix: Trace every writer and ensure complete recorded action parity.

## G2-11-006-046  [P1] GAP  facet F12  effort L
- Legacy: Single append-only tpo_audit_log with 1000-character normalized detail. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:32`
- vNext now: VNext SQL histories and activity_events; free-text notes omitted intentionally. `src/modules/placements/tpo-audit-service.ts:114`
- Fix: Map legacy audit actions/details to privacy-safe canonical equivalents.

## G2-11-006-074  [P1] GAP  facet F21  effort L
- Legacy: Audit log persistence synchronous MySQL inserts, no background read jobs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:34`
- vNext now: vNext joins Postgres histories and activity events, optional share table. `src/modules/placements/tpo-audit-service.ts:340`
- Fix: Verify writer/webhook/job coverage of every old audit event.

## G2-11-006-076  [P1] GAP  facet F22  effort L
- Legacy: V165 defines tpo_audit_log with college_id, actor_type/id, action, entity_type/id, detail, created_at and two indexes. `docs/legacy-source/backend/src/main/resources/db/migration/V165__tpo_v1_complete.sql:178`
- vNext now: No unified audit table query; eight PostgreSQL source families. `src/modules/placements/tpo-audit-service.ts:136`
- Fix: Write column/index/action crosswalk and close data migration requirements.

## G2-11-006-077  [P1] GAP  facet F22  effort M
- Legacy: Legacy actor_type supports TPO/RECRUITER/STUDENT name lookups. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:82`
- vNext now: VNext only joins users actor_user_id for actor name, may lose historic actor types. `src/modules/placements/tpo-audit-service.ts:544`
- Fix: Capture safe type/name fallback where legacy stored it.

## G2-8-031-019  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:44-52 default 500 events, date range up to 5000, header x-total-count, filters apply client-side.
- vNext now: src/modules/placements/tpo-audit-service.ts:34-72 strict query and :515-555 server-side page/limit; range does not guarantee 5000 whole-month snapshot.
- Fix: Implement complete bounded date-range export with total count and explicit truncation warnings.

## G2-8-031-069  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:17-18 entityType category covers DRIVES, RECRUITER_LEAD, STUDENT, OFFER, ROUND, SHARE, SETTINGS, BULK.
- vNext now: src/modules/placements/tpo-audit-service.ts:132-370 merges activityEvents + application/offer/share histories using SQL union and filters; DB sources differ.
- Fix: Define deduplication/union ordering contract so one mutation appears once with correct actor/details, no omissions.

## G2-11-006-032  [P2] GAP  facet F07  effort S
- Legacy: Search global typed input not capped at specific 120-char server max. `docs/legacy-source/frontend/src/components/tpo/grid/GridWorkspace.jsx:74`
- vNext now: vNext q max120, who max100 but grid local Who max120. `src/modules/placements/tpo-audit-service.ts:41`
- Fix: Harmonize max length and failure text.
