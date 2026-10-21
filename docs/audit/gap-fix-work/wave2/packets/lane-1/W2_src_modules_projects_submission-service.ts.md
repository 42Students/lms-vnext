# Work packet (wave 2): edit src/modules/projects/submission-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/project-delivery-event.md, docs/audit/gap2/lane-4/project-delivery-model.md

## G2-3-018-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-420`
- vNext now: `src/db/schema/projects.ts:913-959`, `src/modules/projects/submission-service.ts:337-469`
- Fix: Legacy project workspace has GET /submission/history and /delivery/history with ProjectDeliveryEventDTO; vNext project delivery event table records lock/reopen/attachment changes only and activity history lives separately. Add aggregated history endpoint and render in project Delivery tab.

## G2-3-018-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:369-398`
- vNext now: `src/modules/projects/submission-service.ts:337-469`, `src/modules/projects/mentor-final-delivery-decision-service.ts:18-98`
- Fix: Legacy `/submission` alias and `/submission/review` route expose same final delivery/review workflow; vNext versioned projectSubmissions and mentor decision endpoints. Map aliases and deep-link access.

## G2-3-018-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:22-47`
- vNext now: `src/modules/projects/submission-service.ts:298-326`
- Fix: Legacy actor can submit notes/attachment and save draft/history; vNext attachment edit records ATTACHMENTS_CHANGED with generic reason but no before/after filename metadata. Capture safe diff and content fields.

## G2-3-018-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:63-85`
- vNext now: `src/modules/projects/submission-service.ts:406-459`
- Fix: Legacy increments delivery revisionCount per review cycle; vNext projectSubmissions.version increments on new submission and event has no revisionCount. Map revision display and next revision rule.

## G2-3-018-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:382-423`
- vNext now: `src/modules/projects/submission-service.ts:395-407`
- Fix: Legacy unauthorized history returns FORBIDDEN, absent project NOT_FOUND; vNext submission/decision service typed exceptions and latest-only guard. Make history reader accessible for authorized archived deliveries, not just current version.

## G2-3-018-032  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:40-41`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryEventDTO.java:19-21`
- vNext now: `src/db/schema/projects.ts:852-855`, `src/modules/projects/submission-service.ts:409-427`
- Fix: Legacy event includes attachmentUrl and submission file/link state for each revision; vNext attachments JSON is versioned on submission and URL/file grants separated. Add authorized evidence link per history item with signed URL.

## G2-3-018-034  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:394-399`
- vNext now: `src/modules/projects/mentor-final-delivery-decision-service.ts:77-82`, `src/modules/projects/submission-service.ts:463-465`
- Fix: Legacy review/submit callbacks may notify actors via project workspace service; vNext sends Delivery submitted/reviewed in-app notifications. Compare legacy template and recipient rules, avoid duplicate notification on event replay.

## G2-3-018-042  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-420`
- vNext now: `src/modules/projects/submission-service.ts:456-465`, `src/modules/projects/mentor-final-delivery-decision-service.ts:68-90`
- Fix: Legacy mutation writes event ledger and workflow notifications; vNext recorded activity/in-app messages differ from specialized projectDeliveryEvents writes. Wire one producer transaction into unified history.

## G2-4-018-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy nested timeline history presented in ProjectDeliveryDTO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:45-48`)
- vNext now: New delivery events and reviews stored separately and composed by service. (`src/db/schema/projects.ts:913-935`; `src/modules/projects/submission-service.ts:627-667`)
- Fix: Verify UI timeline includes drafts, submit, reviews, reopen, lock and changed attachments.

## G2-4-018-012  [P2] GAP  facet F03  effort L
- Legacy: Legacy JSON attachments maps url,label,fileName,addedById,addedByName,addedAt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New JSONB attachments validated for FILE ownership and TEAM visibility. (`src/db/schema/projects.ts:852-855`; `src/modules/projects/submission-service.ts:159-179`)
- Fix: Preserve attachment labels/actor/time and convert old URL references safely.

## G2-4-018-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy one active delivery per project, repository direct optional lookup. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:13-22`)
- vNext now: New version list ordered by version, one open draft or submitted via partial unique index. (`src/db/schema/projects.ts:868-881`; `src/modules/projects/submission-service.ts:130-157`)
- Fix: Make latest-version selection explicit in list/detail.

## G2-4-018-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy findActiveByProjectIdIn batches delivery for workspace list. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:19-22`)
- vNext now: New listProjectSubmissions returns all project versions and reviews for one project. (`src/modules/projects/submission-service.ts:627-667`)
- Fix: Avoid N+1 over many projects; provide batched current status summary.

## G2-4-018-023  [P2] GAP  facet F05  effort L
- Legacy: Legacy file key suffix scan matches attachment_url/source_url/storage_key/JSON attachments. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:24-35`)
- vNext now: New file ownership lookup uses typed projectResourceFiles by projectId. (`src/modules/projects/submission-service.ts:159-179`)
- Fix: Map imported historic files to exact UUID, avoid suffix-based collisions.

## G2-4-018-038  [P2] GAP  facet F10  effort M
- Legacy: Legacy service reads one delivery by projectId and nested history. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:13-22`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:48-48`)
- vNext now: New listProjectSubmissions retrieves versioned submissions and reviews. (`src/modules/projects/submission-service.ts:627-667`)
- Fix: Compose selected current submission, timeline and review status.

## G2-4-018-039  [P2] GAP  facet F10  effort L
- Legacy: Legacy project workspace controller handles update delivery/submission/review via PUT/POST. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:342-402`)
- vNext now: New create, edit, submit and review service functions are separate. (`src/modules/projects/submission-service.ts:101-112`; `src/modules/projects/submission-service.ts:216-235`; `src/modules/projects/submission-service.ts:337-355`; `src/modules/projects/submission-service.ts:471-483`)
- Fix: Verify route method/payload and idempotent request matching.

## G2-4-018-047  [P2] GAP  facet F12  effort M
- Legacy: Legacy file attachment may be source URL or uploaded file. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:37-61`)
- vNext now: New attachment kinds include FILE and URL references; file must be READY. (`src/modules/projects/submission-service.ts:159-179`)
- Fix: Preserve valid linked materials and review external URL policy.

## G2-4-018-058  [P2] GAP  facet F15  effort M
- Legacy: Legacy delivery DTO stores reviewer names rather than only IDs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:36-47`)
- vNext now: New review FK and notification projects role-scope actor. (`src/db/schema/projects.ts:961-989`; `src/modules/projects/submission-service.ts:582-600`)
- Fix: Expose safe display names on timeline; no contact data.
