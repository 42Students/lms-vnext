# Work packet: edit src/db/schema/projects.ts (part 4 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-delivery-model.md, docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/u017-project-template-version.md

## G2-4-018-010  [P1] GAP  facet F03  effort L
- Legacy: Legacy file_name255, file_size Long, mime_type160, storage_key string on delivery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-50`)
- vNext now: New attachments JSON plus projectResourceFiles references and signed-grant UI. (`src/db/schema/projects.ts:852-855`; `src/components/projects/project-delivery-file-uploader.tsx:27-47`)
- Fix: Migrate file metadata to verified project resource file records.

## G2-4-018-019  [P1] GAP  facet F04  effort M
- Legacy: Legacy LocalDateTime timestamps omit timezone. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:65-121`)
- vNext now: New timestamptz columns for submitted/locked/created/updated. (`src/db/schema/projects.ts:841-865`)
- Fix: Define IST conversion for historic naive timestamps.

## G2-4-018-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy entity has JPA @Version on Long for optimistic mutation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- vNext now: New draft revisions checked by updatedAt and row locks; DB has version ordinal. (`src/modules/projects/submission-service.ts:19-20`; `src/db/schema/projects.ts:826-827`)
- Fix: Ensure draft token uses ms precision and rejects stale writes without overwriting.

## G2-4-018-041  [P1] GAP  facet F10  effort M
- Legacy: Legacy optional projectId unique row can be soft deleted and replaced. (`docs/legacy-source/backend/src/main/resources/db/migration/V81__project_delivery.sql:5-7`; `docs/legacy-source/backend/src/main/resources/db/migration/V81__project_delivery.sql:33-35`)
- vNext now: New version rows retain history and one open partial unique constraint. (`src/db/schema/projects.ts:868-881`)
- Fix: Document undo/reopen and soft-delete lifecycle to avoid duplicate active drafts.

## G2-4-018-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy one row status Draft and reviewStatus free-text. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:22-23`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:87-88`)
- vNext now: New four status enum with one open DRAFT/SUBMITTED. (`src/db/schema/projects.ts:894-908`)
- Fix: Map Draft/Submitted/Under review/Changes requested/Locked to schema.

## G2-4-018-046  [P1] GAP  facet F12  effort L
- Legacy: Legacy revisionCount tracks number of revisions, not separate row versions. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-64`)
- vNext now: New version integer starts1, prior rows retained. (`src/db/schema/projects.ts:826-829`; `src/db/schema/projects.ts:886-889`)
- Fix: Define ordinal migration and history reconstruction.

## G2-4-018-067  [P1] GAP  facet F20  effort M
- Legacy: Legacy JPA @Version Long null for new record to guarantee persist. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- vNext now: New project submission row version is business ordinal with updatedAt revision CAS. (`src/db/schema/projects.ts:826-827`; `src/modules/projects/submission-service.ts:19-20`)
- Fix: Do not confuse ordinal with optimistic token; test concurrent edit races.

## G2-4-018-072  [P1] GAP  facet F22  effort L
- Legacy: Legacy project_delivery PK int, unique projectId, status String, snapshot TEXT, various actor name/id/type columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:19-129`)
- vNext now: New project_submissions UUID PK/version, member FK, JSON attachments and separate review/event tables. (`src/db/schema/projects.ts:817-910`; `src/db/schema/projects.ts:913-989`)
- Fix: Create field-by-field transformation mapping and historical row version plan.

## G2-4-018-073  [P1] GAP  facet F22  effort L
- Legacy: Legacy MySQL file metadata added in later migrations to original V81 schema. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-53`; `docs/legacy-source/backend/src/main/resources/db/migration/V81__project_delivery.sql:1-35`)
- vNext now: New typed resource files and attachment JSONB, no project_delivery table. (`src/db/schema/projects.ts:817-855`)
- Fix: Verify migration or explicitly no-data-parity decision without losing active records.

## G2-4-018-074  [P1] GAP  facet F22  effort M
- Legacy: Legacy soft delete per delivery via BaseModel and finder excludes isDeleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:13-22`)
- vNext now: New submitted rows are historical version records, no isDeleted field. (`src/db/schema/projects.ts:817-910`)
- Fix: Specify delete/archive compliance and hidden history vs retention.

## G2-4-017-006  [P1] GAP  facet F02  effort L
- Legacy: Legacy entity has overview and templateSnapshot as distinct JSON fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:87-105`)
- vNext now: New project instance has authoredBrief, templateVersionId, no literal overview/templateSnapshot columns. (`src/db/schema/projects.ts:181-210`)
- Fix: Map mutable workspace overview and pinned template snapshot to new brief/version.

## G2-4-017-008  [P1] GAP  facet F03  effort M
- Legacy: Legacy status default IN_PROGRESS, free text length40. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:31-32`)
- vNext now: New status PLANNED default, constrained to PLANNED/ACTIVE/COMPLETED/ARCHIVED. (`src/db/schema/projects.ts:195-198`; `src/db/schema/projects.ts:249-252`)
- Fix: Map IN_PROGRESS and historical status tokens into new enum.

## G2-4-017-017  [P1] GAP  facet F04  effort L
- Legacy: Legacy templateId nullable and templateSnapshot JSON nullable. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:79-91`)
- vNext now: New project requires templateId AND templateVersionId and stores materialized related rows. (`src/db/schema/projects.ts:181-190`; `src/modules/projects/instance-service.ts:259-275`)
- Fix: Support historical manual template-less projects if parity required; pin snapshot.

## G2-4-017-018  [P1] GAP  facet F04  effort M
- Legacy: Legacy recoverableContent Boolean defaultfalse for soft-deleted workspace. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-95`)
- vNext now: New projectInstances has archivedAt not recoverableContent field. (`src/db/schema/projects.ts:219-233`)
- Fix: Define recoverability and restored resource behavior after archive.

## G2-4-017-026  [P1] GAP  facet F06  effort L
- Legacy: Legacy classId integer optional editable in update DTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:73-74`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectWorkspaceUpdateDTO.java:44-48`)
- vNext now: New sectionId UUID optional selection from scoped classes. (`src/components/projects/college-project-summary-editor-full.tsx:81-86`; `src/db/schema/projects.ts:202-202`)
- Fix: Map classId to Section and account for multiple Sections per legacy Class.

## G2-4-017-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy status defaults IN_PROGRESS, progress0, sprint4 and unit POINTS. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:31-56`)
- vNext now: New status PLANNED, progress0, nullable sprint and POINTS default. (`src/db/schema/projects.ts:195-208`)
- Fix: Decide changed lifecycle/defaults and prevent unintended draft state.

## G2-4-017-049  [P1] GAP  facet F12  effort M
- Legacy: Legacy recoverableContent false default helps determine deleted restore eligibility. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:93-95`)
- vNext now: New archiveAt is a date marker with no recoverability field. (`src/db/schema/projects.ts:219-233`)
- Fix: Distinguish archived recoverable state and non-recoverable deletions.

## G2-4-017-070  [P1] GAP  facet F22  effort L
- Legacy: Legacy project_workspace uses integer base ID, org/college/class numeric references, version Long and nullable template. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:13-125`)
- vNext now: New project_instances uses UUID PK, college FK, templateVersion FK, sectionId, updatedAt CAS. (`src/db/schema/projects.ts:172-233`)
- Fix: Write full legacy-to-new column mapping and relationship constraints.

## G2-5-017-007  [P1] GAP  facet F04  effort L
- Legacy: Legacy fields templateId,templateVersion,actionType,lifecycleStatus,changedBy,changedAt,notes,snapshotJson `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:14-35`
- vNext now: New version has templateId/version,title,summary,blueprint,changeNote,createdByUserId,createdAt `src/db/schema/projects.ts:81-115`
- Fix: Build explicit migration map for actionType/lifecycleStatus/snapshotJson/actor/time.

## G2-5-017-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy snapshotJson stores complete template state, including lifecycle `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:31-35`
- vNext now: New blueprint is project content, lifecycle is parent template status/publishedVersion `src/db/schema/projects.ts:24-41,90-99`
- Fix: Define rollback/migration policy for pre-publish, archived and deleted state.
