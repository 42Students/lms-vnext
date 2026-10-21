# Work packet (wave 2): edit src/components/courses/learner-course-discussion.tsx (part 2 of 2)

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md, docs/audit/gap2/lane-3/l17-u027-discussion-controller.md, docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md

## G2-12-009-072  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:281-302`
- vNext now: `src/components/courses/learner-course-discussion.tsx:76-104`
- Fix: Legacy Router routeChangeStart catches all internal route changes and browser beforeUnload; vNext captures link clicks + beforeUnload, not every navigation source.

## G2-12-009-073  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:23-26`
- vNext now: `src/components/courses/learner-course-discussion.tsx:198-210`
- Fix: Legacy ui.chatPollIntervalMs loaded through client settings; vNext pollIntervalMs prop default15000, platform config source must be traced at call site.

## G2-12-009-081  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:401-469`
- vNext now: `src/components/courses/learner-course-discussion.tsx:541-598`
- Fix: Legacy separate sender-coloured avatar and icon action rail replaced by border bubble message cards; restore visual clone without losing reply.

## G2-17-027-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-94`
- vNext now: `src/components/courses/learner-course-discussion.tsx:395-418`
- Fix: Legacy headless lesson-content comment endpoint powers content-specific thread; vNext full course discussion feed with pinned strip.

## G2-17-027-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:12-19`
- vNext now: `src/components/courses/learner-course-discussion.tsx:625-668`
- Fix: Legacy contentText/sequence/userName/profileName metadata, vNext messageText composer and sender membership identity.

## G2-17-027-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:120-125`
- vNext now: `src/components/courses/learner-course-discussion.tsx:541-569`
- Fix: Legacy profile image, class name and roll number for learner messages; vNext initial avatar, no roll/class in course chat.

## G2-17-027-019  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-94`
- vNext now: `src/components/courses/learner-course-discussion.tsx:625-668`
- Fix: Legacy lesson-content comment input contained in lesson item, vNext delivery composer outside lesson context.

## G2-17-027-035  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:120-125`
- vNext now: `src/components/courses/learner-course-discussion.tsx:541-569`
- Fix: Profile image/avatar and roll/class on old lesson comments vs initial-only badges in new course chat.

## G2-17-027-036  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:13-15`
- vNext now: `src/components/courses/learner-course-discussion.tsx:637-668`
- Fix: Old server uses content-specific text errors; new composer count/aria and Enter send should be compared with actual legacy form.

## G2-17-027-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/DiscussionDTO.java:13-15`
- vNext now: `src/components/courses/learner-course-discussion.tsx:625-668`
- Fix: Legacy phrase Content cannot be empty / cannot exceed 5000 characters missing as typed new composer copy.

## G2-17-027-050  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DiscussionServiceImpl.java:120-125`
- vNext now: `src/components/courses/learner-course-discussion.tsx:541-569`
- Fix: Old profile image, class name and roll missing from new course chat response; decide required privacy fields.

## G2-19-031-104  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:538-545` — Classroom feed role=log, aria-live additions.
- vNext now: `src/components/courses/learner-course-discussion.tsx:464-467` — New focusable region, lacks demonstrated inner live log.
- Fix: Add aria-live message log without noisy reload.

## G2-18-001-087  [P3] GAP  facet F18  effort S
- Legacy: Legacy discussion subtitle `Keep course conversations in one place and follow along easily.` `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:559-564`
- vNext now: vNext description displays course name and section and additional discussion guidance. `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx:22-27`, `src/components/courses/learner-course-discussion.tsx:396-405`
- Fix: Restore subtitle and relocate scoping to helper/breadcrumb.

## G2-2-033-009  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:570-596 icon-only pin strip unpin tooltip
- vNext now: src/components/courses/learner-course-discussion.tsx:431-439 full-width button 'Unpin pinned message'
- Fix: Use compact unpin icon button on desktop with same accessible title.

## G2-2-033-011  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:624-661 TextArea placeholder 'Write a message...'
- vNext now: src/components/courses/learner-course-discussion.tsx:652-675 labelled Textarea with additional Reply context
- Fix: Restore exact placeholder with punctuation and control height.

## G2-2-033-034  [P3] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:373-399 Modal.confirm title 'Delete this message?'
- vNext now: src/components/courses/learner-course-discussion.tsx:441-449 ConfirmDialog same title but adds 'This cannot be undone.'
- Fix: Align confirm description, Cancel/Delete labels/order, backdrop, pending disable.

## G2-2-033-050  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:231-239 preserves last-loaded on refresh failure
- vNext now: src/components/courses/learner-course-discussion.tsx:407-416 same behavior but warning copy/placement differ
- Fix: Place refresh warning above scroll inside feed and keep closable behavior.

## G2-2-033-058  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:647-659 Send and hint 'Enter to send ...' side by side
- vNext now: src/components/courses/learner-course-discussion.tsx:652-679 composer wraps and mobile coarse-pointer safe Enter
- Fix: Clone desktop side-by-side send row and add phone-safe vertical stacking.

## G2-2-033-062  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:563-565 subtitle 'Keep course conversations in one place and follow along easily.'
- vNext now: src/components/courses/learner-course-discussion.tsx:399-403 same for learner, faculty adds 'Guide the class conversation...'
- Fix: For faculty legacy view use exact same subtitle unless separately approved.

## G2-2-033-064  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:648 placeholder 'Write a message...'
- vNext now: src/components/courses/learner-course-discussion.tsx:654-659 uses label 'Write a message'
- Fix: Restore exact dotted placeholder.

## G2-2-033-065  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:599-617 retry button 'Retry'
- vNext now: src/components/courses/learner-course-discussion.tsx:412-415 'Retry discussion refresh'
- Fix: Match Retry button label and icon in refresh banner.

## G2-2-037-019  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:641-661 TextArea max4000, count threshold3400
- vNext now: src/components/courses/learner-course-discussion.tsx:652-679 Textarea with max limit constant
- Fix: Match character count threshold, placeholder, rows and disabled states.

## G2-12-009-008  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:559-564`
- vNext now: `src/components/courses/learner-course-discussion.tsx:398-404`
- Fix: Legacy one-line Keep course conversations in one place and follow along easily; faculty now gets extra Guide the class conversation… description and Students can post questions here anytime.

## G2-12-009-065  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:659-662`
- vNext now: `src/components/courses/learner-course-discussion.tsx:659-664`
- Fix: Legacy Enter to send · Shift+Enter for a new line always; vNext Tap Send to post · Enter adds a new line on phone.
