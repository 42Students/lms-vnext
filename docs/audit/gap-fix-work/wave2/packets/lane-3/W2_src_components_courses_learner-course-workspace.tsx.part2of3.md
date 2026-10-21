# Work packet (wave 2): edit src/components/courses/learner-course-workspace.tsx (part 2 of 3)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md, docs/audit/gap2/lane-18/syllabus-liveclass.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-16/u008-learner-syllabus.md

## G2-17-008-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:111-146 — Header, notes, material list, completion footer in order.
- vNext now: src/components/courses/learner-course-workspace.tsx:165-340 — More status, dates, links and progress before materials.
- Fix: Use legacy Resource hierarchy without losing new states.

## G2-17-008-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/Course/Syllabus/ContentTitle.jsx:50-109 — Content type pill icon, title and audience (shared vs class).
- vNext now: src/components/courses/learner-course-workspace.tsx:165-200 — Generic status type; no audience pill.
- Fix: Render Resource type badge and audience chip.

## G2-17-008-077  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:108-145 — Supports plain notes and sanitized HTML notes with Interweave.
- vNext now: src/components/courses/learner-course-workspace.tsx:206-210 — Only plaintext notes.
- Fix: Render sanitized historical HTML and preserve while editing.

## G2-18-008-001  [P2] GAP  facet F01  effort M
- Legacy: Old live viewer is an imported syllabus content component, not standalone route (`syllabus/liveclass.js:57-66`); launched from Learning Path content row (`syllabus.js:1174-1207`).
- vNext now: New learner item opens LearnerRoadmapItemDialog from course workspace, kind Content (`learner-roadmap-item-dialog.tsx:9-40`; `learner-course-workspace.tsx:160-164`).
- Fix: Keep legacy Learning Path row/modal entry without introducing separate page; verify anchor/deeplink handling.

## G2-18-008-003  [P2] GAP  facet F02  effort L
- Legacy: Old live view root `ln-live-view`, header actions, large date/status card, join block, learner footer in order (`syllabus/liveclass.js:124-227`).
- vNext now: New generic ContentCard displays badges/title/notes/progress, starts/ends lines, Info callout, actions and progress (`learner-course-workspace.tsx:160-340`).
- Fix: Rebuild live-specific card anatomy and legacy section ordering within content dialog.

## G2-18-008-004  [P2] GAP  facet F02  effort M
- Legacy: Old live view header shows ContentTitle badge/title and ContentAddedDate on right (`syllabus/liveclass.js:125-155`).
- vNext now: New heading uses generic enum badge, progress state, title, order index; no added-date in content card (`learner-course-workspace.tsx:165-204`).
- Fix: Render old type/title/added-on layout and hide generic order badge in modal.

## G2-18-008-005  [P2] GAP  facet F02  effort M
- Legacy: Old large live session card with left date tile and status/time/provider (`syllabus/liveclass.js:157-183`).
- vNext now: New separate StatusBadge and simple Starts/Ends paragraph (`learner-course-workspace.tsx:223-235`; `learner-live-session-status.tsx:15-25`).
- Fix: Use legacy date tile + status panel, typography, teal border and provider line.

## G2-18-008-006  [P2] GAP  facet F02  effort M
- Legacy: Old join block has guidance paragraph, icon-only Copy and primary large Join button (`syllabus/liveclass.js:185-214`).
- vNext now: New third-party link and secondary Copy text button, no guidance in normal available state (`learner-live-class-link.tsx:30-38`; `learner-course-workspace.tsx:294-295`).
- Fix: Restore join panel copy/icon/layout and primary CTA.

## G2-18-008-011  [P2] MISSING  facet F03  effort S
- Legacy: Old provider displays `on Zoom` / `on Google Meet` etc (`syllabus/liveclass.js:15-28,181`).
- vNext now: New doesn't display provider in event card, only URL link (`learner-course-workspace.tsx:223-295`; `learner-live-class-link.tsx:34-38`).
- Fix: Add safe hostname-based provider label.

## G2-18-008-013  [P2] GAP  facet F04  effort S
- Legacy: Old date tile month abbreviated, day number, weekday, from start_date else start_time (`syllabus/liveclass.js:90-99,157-163`).
- vNext now: New only Starts/Ends string and status (`learner-course-workspace.tsx:223-235`).
- Fix: Render date tile with MMM/D/ddd and fallback.

## G2-18-008-014  [P2] GAP  facet F04  effort S
- Legacy: Old time row formats `dddd, DD MMM YYYY · h:mm A – h:mm A` with Clock icon (`syllabus/liveclass.js:170-180`).
- vNext now: New formats `Starts ... · Ends ...` (`learner-course-workspace.tsx:230-235`).
- Fix: Apply exact old weekday, date, AM/PM time line.

## G2-18-008-016  [P2] GAP  facet F04  effort S
- Legacy: Old ContentTitle learner audience badge `Shared with your class` or `For your class` (`ContentTitle.jsx:55-57,94-109`).
- vNext now: New content card has type/progress badges, no audience scope badge (`learner-course-workspace.tsx:165-204`).
- Fix: Add shared vs delivery-specific audience badge with old wording/colors.

## G2-18-008-020  [P2] GAP  facet F06  effort M
- Legacy: Old Join Meeting button clickable if link present and learner session has not ended (`syllabus/liveclass.js:73-79,110-112,185-214`).
- vNext now: New ThirdPartyLink only when sanitized published URL and not ended (`learner-course-workspace.tsx:223-250,294-295`; `learner-live-class-link.tsx:16-38`).
- Fix: Preserve pre-start join, expired disabling, improve exact button visual.

## G2-18-008-023  [P2] GAP  facet F06  effort M
- Legacy: Old faculty can delete via icon, learners cannot; faculty can rejoin after session end (`syllabus/liveclass.js:69-71,110-112,132-151`).
- vNext now: New learner-only workspace and no delete action in content view (`learner-course-workspace.tsx:160-340`).
- Fix: Implement equivalent faculty-side viewer permissions without giving learners delete.

## G2-18-008-038  [P2] GAP  facet F11  effort M
- Legacy: Old `isFacultyRole` true for FACULTY or ADMIN, so faculty always join/delete, learner only Mark as complete (`syllabus/liveclass.js:67-71,110-112,132-151,221-225`).
- vNext now: New learner service strictly ACTIVE membership LEARNER and content UI only learner (`learner-course-service.ts:57-69`; `learner-course-workspace.tsx:330-339`).
- Fix: Use role-specific shared viewer or verify separate faculty component matches controls.

## G2-18-008-039  [P2] GAP  facet F11  effort M
- Legacy: Old learner progress control disabled when `progressUnavailable`, with tooltip retry state (`syllabus/liveclass.js:221-225`; `MarkCompleteButton.jsx:13-18,44-47`).
- vNext now: New ResourceProgressControl gated by canMarkComplete/readOnly, no progressUnavailable tooltip (`learner-course-workspace.tsx:330-339`; `resource-progress-control.tsx:71-81`).
- Fix: Disable with legacy reason when progress cannot be verified, expose retry.

## G2-18-008-054  [P2] GAP  facet F16  effort M
- Legacy: Old Live card CSS uses `ln-live-view__date`, `__info`, `__join-actions` (modal modifier) (`syllabus/liveclass.js:124-183`).
- vNext now: New utility classes with flexible wrapping and standalone badges (`learner-course-workspace.tsx:160-204`; `learner-live-class-link.tsx:34-38`).
- Fix: Match mobile date-card stacking, join button width, 44px controls and modal spacing via legacy SCSS.

## G2-18-008-058  [P2] GAP  facet F17  effort M
- Legacy: Old mark-complete button disabledReason exposed in title when progressUnavailable (`MarkCompleteButton.jsx:13-18,44-47`).
- vNext now: New click control only rendered when canMarkComplete and !readOnly (`learner-course-workspace.tsx:330-339`).
- Fix: Expose disabled state and retry explanation instead of silent omission.

## G2-18-008-071  [P2] GAP  facet F23  effort M
- Legacy: Old Live status may show `Scheduled` with no start when link available (`syllabus/liveclass.js:114-121,185-214`).
- vNext now: New scheduled release note/generic warning and server availability gating (`learner-course-workspace.tsx:238-252`; `learner-live-link-availability-model.ts:12-20`).
- Fix: Preserve legacy scheduled-but-joinable semantics where link published, including missing start time.

## G2-15-031-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:60-78`
- vNext now: `src/components/courses/learner-course-workspace.tsx:57-79`
- Fix: Legacy lesson groups/pill filters vs new learner roadmap progress and groups.

## G2-15-031-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:121-128`
- vNext now: `src/components/courses/learner-course-workspace.tsx:39-53`
- Fix: Legacy flexible lessonContent DTO/ordering vs normalized vNext lesson structures.

## G2-15-031-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-99`
- vNext now: `src/components/courses/learner-course-workspace.tsx:100-113`
- Fix: Legacy roadmap content filters and selected chips vs new roadmap labels.

## G2-15-031-025  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:52-64`
- vNext now: `src/components/courses/learner-course-workspace.tsx:26-35`
- Fix: Legacy SubmitAssignmentModal DrawerWidget+discard confirm vs inline submission controls.

## G2-15-031-027  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:26-36`
- vNext now: `src/components/courses/learner-course-workspace.tsx:17-35`
- Fix: Legacy lesson content drawers and view modal vs mounted lesson controls.

## G2-15-031-035  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:121-128`
- vNext now: `src/components/courses/learner-course-workspace.tsx:57-79`
- Fix: Old completion counts vs new progress unknown until trackable items.

## G2-15-031-047  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:52-64`
- vNext now: `src/components/courses/learner-course-workspace.tsx:26-35`
- Fix: Mobile legacy assignment drawer vs inline form navigation.

## G2-16-008-003  [P3] GAP  facet F01  effort S
- Legacy: `syllabus.js:59-80`: roadmap and blueprint mode labels share component, faculty version differs.
- vNext now: `learner-course-workspace.tsx:601-615`: learner-only workspace with readOnly flag; faculty uses separate components.
- Fix: Scope page-copy comparison to learner roadmap; parity with faculty blueprint is a different route.

## G2-16-008-010  [P3] GAP  facet F03  effort S
- Legacy: `syllabus.js:970-1004`: current lesson badge Continue here and completion status/count.
- vNext now: `learner-course-workspace.tsx:864-881`: same Continue here/completion badges, different hierarchy.
- Fix: Match row badge tone and order/count string.

## G2-16-008-014  [P3] GAP  facet F04  effort S
- Legacy: `syllabus.js:995-1000`: heading uses `lessonName` fallback `Untitled lesson`.
- vNext now: `learner-course-workspace.tsx:854-856`: uses provided lesson.name without local fallback.
- Fix: Apply fallback `Untitled lesson` for missing names.

## G2-16-008-049  [P3] GAP  facet F13  effort S
- Legacy: `syllabus.js:1116-1121`: filtered-empty lesson differentiates filtering vs no content.
- vNext now: `learner-course-workspace.tsx:918-922`: generic empty for all but lectures.
- Fix: Set type-specific empty as legacy.

## G2-16-008-052  [P3] GAP  facet F15  effort S
- Legacy: `syllabus.js:516,545-561`: Ant notification bottom-right for access states.
- vNext now: `learner-course-workspace.tsx:693-708`: inline Alert for warnings, no bottom-right notification.
- Fix: Match notification surface where legacy uses toast.

## G2-16-008-059  [P3] GAP  facet F18  effort S
- Legacy: `syllabus.js:60-69`: `Learning Path`, `No roadmap items yet`, `Back to Learning Path`.
- vNext now: `learner-course-workspace.tsx:682-712,906-909`: hidden Learning Path title, same empty/back text.
- Fix: Make title hierarchy and placement visible as legacy.

## G2-16-008-061  [P3] GAP  facet F18  effort S
- Legacy: `syllabus.js:1095-1108`: badges `Missed`, `Ended`, `Not submitted`, `% watched`.
- vNext now: `learner-course-workspace.tsx:180-196,387-391`: inside card `Overdue`, `Ended`, progress.
- Fix: Use exact list-row badge terms.

## G2-17-008-008  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Course/Syllabus/ContentTitle.jsx:119-134 — Added date shown as small grey 11px string.
- vNext now: src/components/courses/learner-course-workspace.tsx:165-203 — Sequence shown, no date.
- Fix: Display same added-date metadata.

## G2-17-008-015  [P3] MISSING  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/Course/Syllabus/ContentTitle.jsx:12-31 — Date handles string and numeric date array in en-GB.
- vNext now: src/components/courses/learner-course-workspace.tsx:165-203 — No date rendering.
- Fix: Add date helper with invalid-date fallback.

## G2-18-008-007  [P3] GAP  facet F03  effort S
- Legacy: Old icon `VideoCameraOutlined` before Live session label or type badge (`syllabus/liveclass.js:4-8,126-130`; `ContentTitle.jsx:34-45`).
- vNext now: New prints generic `LIVE CLASS` badge (`learner-course-workspace.tsx:167-170`).
- Fix: Use legacy video camera icon and `Live Class`/`Live session` labels.

## G2-18-008-012  [P3] MISSING  facet F03  effort M
- Legacy: Old added date rightmost subtle 11px en-GB date (`ContentTitle.jsx:13-31,119-135`; `syllabus/liveclass.js:153`).
- vNext now: New content card no added date (`learner-course-workspace.tsx:165-204`).
- Fix: Display createdAt in old date format/style if service returns field.

## G2-18-008-015  [P3] MISSING  facet F04  effort S
- Legacy: Old positive session length shows `N min` (`syllabus/liveclass.js:98-100,170-177`).
- vNext now: New no standalone duration (`learner-course-workspace.tsx:230-235`).
- Fix: Calculate end.diff(start,'minute'), render when >0.

## G2-18-008-044  [P3] GAP  facet F12  effort S
- Legacy: Old minutes between start/end includes positive N minute duration (`syllabus/liveclass.js:98-100,174-177`).
- vNext now: New content only Starts/Ends; does not compute/show minute duration (`learner-course-workspace.tsx:230-235`).
- Fix: Render integer duration, suppress negative/zero.

## G2-18-008-047  [P3] GAP  facet F13  effort S
- Legacy: Old missing meeting URL shows `No meeting link available yet. The link will appear here once the session is scheduled.` (`syllabus/liveclass.js:215-218`).
- vNext now: New `No meeting link available yet. Check back before the session starts.` (`learner-course-workspace.tsx:226-229`).
- Fix: Restore exact no-link text and layout.
