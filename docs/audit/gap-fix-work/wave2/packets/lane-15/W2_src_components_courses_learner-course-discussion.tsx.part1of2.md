# Work packet (wave 2): edit src/components/courses/learner-course-discussion.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-2/classroom-controller.md, docs/audit/gap2/lane-2/cross-22-copy-time-accessibility.md, docs/audit/gap2/lane-3/l12-u009-course-classroom-discussion.md

## G2-18-001-013  [P2] GAP  facet F02  effort S
- Legacy: Legacy Discussion contains subtitle, pinned strip, feed, new message chip, composer all in shared canvas. `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:557-673`
- vNext now: vNext inserts separate PageHeader and back action before comparable discussion component. `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx:20-33`, `src/components/courses/learner-course-discussion.tsx:396-462`
- Fix: Avoid duplicate page heading and preserve pinned-strip/feed/composer vertical hierarchy.

## G2-2-033-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:553-569 old page-head sr-only Discussions then subtitle then one content card
- vNext now: src/components/courses/learner-course-discussion.tsx:395-407 top-level heading plus additional small subheading
- Fix: Remove redundant subtitle on learner path and restore old course tab head/card padding.

## G2-2-033-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:570-596 pinned announcement strip above feed
- vNext now: src/components/courses/learner-course-discussion.tsx:418-439 bordered left pin strip with extra time and text button
- Fix: Clone strip border/background, inline pin icon, author/time placement, tiny unpin icon.

## G2-2-033-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:598-617 warning then scroll feed then jump control
- vNext now: src/components/courses/learner-course-discussion.tsx:407-416 warning before pin banner and :466-645 list
- Fix: Match exact section order: pin strip, refresh warning within feed, scrolling log, jump overlay.

## G2-2-033-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:622-662 hint then composer
- vNext now: src/components/courses/learner-course-discussion.tsx:652-675 reply box + form labels/hint
- Fix: Align composer bar, compact send action and fixed location below scroll.

## G2-2-033-008  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:401-461 avatar tint, sender name, role tag, relative time, pin icons
- vNext now: src/components/courses/learner-course-discussion.tsx:534-610 initial avatar, chips, relative date and text actions
- Fix: Match legacy avatar tint algorithm and 5-minute grouped bubble styling.

## G2-2-033-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:439-462 icon Pin/Unpin/Delete on each bubble
- vNext now: src/components/courses/learner-course-discussion.tsx:593-618 text 'Reply','Pin','Delete'
- Fix: Restore legacy icon buttons and tooltips; retain new Reply as extra.

## G2-2-033-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:263-274 polls 15s and uses cursor changed-since
- vNext now: src/components/courses/learner-course-discussion.tsx:49-53 default pollIntervalMs=15000, :198-210 polls GET
- Fix: Keep 15s cadence but avoid re-downloading current page each tick; apply mutation delta.

## G2-2-033-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:650 composer disabled when no scope or initial loadError
- vNext now: src/components/courses/learner-course-discussion.tsx:293-309 learnerDiscussionMayPost with canPost; :652-675
- Fix: Compare disabled message composer state during partial refresh/error and revoked rights.

## G2-2-033-036  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:570-596 pinned banner is not a click control; unpin icon only faculty
- vNext now: src/components/courses/learner-course-discussion.tsx:418-439 banner plus text unpin button when moderate and canPost
- Fix: Remove canPost gate from authorized moderator unpin when read-only moderation permitted; preserve noninteractive banner.

## G2-2-033-049  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:473-510 spinner, load error with Retry, no messages empty state
- vNext now: src/components/courses/learner-course-discussion.tsx:472-509 skeleton, initial retry, no messages empty state
- Fix: Restore legacy spinner type and exact initial error/empty header/card sizing.

## G2-2-033-057  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:557-661 Ant responsive chat shell, pinned strip and composer
- vNext now: src/components/courses/learner-course-discussion.tsx:395-679 responsive utility classes: sm:px-3, md:max-h-[34rem]
- Fix: Compare 320/375/768/1280 screenshot for panel height, pinned strip and composer stacking.

## G2-2-033-060  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:445-460 aria-label Pin/Unpin/Delete this message
- vNext now: src/components/courses/learner-course-discussion.tsx:591-614 text actions
- Fix: Give accessible item-specific names and restore icon tooltips.

## G2-2-033-067  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:263-274 15sec conditional polling with update cursor
- vNext now: src/components/courses/learner-course-discussion.tsx:198-210 timer polls and list page endpoint
- Fix: Fetch updates only or use ETag/updatedAt to avoid repeated first-page load.

## G2-2-033-074  [P2] GAP  facet F21  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:263-274 settings.chatPollIntervalMs may override 15sec
- vNext now: src/components/courses/learner-course-discussion.tsx:49-53 pollIntervalMs prop, :205 clipped to 5-120sec
- Fix: Wire tenant chat polling setting or explicitly deprecate it.

## G2-2-037-035  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:475-510 initial spinner/empty/error
- vNext now: src/components/courses/learner-course-discussion.tsx:470-512 skeleton, Retry and empty state
- Fix: Match legacy skeleton/spinner/Retry copy/empty-state layout.

## G2-12-009-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:156-172`
- vNext now: `src/components/courses/learner-course-discussion.tsx:49-57`
- Fix: Legacy Classroom tab uses Redux selectedCourseId plus resolved class assignment; vNext mounts LearnerCourseDiscussion for immutable courseSectionDeliveryId.

## G2-12-009-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:557-570`
- vNext now: `src/components/courses/learner-course-discussion.tsx:395-418`
- Fix: Legacy nested learn-projects-detail page-head+body/content; vNext generic `min-w-0 space-y-4` and border-y surface, verify canvas padding.

## G2-12-009-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:570-599`
- vNext now: `src/components/courses/learner-course-discussion.tsx:418-439`
- Fix: Legacy pinned strip with PushpinFilled icon and optional unpin beside message; vNext border-l primary tinted section with unpin below.

## G2-12-009-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:599-665`
- vNext now: `src/components/courses/learner-course-discussion.tsx:462-675`
- Fix: Legacy scroll and composer use plain `ln-classroom` skins; vNext explicit border-y region, gradient scroll hints, form border and responsive flex.

## G2-12-009-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:401-469`
- vNext now: `src/components/courses/learner-course-discussion.tsx:527-599`
- Fix: Legacy avatar beside bubble+icon action rail and minimal grouped rows; vNext all text inside bordered left/right message bubbles, actions as text links.

## G2-12-009-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:575-592`
- vNext now: `src/components/courses/learner-course-discussion.tsx:419-436`
- Fix: Legacy pinned banner shows PushpinFilled and Pinned by below body; vNext author/count line above message plus separate timestamp.

## G2-12-009-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:425-435`
- vNext now: `src/components/courses/learner-course-discussion.tsx:549-569`
- Fix: Legacy name+5-minute grouped senders and Tag Faculty/Pinned with relative tooltip; vNext StatusBadge and circular initial inside message bubble.

## G2-12-009-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:438-465`
- vNext now: `src/components/courses/learner-course-discussion.tsx:574-594`
- Fix: Legacy icon-only Pin/Unpin/Delete action with Tooltip and aria-label, vNext word buttons Reply/Pin/Delete.

## G2-12-009-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:644-662`
- vNext now: `src/components/courses/learner-course-discussion.tsx:637-668`
- Fix: Legacy show character count only after >3400; vNext always shows `N/3900`, with phone-specific Tap Send hint.

## G2-12-009-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:41-58`
- vNext now: `src/components/courses/learner-course-discussion.tsx:551-556`
- Fix: Legacy hashes sender ID into eight deterministic pastel avatar palettes; vNext only 3 tone families and one initial based on role/self.

## G2-12-009-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:72-82`
- vNext now: `src/components/courses/learner-course-discussion.tsx:44-47`
- Fix: Legacy relative timestamps derive from legacy timezone/date utils and user locale; vNext learnerDiscussionRelativeTimeLabel may use IST/format differences.

## G2-12-009-019  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:201-225`
- vNext now: `src/components/courses/learner-course-discussion.tsx:128-155`
- Fix: Legacy initial GET unbounded full course/class history; vNext 60 newest + explicit older pagination and reconcile, safer for large classes.

## G2-12-009-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:197-199`
- vNext now: `src/components/courses/learner-course-discussion.tsx:212-218`
- Fix: Legacy first pinned message from entire list, vNext separately gets highlightedPinned query even when old pinned outside page.

## G2-12-009-023  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:638-643`
- vNext now: `src/components/courses/learner-course-discussion.tsx:644-653`
- Fix: Legacy Enter posts regardless of pointer; vNext mobile coarse pointer uses Enter newline, desktop Enter send, preserves IME.

## G2-12-009-034  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:281-301`
- vNext now: `src/components/courses/learner-course-discussion.tsx:450-460`
- Fix: Legacy routeChangeStart unsent draft native confirm while navigating; vNext intercepts in-app links with ConfirmDialog but not necessarily programmatic navigation.

## G2-12-009-035  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:441-463`
- vNext now: `src/components/courses/learner-course-discussion.tsx:574-598`
- Fix: Legacy Pin/Delete direct tooltip buttons, vNext text actions and reply flow, moving deletion dialog access.

## G2-12-009-048  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:471-500`
- vNext now: `src/components/courses/learner-course-discussion.tsx:469-489`
- Fix: Legacy loading central Spin and scopeReady false Discussion unavailable, vNext skeleton 3 rows and may show read-only Past semester if canPost false.

## G2-12-009-049  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:503-534`
- vNext now: `src/components/courses/learner-course-discussion.tsx:490-513`
- Fix: Faculty empty body copy truncated from Learners are far more likely to post... to Welcome your class or share the week's focus.

## G2-12-009-050  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:601-610`
- vNext now: `src/components/courses/learner-course-discussion.tsx:407-415`
- Fix: Legacy closable Ant Alert Discussion refresh failed with separate stale-state description; vNext Alert without visible closable x.

## G2-12-009-051  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:495-500`
- vNext now: `src/components/courses/learner-course-discussion.tsx:670-673`
- Fix: Legacy no class assignment is Discussion unavailable with explicit linkage explanation; vNext can indicate Past semester/read-only but route gate may prevent rendering.

## G2-12-009-056  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:599-665`
- vNext now: `src/components/courses/learner-course-discussion.tsx:462-468`
- Fix: VNext scroll viewport min56dvh mobile and max34rem desktop; legacy ln-classroom-scroll height from SCSS not verified to match.

## G2-12-009-057  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:644-662`
- vNext now: `src/components/courses/learner-course-discussion.tsx:644-668`
- Fix: VNext mobile coarse-pointer changes Enter behavior and full-width Send button, legacy one consistent key hint.

## G2-12-009-060  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:440-461`
- vNext now: `src/components/courses/learner-course-discussion.tsx:576-594`
- Fix: Legacy icon button aria-label Pin this message / Delete this message and tooltips; vNext text controls with visible labels, no identical focused hover affordance.

## G2-12-009-067  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Classroom/classroom.js:203-229`
- vNext now: `src/components/courses/learner-course-discussion.tsx:198-205`
- Fix: Legacy delta polling transfers updatedAt changes only; vNext poll fetches newest page snapshot repeatedly every ~15s.
