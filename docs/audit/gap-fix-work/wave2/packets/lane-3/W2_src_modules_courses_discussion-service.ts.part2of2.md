# Work packet (wave 2): edit src/modules/courses/discussion-service.ts (part 2 of 2)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u020-discussions.md

## G2-5-020-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy discussion body and author metadata per lesson `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:17-30`
- vNext now: VNext delivery feed displays message list and highlighted pinned message `src/modules/courses/discussion-service.ts:90-166`
- Fix: Keep lesson-context thread separate; preserve comment section placement.

## G2-5-020-004  [P2] GAP  facet F03  effort M
- Legacy: Legacy fields text, sequence, userName, profileName `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Discussions.java:17-30`
- vNext now: VNext message list shows messageText and current users.displayName `src/modules/courses/discussion-service.ts:102-130`
- Fix: Expose ordered author display and sequence on lesson thread.

## G2-5-020-005  [P2] MISSING  facet F03  effort M
- Legacy: Legacy returns avatar URL from learner/faculty website `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:118-155`
- vNext now: VNext selected fields no profile picture URL `src/modules/courses/discussion-service.ts:102-130`
- Fix: Add safe avatar receipt or fallback initials per old display.

## G2-5-020-006  [P2] MISSING  facet F03  effort M
- Legacy: Legacy returns learner rollNumber and className when resolvable `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:100-117`
- vNext now: VNext delivery message list no rollNumber/className `src/modules/courses/discussion-service.ts:102-130`
- Fix: Project authorized learner academic details for teacher view.

## G2-5-020-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy `fetchDiscussion` native select no ORDER BY `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/DiscussionRepository.java:12-14`
- vNext now: VNext delivery feed DESC timestamp/UUID then reverses current page `src/modules/courses/discussion-service.ts:127-165`
- Fix: Establish explicit legacy display order via sequence/creation time.

## G2-5-020-025  [P2] GAP  facet F10  effort M
- Legacy: Legacy post sanitizes trimmed text preserving newlines `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:39-46`
- vNext now: New schema trims at input and stores messageText `src/modules/courses/discussion-service.ts:33-39`
- Fix: Compare HTML stripping/newline sanitation policies.

## G2-5-020-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy fetch enriches each discussion with user picture/class/roll `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:86-118`
- vNext now: New joins sender users displayName only `src/modules/courses/discussion-service.ts:102-131`
- Fix: Avoid N+1 but project needed fields with privacy guard.

## G2-5-020-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy service unavailable/unknown content gives 503/404 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:41-46`
- vNext now: New active service bound to delivery and page error contract `src/modules/courses/discussion-service.ts:53-88`
- Fix: Surface correct scoped lesson failure with retry.

## G2-5-020-039  [P2] GAP  facet F18  effort M
- Legacy: Legacy displays userName uniqueId and profileName full name `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:65-87`
- vNext now: VNext senderName uses current users.displayName, no unique ID `src/modules/courses/discussion-service.ts:107-120`
- Fix: Preserve identifier and historical name snapshot in lesson thread.

## G2-5-020-040  [P3] GAP  facet F18  effort S
- Legacy: Legacy error phrases 'Authentication required','Lesson content not found' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:42-46`
- vNext now: VNext named CoursesServiceError without identical messages `src/modules/courses/discussion-service.ts:53-88`
- Fix: Map exact legacy copy if old UI caller still expects it.
