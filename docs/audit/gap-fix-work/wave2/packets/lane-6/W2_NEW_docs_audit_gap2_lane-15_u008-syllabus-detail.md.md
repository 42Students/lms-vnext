# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-15/u008-syllabus-detail.md

17 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u008-syllabus-detail.md

## G2-15-008-006  [P2] GAP  facet F02  effort L
- Legacy: Old one-column full-width `ln-lesson-content-list` with per-item content (syllabusDetail.js:384-409)
- vNext now: VNext roadmap nested Lesson disclosure/content/assignment/quiz group and per-item dialog (learner-course-workspace.tsx:778-970)
- Fix: Flatten selected lesson item stream in authored order without requiring repeated modal open

## G2-15-008-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy content type icons FileText/Play/Form/Youtube/VideoCamera and tags (`N Resource`,`N Quiz`) (syllabusDetail.js:44-76,291-309)
- vNext now: VNext StatusBadge type uppercase normalized, progress status and `#sequence` (learner-course-workspace.tsx:160-205)
- Fix: Restore AntD type icons and exact title-case singular labels/count tags

## G2-15-008-008  [P2] GAP  facet F03  effort S
- Legacy: Legacy `N item(s)` count before content type tags, vertical bar separator (syllabusDetail.js:291-311)
- vNext now: VNext total course lesson/item overview metrics, no selected-lesson count header (learner-course-workspace.tsx:710-762)
- Fix: Add selected-lesson item count and tags in header, use proper singular/plural

## G2-15-008-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy completed state left of each item via ContentCompletionCheck (syllabusDetail.js:384-398)
- vNext now: VNext progress StatusBadge within content/assignment/quiz cards (learner-course-workspace.tsx:168-194,373-392,517-535)
- Fix: Show checked circle at row left with equivalent completion status/tooltip

## G2-15-008-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy locked row with LockOutlined icon, `Content locked`, reason (syllabusDetail.js:390-404)
- vNext now: VNext SCHEDULED/ENDED badges and text, item no hidden external href before start (learner-course-workspace.tsx:157-160,188-195,226-252)
- Fix: Match explicit `Content locked` icon/reason for not-yet-actionable items

## G2-15-008-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy bottom Next lesson primary button and Previous text buttons (syllabusDetail.js:412-427)
- vNext now: VNext roadmap item Open › buttons, not same previous/next lesson CTA (learner-roadmap-item-dialog.tsx:22-39)
- Fix: Restore explicit Previous lesson/Next lesson controls

## G2-15-008-013  [P2] GAP  facet F04  effort S
- Legacy: Content title accepts `contentTitle`, `content_title`, data.title else `Untitled content` (syllabusDetail.js:60-65)
- vNext now: VNext typed content.title shown, no fallback in card (learner-course-workspace.tsx:197-199)
- Fix: Keep `Untitled content` when imported record title missing

## G2-15-008-033  [P2] GAP  facet F09  effort L
- Legacy: Legacy resource/video/assignment/quiz child viewers inline, no wrapper modal per item (syllabusDetail.js:517-552,384-409)
- vNext now: VNext `LearnerRoadmapItemDialog` opens modal with content and own caption/progress (learner-roadmap-item-dialog.tsx:9-44)
- Fix: Restore inline detail content card; optionally keep modal when chosen by user

## G2-15-008-034  [P2] GAP  facet F09  effort M
- Legacy: Legacy previous/next controls are buttons directly navigating lessons (syllabusDetail.js:265-281,412-427)
- vNext now: VNext modal opens per item and filter/focus controls, no same next lesson button (learner-course-workspace.tsx:601-624,778-970)
- Fix: Add close-and-previous/next lesson navigation with correct focus restoration

## G2-15-008-037  [P2] GAP  facet F10  effort M
- Legacy: Legacy sort merges quiz content after GET; dispatches Redux TotalSequence count (syllabusDetail.js:451-470)
- vNext now: VNext workspace items ordered from DB, no Redux TotalSequence mutation (learner-course-workspace.tsx:620-669,778-970)
- Fix: Validate authoring+legacy sequence parity; remove Redux reliance only if all actions use IDs

## G2-15-008-042  [P2] GAP  facet F12  effort S
- Legacy: Legacy `Next` button not available last lesson based `lastIndex`, previous only when currentLessonIndex>0 (syllabusDetail.js:270-280)
- vNext now: VNext overview has no previous/next lesson disabled boundary controls (learner-course-workspace.tsx:778-970)
- Fix: Add boundary-aware previous/next controls without navigating out of course

## G2-15-008-045  [P2] GAP  facet F13  effort S
- Legacy: Legacy content loading `Loading lesson content…`, empty `No lesson content yet` (syllabusDetail.js:358-371)
- vNext now: VNext emptyState from learnerRoadmapEmptyState, message `Create lessons and add content to show the learner roadmap` (learner-course-workspace.tsx:616-617,683-691)
- Fix: Distinguish empty selected lesson vs entire roadmap and use exact legacy empty copy

## G2-15-008-052  [P2] GAP  facet F16  effort M
- Legacy: Legacy Full view never needs modal per item (syllabusDetail.js:384-409)
- vNext now: VNext dialogs constrain scroll, with full-width Open controls (learner-roadmap-item-dialog.tsx:22-40)
- Fix: Allow inline item expansion on phone or owner-approved modal with equal reading continuity

## G2-15-008-057  [P2] MISSING  facet F18  effort S
- Legacy: Legacy unsupported copy `This content type isn't supported yet`, `Contact your instructor if this looks wrong.` (syllabusDetail.js:553-559)
- vNext now: VNext lacks unknown-type visible diagnostic (learner-course-workspace.tsx:121-132,134-344)
- Fix: Show exact unsupported message for unknown enum values

## G2-15-008-059  [P2] GAP  facet F19  effort L
- Legacy: Legacy per-lesson list no pagination, only selected lesson, on-demand refresh (syllabusDetail.js:213-231,384-409)
- vNext now: VNext all roadmap lessons and nested items rendered for every course route (learner-course-workspace.tsx:691-1019)
- Fix: Lazy-load/paginate large lesson sets or render selected lesson first while preserving all accessibility

## G2-15-008-063  [P2] GAP  facet F21  effort L
- Legacy: Legacy quizServices plus courseServices and video/youtube/liveclass integrations (syllabusDetail.js:3-13,517-551)
- vNext now: VNext type-specific signed file, embedded playback, ThirdPartyLink and quiz attempt controls (learner-course-workspace.tsx:253-340,584-590)
- Fix: Audit YouTube/live-session safe URL, embargo and progress event order with legacy children

## G2-15-008-067  [P2] GAP  facet F23  effort L
- Legacy: Legacy details inline, navigation top/bottom, selected lesson bar, faculty drawer (syllabusDetail.js:265-439)
- vNext now: VNext full-course roadmap with filters, item modal, progress summary and authoring separately (learner-course-workspace.tsx:601-1019)
- Fix: Treat full-roadmap as additive and restore selected-lesson experience when user chooses a lesson
