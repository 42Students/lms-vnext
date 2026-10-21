# Work packet: edit src/db/schema/projects.ts (part 3 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-20/project-meeting.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-3/l18-u017-project-member-entity.md, docs/audit/gap2/lane-3/project-delivery-event.md, docs/audit/gap2/lane-4/project-delivery-model.md

## G2-13-028-064  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-140 legacy task fields include key,dueLabel,estimate,sprintKey
- vNext now: src/db/schema/projects.ts:1-500 UUID tasks/sprints, estimatePoints,dueDate,status
- Fix: Migrate legacy task keys, due labels, sprint keys to UUID FK and preserve semantics.

## G2-20-017-029  [P1] GAP  facet F12  effort M
- Legacy: Legacy meeting key unique even soft-deleted, update revives row `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:24-31`
- vNext now: New no meetingKey or deletedByWorkspace, status enum `src/db/schema/projects.ts:1104-1120`
- Fix: Define duplicate-name/key collision handling and migration resurrection rule

## G2-20-017-043  [P1] GAP  facet F22  effort L
- Legacy: Legacy project_meeting FK int, unique project_id/meeting_key, soft-delete/version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:15-26,160-176`
- vNext now: New UUID FK, timestamp/status/type checks/indexes, no meeting_key or version `src/db/schema/projects.ts:1104-1215`
- Fix: Produce migration crosswalk including deleted row/key/version semantics and corresponding Drizzle indexes

## G2-11-028-067  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:20-31`
- vNext now: `src/db/schema/projects.ts:172-252`
- Fix: Legacy numeric project workspace + isDeleted soft-delete and mentor relation vs vNext UUID project_instances status=ARCHIVED, archived_at timestamp, project_members active role and updatedAt CAS; explicit ETL.

## G2-11-028-069  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:115-123`
- vNext now: `src/db/schema/projects.ts:328-465`
- Fix: Legacy true delete cascades memberships and regenerates template task/sprint/resource structure; vNext archive leaves project_tasks and project_sprints references intact.

## G2-18-017-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:12-18`
- vNext now: `src/db/schema/projects.ts:638-652`
- Fix: Legacy `project_member` JPA numeric BaseModel ID and unique project/user/type, vNext `project_members` UUID membership IDs and active-only uniqueness.

## G2-18-017-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:20-24`
- vNext now: `src/db/schema/projects.ts:641-651`
- Fix: Legacy numeric project/user refs vs UUID project_instance/member key and creator user.

## G2-18-017-009  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-16`
- vNext now: `src/db/schema/projects.ts:684-693`
- Fix: Legacy permanent unique triple regardless is_deleted, vNext active-only (projectId,membershipId) partial index supports historic duplicates.

## G2-18-017-041  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-16`
- vNext now: `src/db/schema/projects.ts:685-692`
- Fix: Legacy same triple cannot be reinserted after deleted, vNext end/readd produces a new row ID and breaks history references unless remapped.

## G2-18-017-045  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-27`
- vNext now: `src/db/schema/projects.ts:641-651`
- Fix: Numeric project_id/user_id/user_type and BaseModel ID+isDeleted require mapping to instance/membership UUID and roleKind.

## G2-18-017-046  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-39`
- vNext now: `src/db/schema/projects.ts:652-681`
- Fix: Legacy displayName, status and deletedByWorkspace may be lost if not represented by membership joins/endedAt.

## G2-18-017-048  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-16`
- vNext now: `src/db/schema/projects.ts:685-693`
- Fix: Historical project membership revive unique behavior absent, vNext supports multiple historical ended rows and active-only uniqueness.

## G2-3-018-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-35`
- vNext now: `src/db/schema/projects.ts:924-935`
- Fix: Legacy action/status and actorId nullable with actorName snapshot and type; vNext eventType required in fixed enum and actorMembershipId required, actorName/type omitted. Preserve historic non-member actions and actor snapshots using separate history projection.

## G2-3-018-009  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:37-47`
- vNext now: `src/db/schema/projects.ts:930-956`, `src/db/schema/project-audit-staged.ts:65-86`
- Fix: Legacy notes, attachmentUrl, feedback, revisionCount default0; registered vNext projectDeliveryEvents lacks all these; staged schema mirrors but not used. Integrate immutable payload on supported events without unsafe URLs.

## G2-3-018-026  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:28-35`
- vNext now: `src/db/schema/projects.ts:925-929`
- Fix: Legacy event actorId+name+type can represent learner/mentor/admin or legacy system null; vNext actorMembershipId is mandatory and only represents college member. Add system actor/nullable representation for imports while preventing spoof.

## G2-3-018-033  [P1] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-61`
- vNext now: `src/db/schema/projects.ts:852-855`
- Fix: Legacy stores file name,size,MIME/storageKey and additive attachment map; vNext final submissions have attachment JSON and resource-file references but event records no evidence snapshot. Preserve per-revision file identity and ownership.

## G2-3-018-044  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:12-48`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:6-24`
- vNext now: `src/db/schema/projects.ts:914-959`, `src/db/schema/project-audit-staged.ts:65-86`
- Fix: Legacy project_delivery_event has action,status,actor id/name/type,notes,attachmentUrl,feedback,revisionCount; registered vNext technical project_delivery_events narrower, staged file matches old but is not active. Reconcile schema and plan migration without conflicting table names.

## G2-4-018-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy entity is one delivery row per project via unique project_id. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:19-20`; `docs/legacy-source/backend/src/main/resources/db/migration/V81__project_delivery.sql:32-35`)
- vNext now: New project_submissions table supports multiple immutable versions per project. (`src/db/schema/projects.ts:817-829`; `src/db/schema/projects.ts:868-881`)
- Fix: Document one-row revisionCount to immutable versioned history conversion.

## G2-4-018-007  [P1] GAP  facet F03  effort M
- Legacy: Legacy status mixed-case Draft and free varchar60. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:22-23`)
- vNext now: New status enum values DRAFT,SUBMITTED,CHANGES_REQUESTED,APPROVED. (`src/db/schema/projects.ts:826-829`; `src/db/schema/projects.ts:894-897`)
- Fix: Normalize old review/draft status to one canonical enum.

## G2-4-018-008  [P1] GAP  facet F03  effort M
- Legacy: Legacy snapshot TEXT and transient summary alias. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:25-29`)
- vNext now: New summary text required and sourceUrl/demoUrl optional. (`src/db/schema/projects.ts:830-833`)
- Fix: Map snapshot/summary with fallback, preserve long text.
