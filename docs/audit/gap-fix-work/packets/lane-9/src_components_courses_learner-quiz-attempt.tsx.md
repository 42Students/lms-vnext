# Work packet: edit src/components/courses/learner-quiz-attempt.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-021  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1040-1065`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:53-66`; `src/components/courses/learner-quiz-attempt.tsx:494-518`
- Fix: Legacy supports `Word`, `Description` and misspelled `Discription` input types; new payload/types cover only SINGLE_CHOICE/MULTIPLE_CHOICE. Confirm legacy data migration is intentionally omitted, and gate unsupported legacy links.

## G2-3-003-033  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:11-20`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:39-52`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:131-151`; `src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts:14-32`
- Fix: Legacy `/api/v1/quizzes/:id/attempt`, `/my-submissions`; vNext uses scoped GET quiz and own attempts with mandatory deliveryId; repair bookmarked old `/quiz?quizId=` lacking deliveryId via scope resolve.

## G2-3-003-034  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:12-24`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:513-531`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:301-313`; `src/modules/courses/quiz-validation.ts:235-243`
- Fix: Legacy sends `shownQuestionIds` list to reject assessment changed mid-attempt; vNext does not send/validate it because published content is immutable. Confirm immutable guarantee and error mapping before declaring parity.

## G2-3-003-037  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:188-190`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:330-340`
- vNext now: `src/modules/courses/quiz-attempt-service.ts:129-167`; `src/components/courses/learner-quiz-attempt.tsx:131-151`
- Fix: Legacy allows faculty preview via effective role and includes correct answers; new learner page does not branch by teacher and requires learner access. Restore teacher preview elsewhere with explicit permission.

## G2-3-003-038  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:256-264`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:126-129`
- Fix: Legacy storage key scopes to user/role/college/org/class, vNext scopes only quizId and deliveryId. Verify account-switch same-browser draft isolation, ensure membership/user partition.

## G2-3-003-058  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:256-295`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:126-129`; `src/components/courses/learner-quiz-attempt.tsx:211-218`
- Fix: New draft storage key does not include account/college membership; revise to protect against cross-login stale answers and quizId collision.

## G2-3-003-023  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/quiz.js:35-62`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:348-357`; `src/app/quiz/error.tsx:1-11`
- Fix: Legacy boundary shows exact `Something went wrong`, explanatory paragraph plus `Try Again`, `Refresh page`, `Back to quizzes`; vNext load error omits Refresh page and changes back label.

## G2-3-003-024  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:466-481`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:265-274`
- Fix: Restore exact legacy expiry toast title `Deadline passed` and explanation `This quiz deadline has passed. Your answers cannot be submitted now.`; new inline error text differs.

## G2-3-003-025  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:465-470`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:131-138`
- Fix: Legacy missing quiz warns `Cannot submit`/`Quiz not loaded. Open the quiz from the syllabus or quiz list.`; new incomplete-link warning differs.

## G2-3-003-027  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:558-566`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1081-1089`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:329-340`; `src/components/courses/learner-quiz-attempt.tsx:392-392`
- Fix: Legacy preserves submitError and notification with concrete server message + `Quiz was not submitted`; new submit catch drops server cause and uses generic network error. Surface sanitized specific status/codes.

## G2-3-003-028  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:484-493`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:442-446`
- Fix: Legacy gives separate `Unanswered Questions` notification on Submit and submits immediately; vNext unifies warning into ConfirmDialog with mandatory second action.

## G2-3-003-029  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:399-403`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:348-355`
- Fix: Legacy API load error emits bottom-right `Server Notification`; vNext in-page alert with retry. Restore surface placement/copy if strict UI parity.
