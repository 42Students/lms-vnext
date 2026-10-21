# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u002-college-admin-projects-audit.md

## G2-7-002-002  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:159-206: `?action=`, `?range=`, `?entityId=`, zero-based `?page=` restored and shallow-updated; `status` accepted as former action alias.
- vNext now: V/modules/projects/admin-audit-query-model.ts:34-37,58-67: status/action supported but range/entityId/page ignored and flagged invalid.
- Fix: Map existing range and entityId deep links to from/subjectId; bridge page indexes to cursor or page-preserving state.

## G2-7-002-019  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:273-281: actor distinct counts from each fetched record's actorUserId else actorName.
- vNext now: V/components/projects/project-admin-audit-page.tsx:303-314: counts distinct only latest actor of each grouped cluster, excludes null IDs.
- Fix: Calculate distinct actor count over all 40 raw events before grouping, not groups' latest actor.

## G2-7-002-020  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:275-280,81-99: Destructive actions count exact listed action keys, including mentor/student reassignment and readiness override.
- vNext now: V/components/projects/project-admin-audit-page.tsx:308-310: regex only archive/delete/revoke/remove/unassign on latest event of each group.
- Fix: Maintain explicit mapped destructive taxonomy and count raw items, including overrides and assignments.

## G2-7-002-021  [P1] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:283-285,505-539: caps label `Actions today (first 200)` or `... (this page)` when truncation.
- vNext now: V/components/projects/project-admin-audit-page.tsx:305-310: always `Actions shown` and unqualified actors/destructive counters.
- Fix: Label count denominator and truncation when more cursor pages exist.

## G2-7-002-022  [P1] GAP  facet F05  effort L
- Legacy: LFE/pages/college-admin/projects/audit/index.js:313-418: table Action, Entity, Actor, When; day-divider rows and expandable extra details.
- vNext now: V/components/activity/activity-center.tsx:114-191: article feed with badges/summary/date/disclosure.
- Fix: Render four-column table, dates and expandable details.

## G2-7-002-023  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:595-605: only All time paginates, 25 items/page via numerical pages.
- vNext now: V/components/projects/project-admin-audit-page.tsx:78 and :328-339: fixed 40 events with cursor Load more for all ranges.
- Fix: Implement 200-row short-range bounded list and 25-row All time pagination.

## G2-7-002-025  [P1] MISSING  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:349-381: clicking Entity slug filters list to that exact entity, keyboard accessible.
- vNext now: V/components/activity/activity-center.tsx:181-185: entity shown only in disclosure, no click-to-filter.
- Fix: Make entity cell/button set subjectId and reset page; keep it URL-shareable.

## G2-7-002-026  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:101-113: range options today/7d/30d/all, today default; short ranges wide=200.
- vNext now: V/components/projects/project-admin-audit-page.tsx:167-186: today/7-days/30-days/all-time converted to from date; count limit40.
- Fix: Restore short-range 200 read limit or clearly retain new pagination with trustworthy counts.

## G2-7-002-033  [P1] GAP  facet F07  effort M
- Legacy: LBE/controller/AdminProjectController.java:737-779: unauthenticated 401, college invalid 400, unauthorized 403.
- vNext now: V/components/projects/project-admin-audit-page.tsx:65-90: service failure caught indiscriminately into generic unavailable.
- Fix: Render explicit denied/session error from activity.read distinct from transient DB failures.

## G2-7-002-040  [P1] GAP  facet F10  effort L
- Legacy: LBE/service/AdminAuditLogService.java:47-82: audit writers saveAndFlush with action/entity/actor/IP/UA/payload.
- vNext now: V/db/schema/activity.ts:18-67: activity_events records module, summary, metadata, actor, no direct IP/UA fields.
- Fix: Document audit attribution metadata parity, retention and actor context where appropriate.

## G2-7-002-046  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:224-233: today begins at browser-local day start after subtracting N calendar days for 7d/30d.
- vNext now: V/components/projects/project-admin-audit-page.tsx:173-175: IST computed from now minus 6/29 * 86400000.
- Fix: Define actual 7/30-day inclusive window and timezone; match named-range cutoffs exactly.

## G2-7-002-047  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:79-99: destructive set marks 11 action types including readiness override and learner roster reassignment.
- vNext now: V/components/projects/project-admin-audit-page.tsx:308-310: destructive regex misses readiness/assigned/reviewed events.
- Fix: Build explicit taxonomy-to-destructive mapping; test counts per action.

## G2-7-002-054  [P1] GAP  facet F14  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:559-581: `project-audit-log.csv` with Action, Entity type, Entity ID, Actor, When.
- vNext now: V/components/projects/project-audit-page-export.tsx:5-15: same filename, but Event ID, Action, Entity, Summary, Importance, Occurred at.
- Fix: Restore exact five headers and raw action/entity/actor/when mapping.

## G2-7-002-068  [P1] GAP  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:108-113,157: short 200 rows, all time 25 row pagination.
- vNext now: V/components/projects/project-admin-audit-page.tsx:78: limit40 for all views, cursor pagination.
- Fix: Tune query cap/page mode to legacy and provide honest totals.

## G2-7-002-071  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/audit/index.js:119-128,294-301: parses Java LocalDateTime array and dayjs local day boundaries.
- vNext now: V/components/activity/activity-center.tsx:56-68: ISO UTC instants formatted IST.
- Fix: Align day-zone and legacy source UTC conversion; test near-midnight and DST zones.

## G2-7-002-074  [P1] GAP  facet F21  effort L
- Legacy: LBE/service/AdminAuditLogService.java:31-82: audit synchronous saveAndFlush; failure of log() caught, logRequired propagation.
- vNext now: V/modules/activity/service.ts:243-350: writeActivityEvent, raw-input schemas and DB writes with dedupe/group IDs.
- Fix: Audit each project mutation producer for transactional required event writes and no missed legacy keys.

## G2-7-002-076  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/AdminAuditLog.java:10-61: `admin_audit_log`: bigint id, actionKey varchar100, entityType60/entityId60, actorUserId integer/actorType20, IP/UA, JSON payload and LocalDateTime.
- vNext now: V/db/schema/activity.ts:18-68: `activity_events` UUID id, module32, eventType120, subjectType80, subjectId text, actorMembershipId UUID, summary text, metadata JSONB, occurredAt timestamptz.
- Fix: Map legacy event codes/actor/subject metadata; decide retention of IP/UA and import backfill contract.

## G2-7-002-078  [P1] GAP  facet F22  effort M
- Legacy: LBE/repository/AdminAuditLogRepository.java:14-70: projectDomainOnly project/template/task and exact entityId, createdAt DESC.
- vNext now: V/modules/activity/service.ts:532-665: PROJECTS module filter, optional subject filters, ordered occurredAt DESC and id DESC.
- Fix: Reconcile event taxonomy and subject ID semantics for audit history navigation.

## G2-7-002-080  [P1] GAP  facet F23  effort L
- Legacy: LFE/pages/college-admin/projects/audit/index.js:313-455: ungrouped raw event table and detailed payload per record.
- vNext now: V/components/activity/activity-center.tsx:143-165,180-190: groups related activity and shows latest + earliest metadata, not every event row.
- Fix: Provide ungroupped audit mode or open individual event details for every grouped item.

## G2-7-002-031  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/audit/index.js:260-264,488: `Audit log could not be loaded` and API message, fallback `Failed to load audit log.`.
- vNext now: V/components/projects/project-admin-audit-page.tsx:82-90: `Project audit unavailable` and generic failure, retry.
- Fix: Restore literal user-facing error title/description and safe underlying cause.
