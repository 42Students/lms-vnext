# Work packet (wave 3): edit src/db/schema/db05-lesson-discussions.staged.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u020-discussions.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md

## G2-5-020-049  [P0] MISSING  facet F23  effort L
- Legacy: Legacy lesson stream is used live by `/api/v1/discussion/*` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-93`
- vNext now: New dedicated lesson table unregistered staged with no runtime API `src/db/schema/db05-lesson-discussions.staged.ts:1-18`
- Fix: Complete DB05 lesson discussion migration + live routes + parity before declaring done.

## G2-19-031-129  [P1] MISSING  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:18-29` — Legacy discussions lessonContentId and sequence.
- vNext now: `src/db/schema/db05-lesson-discussions.staged.ts:24-75` — vNext lesson-content table is staged, not primary live discussion.
- Fix: Promote safe migration/service for per-lesson threads.

## G2-5-020-002  [P1] MISSING  facet F01  effort L
- Legacy: Legacy unit serves lesson content discussion under course lessons `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:13-19`
- vNext now: VNext classroom delivery discussion distinct from lesson-specific staged table `src/db/schema/db05-lesson-discussions.staged.ts:1-18`
- Fix: Register and integrate lesson_content_discussions after DB05 tenant guard acceptance.
