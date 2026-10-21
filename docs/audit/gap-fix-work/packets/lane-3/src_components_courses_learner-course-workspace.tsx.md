# Work packet: edit src/components/courses/learner-course-workspace.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u008-syllabus-detail.md, docs/audit/gap2/lane-16/u008-learner-syllabus.md, docs/audit/gap2/lane-18/syllabus-liveclass.md

## G2-15-008-016  [P1] GAP  facet F04  effort L
- Legacy: Legacy uses courseId+classId for quiz filtering and lessonId, merges quiz list (syllabusDetail.js:451-466)
- vNext now: VNext workspace returns deliveryId/lesson and separate quiz records (courseTab/page.tsx:58-65,125-135; learner-course-workspace.tsx:641-668)
- Fix: Provide legacy course/class quiz-to-lesson mapping including authored per-class order

## G2-15-008-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy numeric LessonId/courseId/classId, contentType string aliases, lesson content progress map keyed content ID (syllabusDetail.js:54-76,143-149,451-470,494-515)
- vNext now: VNext UUID delivery/lesson/content, enums, separate assignments/quizzes and per-content progress (courseTab/page.tsx:37-44,58-66; learner-course-workspace.tsx:134-600)
- Fix: Write migration crosswalk and reference integrity proof for authored ordering and completion

## G2-15-008-068  [P1] GAP  facet F23  effort M
- Legacy: Legacy unknown/completion errors fail visible with Retry while preserving content (syllabusDetail.js:338-367,473-478)
- vNext now: VNext typed content and server render may lose local recovery path (courseTab/page.tsx:58-66; learner-course-workspace.tsx:691-1019)
- Fix: Add failure-specific error boundary, completeness warning and unsupported content card

## G2-16-008-036  [P1] GAP  facet F09  effort M
- Legacy: `syllabus.js:580-589`: close content triggers progress quiz and assignment reload.
- vNext now: `learner-course-workspace.tsx:930-977`: server data state snapshot; dialog close does not automatically refetch all three categories.
- Fix: Refresh course metrics/progress on modal close after quiz/assignment/video completion.

## G2-16-008-044  [P1] GAP  facet F12  effort M
- Legacy: `syllabus.js:1057-1107`: past-due unsubmitted assignment `Not submitted`, remains reviewable.
- vNext now: `learner-course-workspace.tsx:359-365,387-391`: overdue shows `Overdue`, closed control by dueAt.
- Fix: Restore `Not submitted` row label and review path even after submission closes.

## G2-16-008-065  [P1] GAP  facet F20  effort M
- Legacy: `syllabus.js:769-827`: deepLinkKeyRef prevents reopening same modal after re-fetch.
- vNext now: `learner-course-workspace.tsx:931-943`: dialog key based on URL/current focus can reset on navigation.
- Fix: Consume focus once per URL and respect user-closed dialog after route refresh.

## G2-16-008-073  [P1] GAP  facet F23  effort M
- Legacy: `syllabus.js:1054-1109`: lock/expired/missed/live status clearly signaled in collapsed row.
- vNext now: `learner-course-workspace.tsx:925-977`: content status mostly inside expanded cards.
- Fix: Surface row badges and disabled states before click.

## G2-16-008-030  [P2] GAP  facet F07  effort S
- Legacy: `syllabus.js:788-819`: unavailable deep-linked item notification `Content locked` or `Lesson not found`.
- vNext now: `learner-course-workspace.tsx:700-708`: inline Alerts `Lesson not found`/`Content unavailable`.
- Fix: Preserve correct error copy and bottom-right notification vs inline as owner chooses.

## G2-16-008-029  [P3] GAP  facet F07  effort S
- Legacy: `syllabus.js:917-933`: partial failure lists quiz list/assignment completion/content progress and Retry state.
- vNext now: `learner-course-workspace.tsx:693-698`; `learner-course-service.ts:878,965`: stateWarnings+Retry, same intent.
- Fix: Use exact legacy warning wording incl `completion/counts may be incomplete`, and component-specific retry.

## G2-16-008-031  [P3] GAP  facet F08  effort S
- Legacy: `syllabus.js:545-561`: locked click toast `Content locked`/`Content unavailable`, bottomRight duration5.
- vNext now: `learner-course-workspace.tsx:699-708,925-944`: inline Alert or disabled item behavior, no equivalent click toast.
- Fix: Restore consistent locked/content-unavailable notice placement/duration.

## G2-16-008-032  [P3] GAP  facet F08  effort S
- Legacy: `syllabus.js:813-820`: failed deep link `Lesson not found` bottomRight duration5.
- vNext now: `learner-course-workspace.tsx:700-703`: persistent inline `Lesson not found. ...`.
- Fix: Match toast and exact fallback description.

## G2-16-008-033  [P3] GAP  facet F08  effort S
- Legacy: `syllabus.js:1117-1121`: empty filtered lesson renders conditional `No lectures in this lesson.` etc.
- vNext now: `learner-course-workspace.tsx:918-922`: lectures special case; all other filters generic `No lesson content yet`.
- Fix: Render filter-specific `No resources/assessments/live sessions in this lesson.`.

## G2-18-008-024  [P3] GAP  facet F07  effort S
- Legacy: Old no link clicking Join creates warning `The meeting link isn't available yet.` when handler invoked (`syllabus/liveclass.js:73-79`).
- vNext now: New link action absent and no-link inline `No meeting link available yet. Check back before the session starts.` (`learner-course-workspace.tsx:226-229`).
- Fix: Show old no-link copy and warning only for attempted action.
