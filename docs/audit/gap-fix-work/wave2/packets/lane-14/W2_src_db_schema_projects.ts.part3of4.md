# Work packet (wave 2): edit src/db/schema/projects.ts (part 3 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/project-delivery-event.md, docs/audit/gap2/lane-4/project-delivery-model.md, docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-3-018-027  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-26`
- vNext now: `src/db/schema/projects.ts:950-953`, `src/modules/projects/delivery-activity-model.ts:4-18`
- Fix: Legacy free-text action/status length60 accommodates revision/review variants; vNext technical enum only three transitions and activity separate five. Define explicit mapping table for every source action.

## G2-3-018-028  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:46-47`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-64`
- vNext now: `src/db/schema/projects.ts:826-829`, `923-935`
- Fix: Legacy revisionCount starts0 and increases per resubmission, vNext project submission version starts1 and event does not store count. Display legacy 0-based revision semantics, avoid off-by-one.

## G2-3-018-029  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:37-44`
- vNext now: `src/db/schema/projects.ts:930-956`
- Fix: Legacy notes/feedback may be empty, vNext reason required nonblank ≤4000 and feedback stored on projectSubmissionReviews. Split public feedback and private audit reason without losing values.

## G2-3-018-032  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:40-41`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:19-21`
- vNext now: `src/db/schema/projects.ts:852-855`, `src/modules/projects/submission-service.ts:409-427`
- Fix: Legacy event includes attachmentUrl and submission file/link state for each revision; vNext attachments JSON is versioned on submission and URL/file grants separated. Add authorized evidence link per history item with signed URL.

## G2-3-018-039  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryEventRepository.java:19-20`
- vNext now: `src/db/schema/projects.ts:946-949`
- Fix: Legacy lookup indexed/ordered by event id DESC (monotonic int), vNext timestamp index by project but not composite project/submission/time. Add index matching frequent per-submission history query.

## G2-3-018-045  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryEventRepository.java:14-20`
- vNext now: `src/db/schema/projects.ts:946-959`
- Fix: Legacy event query keyed projectId+deliveryId, vNext event key projectId+submissionId, timestamp index only project. Add composite FK/index and consistent event order.

## G2-4-018-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy delivery DTO combines main snapshot, status, notes, attachments, review and history. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:9-48`)
- vNext now: New projectSubmissions plus projectSubmissionReviews and delivery events split these sections. (`src/db/schema/projects.ts:817-865`; `src/db/schema/projects.ts:913-935`; `src/db/schema/projects.ts:961-989`)
- Fix: Rebuild unified read projection preserving legacy section order.

## G2-4-018-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy schema has status Draft, snapshot, notes, feedback and primary attachment. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:22-38`)
- vNext now: New submission schema has status DRAFT and summary/sourceUrl/demoUrl/notes/attachments. (`src/db/schema/projects.ts:826-855`)
- Fix: Map snapshot/summary and primary attachment without losing historic values.

## G2-4-018-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy nested timeline history presented in ProjectDeliveryDTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:45-48`)
- vNext now: New delivery events and reviews stored separately and composed by service. (`src/db/schema/projects.ts:913-935`; `src/modules/projects/submission-service.ts:627-667`)
- Fix: Verify UI timeline includes drafts, submit, reviews, reopen, lock and changed attachments.

## G2-4-018-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy notes and feedback independent TEXT columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:31-35`)
- vNext now: New notes on submission and feedback on separate review row. (`src/db/schema/projects.ts:833-833`; `src/db/schema/projects.ts:961-989`)
- Fix: Retain latest feedback and review history in visible detail.

## G2-4-018-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy source_url and attachment_url each TEXT. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:37-53`)
- vNext now: New sourceUrl/demoUrl and array attachments, no primary attachmentUrl column. (`src/db/schema/projects.ts:830-855`)
- Fix: Preserve legacy primary links as labeled attachment entries.

## G2-4-018-012  [P2] GAP  facet F03  effort L
- Legacy: Legacy JSON attachments maps url,label,fileName,addedById,addedByName,addedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New JSONB attachments validated for FILE ownership and TEAM visibility. (`src/db/schema/projects.ts:852-855`; `src/modules/projects/submission-service.ts:159-179`)
- Fix: Preserve attachment labels/actor/time and convert old URL references safely.

## G2-4-018-013  [P2] GAP  facet F03  effort M
- Legacy: Legacy revisionCount starts0. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-64`)
- vNext now: New submission version starts at1 and each new approved revision creates next version. (`src/db/schema/projects.ts:826-827`; `src/db/schema/projects.ts:886-889`)
- Fix: Map revision count to version and display ordinal consistently.

## G2-4-018-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy draftSavedAt/byId/byName separate columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:66-73`)
- vNext now: New draft createdByMembershipId and createdAt/updatedAt; no named draftSavedAt column. (`src/db/schema/projects.ts:834-841`; `src/db/schema/projects.ts:856-865`)
- Fix: Use scoped actor name snapshot and last draft-save time in DTO projection.

## G2-4-018-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy submittedAt/byId/byName/byType. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:75-85`)
- vNext now: New submittedAt and submittedByMembershipId, role derived via membership. (`src/db/schema/projects.ts:841-848`)
- Fix: Preserve display identity safely and account for exited learner memberships.

## G2-4-018-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy reviewStatus,reviewedAt,reviewedById/Name/Type. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:87-100`)
- vNext now: New review decision/feedback/actor/time in projectSubmissionReviews table. (`src/db/schema/projects.ts:961-989`)
- Fix: Merge most recent review into legacy-like summary and preserve history.

## G2-4-018-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy lastUpdatedAt/byId/Name/Type. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:102-112`)
- vNext now: New updatedAt and events with actor membership; actor name not in submission row. (`src/db/schema/projects.ts:861-865`; `src/db/schema/projects.ts:923-935`)
- Fix: Expose last actor/time via audit projection without leaking contacts.

## G2-4-018-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy lockedAt/byId/byName. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:114-121`)
- vNext now: New lockedAt and delivery event actor, no explicit lockedBy fields. (`src/db/schema/projects.ts:849-855`; `src/db/schema/projects.ts:913-935`)
- Fix: Resolve locker display from immutable event.

## G2-4-018-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy one active delivery per project, repository direct optional lookup. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:13-22`)
- vNext now: New version list ordered by version, one open draft or submitted via partial unique index. (`src/db/schema/projects.ts:868-881`; `src/modules/projects/submission-service.ts:130-157`)
- Fix: Make latest-version selection explicit in list/detail.

## G2-4-018-027  [P2] GAP  facet F06  effort M
- Legacy: Legacy draft no mandatory summary annotation at entity level. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:25-29`)
- vNext now: New summary NOT NULL and required in projectSubmissions. (`src/db/schema/projects.ts:830-830`)
- Fix: Support blank historical drafts while validating new substantive submission.

## G2-4-018-043  [P2] GAP  facet F11  effort M
- Legacy: Legacy submittedByType can represent learner/admin/mentor historic author. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:83-85`)
- vNext now: New submittedByMembershipId FK no explicit role snapshot. (`src/db/schema/projects.ts:841-848`)
- Fix: Preserve original actor role where historically important.

## G2-4-018-054  [P2] GAP  facet F14  effort L
- Legacy: Legacy JSON attachments may contain many links/files with attribution. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New submission JSONB attachments and signed fileID grant. (`src/db/schema/projects.ts:852-855`; `src/components/projects/project-delivery-file-uploader.tsx:27-47`)
- Fix: Preserve URL/label/addedBy/addedAt on legacy import.

## G2-4-018-058  [P2] GAP  facet F15  effort M
- Legacy: Legacy delivery DTO stores reviewer names rather than only IDs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:36-47`)
- vNext now: New review FK and notification projects role-scope actor. (`src/db/schema/projects.ts:961-989`; `src/modules/projects/submission-service.ts:582-600`)
- Fix: Expose safe display names on timeline; no contact data.

## G2-4-018-066  [P2] GAP  facet F19  effort M
- Legacy: Legacy one delivery row can grow JSON attachments without server page cap. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New creates version rows plus JSON attachments and review history. (`src/db/schema/projects.ts:817-855`; `src/db/schema/projects.ts:961-989`)
- Fix: Bound attachments and history rendering for large teams.

## G2-4-018-069  [P2] GAP  facet F20  effort M
- Legacy: Legacy reviewStatus can have spaces and capitalization variation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:87-88`)
- vNext now: New strict upper-case enum and reviewer decisions. (`src/db/schema/projects.ts:894-897`)
- Fix: Normalize status synonyms and trim before migration.

## G2-4-018-075  [P2] GAP  facet F22  effort M
- Legacy: Legacy ProjectDeliveryEvent has per-review actor name/type, feedback and revisionCount. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:16-47`)
- vNext now: New delivery events store eventType,actorMembershipId,reason; reviews separate. (`src/db/schema/projects.ts:913-989`)
- Fix: Restore timeline fields from event+review joins.

## G2-4-017-004  [P2] GAP  facet F02  effort L
- Legacy: Legacy scalar workspace summary, overview, sprints, tasks, resources, delivery, meetings in DTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceDTO.java:11-54`)
- vNext now: New project schema splits projectInstances and related typed tables, authoredBrief JSON. (`src/db/schema/projects.ts:172-210`)
- Fix: Verify complete tab/section composition and visual order across old vs new.

## G2-4-017-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy workspace title required length160, slug unique length80. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:19-23`)
- vNext now: New title text, slug96, unique lower(slug) within college. (`src/db/schema/projects.ts:192-195`; `src/db/schema/projects.ts:234-238`)
- Fix: Define validation and global-vs-college slug conflicts.

## G2-4-017-009  [P2] GAP  facet F03  effort S
- Legacy: Legacy progress integer defaults0. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:37-38`)
- vNext now: New progressPercent smallint not null default0 with 0-100 constraint. (`src/db/schema/projects.ts:198-199`; `src/db/schema/projects.ts:256-256`)
- Fix: Clamp/flag out-of-range legacy progress; preserve UI percentages.

## G2-4-017-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy blocker and nextAction unrestricted TEXT. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:58-62`)
- vNext now: New text columns with editor maxLength4000. (`src/db/schema/projects.ts:203-204`; `src/components/projects/college-project-summary-editor-full.tsx:98-101`)
- Fix: Handle >4000 historic text instead of silent truncation.

## G2-4-017-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy sprintLengthWeeks initialized4. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:46-50`)
- vNext now: New integer nullable with no DB default and editor blank when null. (`src/db/schema/projects.ts:207-208`; `src/components/projects/college-project-summary-editor-full.tsx:27-28`)
- Fix: Default new workspace sprint length4 unless approved nullable.

## G2-4-017-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy repo counts all active templates and live-linked snapshots for rollback warning. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectWorkspaceRepository.java:179-205`)
- vNext now: New templateVersionId immutable pin; no live-linked snapshot pointer in projectInstances. (`src/db/schema/projects.ts:181-190`)
- Fix: Explain new snapshot semantics and avoid misleading rollback blast-radius warning.

## G2-4-017-043  [P2] GAP  facet F11  effort M
- Legacy: Legacy workspace has organizationId and collegeId, classId and createdBy. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:67-80`)
- vNext now: New collegeId FK, createdByUserId UUID; organization resolved through college. (`src/db/schema/projects.ts:175-180`; `src/db/schema/projects.ts:210-214`)
- Fix: Document organization derivation and ensure every scoped query cross-checks tenant.

## G2-4-017-062  [P2] GAP  facet F18  effort M
- Legacy: Legacy recovery field named recoverableContent, readinessOverrideNote. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-117`)
- vNext now: New readiness state lives in events and archive uses archivedAt. (`src/modules/projects/readiness-override-service.ts:16-27`; `src/db/schema/projects.ts:219-233`)
- Fix: Match old restore/readiness support messaging while preserving new policy.

## G2-4-017-072  [P2] GAP  facet F22  effort M
- Legacy: Legacy slug global unique length80. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:19-20`)
- vNext now: New per-college case-insensitive slug unique length96. (`src/db/schema/projects.ts:192-193`; `src/db/schema/projects.ts:235-239`)
- Fix: Document changed unique scope and code validation.

## G2-5-017-041  [P2] GAP  facet F19  effort M
- Legacy: Legacy V160 sort index fixed MySQL out-of-sort-memory for large snapshots `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-11`
- vNext now: New index on templateId,version only `src/db/schema/projects.ts:104-113`
- Fix: Prove Postgres index satisfies ORDER BY and avoids materializing all blueprints.

## G2-5-029-039  [P2] GAP  facet F10  effort M
- Legacy: Legacy after POST uses created integer ID, `/{id}/overview`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:135-140`
- vNext now: vNext UUID ID in separate PG table, root detail navigation. `src/components/projects/super-admin-template-create-form.tsx:24-26`, `src/db/schema/projects.ts:26-36`
- Fix: Preserve old deep-link ID map where migrated data is used.

## G2-7-019-093  [P2] GAP  facet F22  effort S
- Legacy: ProjectWorkspace.java:119-125 JPA optimistic version long
- vNext now: projects.ts:228-231 updatedAt timestamp; archive-control.tsx:35-39 token
- Fix: Prove timestamp CAS supports same conflict semantics and precision as Java version.

## G2-7-020-107  [P2] GAP  facet F22  effort L
- Legacy: ProjectWorkspace.java:93-105 recoverableContent and overview JSON
- vNext now: projects.ts:209 authoredBrief, :220 archivedAt, no recoverable_content
- Fix: Preserve recoverability metadata in data migration/spec

## G2-20-017-009  [P3] GAP  facet F04  effort S
- Legacy: meetingKey max120 and title max200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:23-33`
- vNext now: No key; title unconstrained text `src/db/schema/projects.ts:1107-1122`
- Fix: Define title max200 client/server and compatibility slug mapping
