# Work packet (wave 2): edit src/db/schema/db05-lesson-discussions.staged.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l17-u027-discussion-controller.md, docs/audit/gap2/lane-5/u020-discussions.md

## G2-17-027-027  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:54-72`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:64-70`
- Fix: Legacy content class/course fallback, staged FK content and parent same-content constraints require mapping.

## G2-17-027-043  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:45-59`
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:56-70`
- Fix: Legacy sequence field user supplied with no parent, staged parentDiscussionId and status require migration to avoid orphan reply semantics.

## G2-5-020-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy contentText nullable, no length in entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:19-21`
- vNext now: Registered messageText required 1–4000 chars; staged lesson text 1–5000 `src/db/schema/discussions.ts:37-51,77-80` `src/db/schema/db05-lesson-discussions.staged.ts:43-68`
- Fix: Choose explicit lesson max and expose error text before posting.

## G2-5-020-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy sequence int supplied by caller `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:20-23`
- vNext now: Registered delivery chat has chronological createdAt, no sequence; staged lesson has int sequence default0 `src/db/schema/discussions.ts:38-51` `src/db/schema/db05-lesson-discussions.staged.ts:38-41`
- Fix: Preserve sequence ordering/deduplication for lesson discussion list.

## G2-5-020-031  [P2] GAP  facet F12  effort M
- Legacy: Legacy sequence integer allows arbitrary client provided order `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:20-23`
- vNext now: Staged lesson sequence default0, runtime delivery has no sequence `src/db/schema/db05-lesson-discussions.staged.ts:36-40`
- Fix: Validate sequence bounds/sort stability for migrated content.
