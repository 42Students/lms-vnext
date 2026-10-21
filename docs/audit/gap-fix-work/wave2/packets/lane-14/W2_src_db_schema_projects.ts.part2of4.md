# Work packet (wave 2): edit src/db/schema/projects.ts (part 2 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/project-release-entity.md, docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-2/admin-project-template-controller.md, docs/audit/gap2/lane-20/project-meeting.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-3/l18-u017-project-member-entity.md

## G2-17-017-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectReleaseRepository.java:15-16 — Active releases ordered sortOrder ascending, ID ascending.
- vNext now: src/db/schema/projects.ts:290-312 — Sequence uniqueness, no shown id tie-break.
- Fix: Use sortOrder sequence mapping and predictable ascending ordering.

## G2-17-017-027  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:47-51 — Stores creator/updater integer IDs.
- vNext now: src/db/schema/projects.ts:276-304 — No createdBy/updatedBy release columns; events record actor separately.
- Fix: Preserve created/updated actor audit in source-of-truth query.

## G2-17-017-031  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectReleaseRepository.java:21-23 — Soft-deleted release key permanently reserved.
- vNext now: src/db/schema/projects.ts:306-309 — Key unique globally per project, deleted records physically removed.
- Fix: Keep old-key reservation only if historical migration needs it.

## G2-2-020-013  [P2] GAP  facet F04  effort M
- Legacy: ProjectWorkspaceDTO.java:9-33 numericId/slug,title,mentor,status,phase,progress,blocker
- vNext now: src/db/schema/projects.ts:150-205 UUID instance plus normalized members
- Fix: Map all former top-level workspace fields into admin response.

## G2-2-020-069  [P2] GAP  facet F22  effort M
- Legacy: ProjectWorkspaceDTO.java:9-73 integer id and rich nested records
- vNext now: src/db/schema/projects.ts:150-230 UUID instance and normalized descendants
- Fix: Provide fully mapped admin read DTO and legacy deep-link resolver.

## G2-2-020-070  [P2] GAP  facet F22  effort M
- Legacy: AdminProjectCreateDTO.java:14-27 title max160 and dueLabel max80
- vNext now: src/db/schema/projects.ts:170-205 title text, dueLabel varchar160
- Fix: Enforce legacy max lengths in chosen service/schema.

## G2-2-021-012  [P2] GAP  facet F04  effort M
- Legacy: ProjectTemplateDTO.java:7-27 id integer,slug,title,summary,courseLabel,status,templateVersion,lifecycleStatus,publishedAt,archivedAt,phase,nested sections
- vNext now: src/db/schema/projects.ts:34-80 template UUID, currentVersion,publishedVersion,status,archivedAt; blueprint version separate
- Fix: Provide read DTO fields incl. courseLabel,phase,dates and resolved sections.

## G2-2-021-066  [P2] GAP  facet F22  effort M
- Legacy: Legacy ProjectTemplateDTO.java:7-27 global template int ID, title, lifecycleStatus, templateVersion
- vNext now: src/db/schema/projects.ts:34-80 UUID projectTemplates + projectTemplateVersions
- Fix: Provide legacy ID deep-link mapping, version/status naming and metadata read model.

## G2-2-021-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy AdminProjectTemplateUpsertDTO.java:16-22 stores nested overview,sprints,tasks,resources,delivery,meetings,activity
- vNext now: src/db/schema/projects.ts:81-145 stores blueprint jsonb per version
- Fix: Map nested authoring sections into validated blueprint and persisted version snapshot.

## G2-20-017-005  [P2] MISSING  facet F03  effort S
- Legacy: Legacy exposes calendarSyncStatus and calendarSyncError in meeting DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingDTO.java:46-47`
- vNext now: No calendar sync status/error in projectMeetings row `src/db/schema/projects.ts:1104-1174`
- Fix: Show meeting-link/manual-scheduling status rather than fake synced indication; document calendar removal

## G2-20-017-006  [P2] GAP  facet F03  effort S
- Legacy: Legacy DTO presents linkedSprintLabel and linkedTaskLabel `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingDTO.java:33-36`
- vNext now: New stores only linkedSprintId and linkedTaskId UUID FKs `src/db/schema/projects.ts:1147-1154`
- Fix: Join sprint/task titles for human-readable meeting chips

## G2-20-017-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy DTO has meetingStatus and status and separate meetingType `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingDTO.java:17-20`
- vNext now: New one status plus meetingType `src/db/schema/projects.ts:1113-1120`
- Fix: Explicitly map duplicate legacy display fields and card badges

## G2-20-017-008  [P2] GAP  facet F04  effort M
- Legacy: meetingDate LocalDate, start/end LocalTime, timezone optional `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:60-69`
- vNext now: startsAt/endsAt timestamptz NOT NULL, timeZone varchar80 NOT NULL `src/db/schema/projects.ts:1123-1131`
- Fix: Convert legacy local date/time in timezone into UTC instants; map missing time zone to explicit IST only with approval

## G2-20-017-010  [P2] GAP  facet F04  effort S
- Legacy: OrganizerId int/name varchar160 stored `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:70-76`
- vNext now: scheduledByUserId UUID, scheduledByMembershipId UUID but no name snapshot `src/db/schema/projects.ts:1138-1146`
- Fix: Resolve current organizer display name and distinguish historical name changes

## G2-20-017-028  [P2] GAP  facet F11  effort S
- Legacy: Legacy createdByType LEARNER/FACULTY differentiates overlapping numeric IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:158-164`
- vNext now: New createdByUserId UUID and optional requester membership / scheduler user `src/db/schema/projects.ts:1133-1163`
- Fix: Retain actor type in timeline display while avoiding ambiguous legacy numeric identities

## G2-20-017-030  [P2] GAP  facet F12  effort S
- Legacy: Legacy status SCHEDULED and calendar sync PENDING by default `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:41-53,150-157`
- vNext now: New status REQUESTED by default, scheduler must provide URL when SCHEDULED `src/db/schema/projects.ts:1113-1115,1204-1207`
- Fix: Differentiate request draft from confirmed meeting and remove fictitious calendar pending

## G2-20-017-031  [P2] GAP  facet F12  effort S
- Legacy: Legacy optional meetingDate/startTime/endTime and timezone `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:60-69`
- vNext now: New requires startsAt/endsAt/timeZone, endsAt>startsAt `src/db/schema/projects.ts:1123-1131,1196-1199`
- Fix: Gate conversion of incomplete legacy meetings with explicit edit-required state

## G2-20-017-033  [P2] GAP  facet F13  effort S
- Legacy: Legacy calendarSyncStatus provides PENDING/SYNCED/FAILED failure state `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:147-157`
- vNext now: New manual meeting URL has no sync states `src/db/schema/projects.ts:1132,1155-1174`
- Fix: Show link unavailable/unset instead of 'synced' and document calendar feature removal

## G2-11-028-043  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:27-30`
- vNext now: `src/db/schema/projects.ts:172-252`
- Fix: Legacy deleted indicator excludes project from normal list, vNext ARCHIVED is one project_instances status alongside PLANNED/ACTIVE/COMPLETED.

## G2-18-017-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-36`
- vNext now: `src/db/schema/projects.ts:652-660`
- Fix: Legacy generic roleLabel and memberStatus ACTIVE, new roleKind/roleLabel/isPrimary/canMutate visible as richer badges.

## G2-18-017-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:26-36`
- vNext now: `src/db/schema/projects.ts:652-681`
- Fix: Legacy `user_type`, `display_name`, `member_status`, `role_label`; vNext role/roleKind/canMutate/isPrimary and time bounds.

## G2-18-017-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-33`
- vNext now: `src/db/schema/projects.ts:659-659`
- Fix: Legacy displayName max160 and roleLabel max80, vNext no snapshot displayName and roleLabel text no same bound.

## G2-18-017-023  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:26-27`
- vNext now: `src/db/schema/projects.ts:703-718`
- Fix: Legacy userType unrestricted string, vNext role and roleKind constraints block observer/reviewer from mutating.

## G2-18-017-024  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:35-39`
- vNext now: `src/db/schema/projects.ts:660-668`
- Fix: Legacy ACTIVE memberStatus and deletedByWorkspace, new active means endedAt is null; status restoration differs.

## G2-18-017-026  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-16`
- vNext now: `src/db/schema/projects.ts:685-692`
- Fix: Legacy permanent unique includes type allowing same user twice across types; new active uniqueness disallows more than one active membership per project.

## G2-18-017-033  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-36`
- vNext now: `src/db/schema/projects.ts:652-660`
- Fix: More role badges and permission controls than old displayName/roleLabel/status produce different widths.

## G2-18-017-036  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:35-36`
- vNext now: `src/db/schema/projects.ts:652-668`
- Fix: Legacy status ACTIVE member string replaced by active/ended and roleKind specific UI copy.

## G2-18-017-043  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:12-18`
- vNext now: `src/db/schema/projects.ts:638-651`
- Fix: Legacy MySQL JPA `project_member`, vNext Postgres project_members and join college_memberships.

## G2-18-017-047  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:41-47`
- vNext now: `src/db/schema/projects.ts:678-681`
- Fix: Legacy bigint `version` replaced by updatedAt, no DB version integer for project_members.

## G2-3-018-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-420`
- vNext now: `src/db/schema/projects.ts:913-959`, `src/modules/projects/submission-service.ts:337-469`
- Fix: Legacy project workspace has GET /submission/history and /delivery/history with ProjectDeliveryEventDTO; vNext project delivery event table records lock/reopen/attachment changes only and activity history lives separately. Add aggregated history endpoint and render in project Delivery tab.

## G2-3-018-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:6-24`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryEventRepository.java:19-20`
- vNext now: `src/db/schema/projects.ts:914-936`, `src/modules/projects/delivery-activity-model.ts:4-18`
- Fix: Legacy single chronological history entry covers action, status, actor display, notes, file URL, feedback, revision and createdAt. VNext stores limited technical event and separate activity. Build combined chronological row projection.

## G2-3-018-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-73`
- vNext now: `src/db/schema/projects.ts:817-855`
- Fix: Legacy final submission/delivery overview shows contributor names with additive attachments and revision, vNext project submission stores attached metadata but technical event lacks actor name/status. Preserve friendly author/time summary rows.

## G2-3-018-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:10-23`
- vNext now: `src/db/schema/projects.ts:923-935`, `src/modules/projects/delivery-activity-model.ts:12-18`
- Fix: Legacy list can label DRAFT_SAVED/SUBMITTED/REVIEWED and actor notes, status; vNext projectDeliveryEvents eventType enum LOCKED/REOPENED/ATTACHMENTS_CHANGED, activity types DRAFT_CREATED/DRAFT_UPDATED/SUBMITTED/REVIEWED/LOCKED. Map to legacy badges and actor context.

## G2-3-018-006  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:31-44`
- vNext now: `src/db/schema/projects.ts:923-935`
- Fix: Legacy records actorName, actorType, feedback, notes and attachmentUrl for each event; vNext technical event stores only membership ID and reason. Hydrate from linked submission/review/activity and retain historical display snapshot.

## G2-3-018-007  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:16-20`
- vNext now: `src/db/schema/projects.ts:917-923`
- Fix: Legacy integer projectId/deliveryId stored directly; vNext UUID projectId/submissionId with composite FK. Provide migration mapping and preserve per-delivery history grouping.

## G2-3-018-010  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:18-23`
- vNext now: `src/db/schema/projects.ts:923-935`
- Fix: Legacy DTO also includes reviewNotes, submissionLink, submissionFileUrl and submissionType and createdAt; vNext event row has no fields. Join versioned projectSubmissions and reviews for complete display.

## G2-3-018-011  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryEventRepository.java:14-20`
- vNext now: `src/db/schema/projects.ts:946-949`
- Fix: Legacy history retrieves by projectId and deliveryId ordered event id DESC regardless isDeleted, vNext event index projectId/occurredAt and no demonstrated delivery history reader. Implement newest-first with occurredAt + id stable tie.

## G2-3-018-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-73`
- vNext now: `src/db/schema/projects.ts:817-959`
- Fix: Legacy parent holds mutable revision_count and events snapshot it; vNext projectSubmissions version and technical event lack revision snapshot. Derive event-linked revision from submission.version.

## G2-3-018-023  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:75-112`
- vNext now: `src/db/schema/projects.ts:817-864`, `src/modules/projects/mentor-final-delivery-decision-service.ts:63-75`
- Fix: Legacy delivery stores submitted/reviewed actor id+name+type and timestamps, vNext stores membership submittedBy and separate review user/membership. Preserve display names on historical snapshots even after profile rename.

## G2-3-018-024  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryEventRepository.java:14-20`
- vNext now: `src/db/schema/projects.ts:913-959`
- Fix: Legacy `findActiveByDeliveryId` misleading name but never filters isDeleted; vNext FK restricts parent delete and event is immutable. Ensure archived project activity/history remains visible.
