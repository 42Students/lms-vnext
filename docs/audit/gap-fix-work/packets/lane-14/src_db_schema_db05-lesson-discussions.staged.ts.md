# Work packet: edit src/db/schema/db05-lesson-discussions.staged.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u020-discussions.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md

## G2-5-020-029  [P0] GAP  facet F11  effort L
- Legacy: Legacy reads client-supplied lesson id but forbids unscoped content `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:41-71`
- vNext now: Staged lesson-content table includes collegeId FK but no registered tenant trigger `src/db/schema/db05-lesson-discussions.staged.ts:1-14,20-32`
- Fix: Register reviewed cross-college/content/offering trigger before runtime writes.

## G2-17-027-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:12-19`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:24-49`
- Fix: Lesson content numeric id + senderId and name snapshot vs staged UUID content+membership and snapshots.

## G2-17-027-025  [P1] MISSING  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:54-71`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:7-12`
- Fix: Per lesson content authorization needs dedicated delivery/course-content membership guard; staged migration explicitly says not runtime-safe.

## G2-17-027-044  [P1] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:26-29`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:4-12`
- Fix: Spring legacy discussion service vs PostgreSQL drafted DB05, staged schema explicitly not safe to import into runtime.

## G2-17-027-046  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:44-59`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:24-77`
- Fix: Numeric discussion/content/user IDs and names/profile snapshots vs UUID lessonContentId/membership, timestamps, attachments/status, no live migration.

## G2-17-027-048  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-94`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:4-12`
- Fix: No registered vNext lesson-content discussion read/post endpoints; staged DB05 explicitly not runtime.

## G2-5-020-007  [P1] GAP  facet F04  effort L
- Legacy: Legacy numeric lessonContentId stored with message `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:17-19`
- vNext now: Registered vNext deliveryId UUID; lesson content link only staged `src/db/schema/discussions.ts:16-27` `src/db/schema/db05-lesson-discussions.staged.ts:20-37`
- Fix: Map lesson content UUID and college scope separately.

## G2-5-020-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy userId int, userName/profileName snapshots `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:22-30`
- vNext now: Registered senderMembershipId UUID/role, name read from users; staged lesson has name snapshots `src/db/schema/discussions.ts:23-39` `src/db/schema/db05-lesson-discussions.staged.ts:28-35`
- Fix: Persist trusted author snapshots for lesson stream and resolve legacy user IDs.

## G2-5-020-045  [P1] GAP  facet F22  effort L
- Legacy: Legacy Discussions int PK inherited, lesson_content_id int, text, sequence, author snapshots, soft delete `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:13-30` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37`
- vNext now: VNext registered classroom table UUID/deliveryId and staged lesson table separate `src/db/schema/discussions.ts:16-77` `src/db/schema/db05-lesson-discussions.staged.ts:20-49`
- Fix: Build dedicated lesson discussion migration and ID/name mapping.
