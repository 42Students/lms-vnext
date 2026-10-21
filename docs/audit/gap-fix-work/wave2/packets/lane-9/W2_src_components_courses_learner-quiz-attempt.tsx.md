# Work packet (wave 2): edit src/components/courses/learner-quiz-attempt.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:657-677`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:433-493`
- Fix: Legacy has left question-status side rail plus main quiz panel, new order/placement uses lower rail until lg 1024px. Reconcile desktop left width, divider, and breakpoint.

## G2-3-003-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:883-944`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:447-469`
- Fix: Legacy progress bar comes before step count and question-type badge; vNext places step/due/answered counters before MetricBar. Match exact hierarchy and label positions.

## G2-3-003-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:945-960`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:493-505`
- Fix: Legacy question form occupies col-md-8 and uses card class; new custom heading and option cards fill available width. Match grid/spacing and 768px proportions.

## G2-3-003-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:907-940`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:447-450`; `src/components/courses/learner-quiz-attempt.tsx:433-441`
- Fix: Restore separate Back (first question only), Close (all steps), and phone Questions header button; vNext uses one Back action and aside navigation.

## G2-3-003-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/leftpanel.js:15-45`
- vNext now: `src/app/quiz/page.tsx:10-15`; `src/components/courses/learner-quiz-attempt.tsx:471-490`
- Fix: Legacy status rail has 130×40 logo linked or cancel-button role-specifically; vNext uses textual All Quizzes outside the rail, no logo. Restore logo and role semantics if strict clone.

## G2-3-003-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/leftpanel.js:49-83`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:471-490`
- Fix: Restore `Quiz`/title header, `Progress` label, per-row `Question N`, X pts and checkmark indicator; new numbered square navigation omits per-question points.

## G2-3-003-011  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:892-905`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:451-469`
- Fix: Restore exact `N / Total` with question type badge (`Single choice`,`Multiple choice`), not question/attempt counters substituted.

## G2-3-003-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:987-1005`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:500-518`
- Fix: Legacy single-choice options have letter prefixes `a.`, `b.` and two columns from md; vNext unlettered full-width bordered stacked choices. Match option labels and column structure.

## G2-3-003-013  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1013-1036`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:500-518`
- Fix: Legacy multiple-choice Checkbox.Group uses responsive wrapped array; new one-per-row input card. Clone checkbox area and group semantics.

## G2-3-003-014  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1146-1148`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:344-361`
- Fix: Restore `No Quiz Found` empty copy for valid empty/invalid quiz, while preserving explicit new incomplete-link error.

## G2-3-003-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:753-812`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:363-429`
- Fix: Legacy review has hero metrics Score, Attempt/Questions and Submitted timestamp; new review primarily a sentence and card list. Rebuild metric-strip detail.

## G2-3-003-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:860-871`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:414-421`
- Fix: Legacy correct/selected/incorrect three badges including red Incorrect; vNext only `Your answer` and `Correct`, no Incorrect tag. Restore incorrect badge logic post-release.

## G2-3-003-017  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:660-668`; `docs/legacy-source/frontend/src/components/Quiz/leftpanel.js:49-87`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:471-491`
- Fix: Legacy question status rows are tall list with checkmark and points, new multi-column numeric grid. Match row markup and mobile navigation treatment.

## G2-3-003-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1110-1143`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:556-564`
- Fix: Legacy first-step Previous omitted, not disabled; vNext always renders disabled Previous causing footer layout divergence.

## G2-3-003-020  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:975-984`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:493-501`
- Fix: Legacy question label uses sanitized HTML Markup; vNext renders raw prompt string, losing formatted question text and images/tables. Add safe rich display render preserving allowlist.

## G2-3-003-030  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1151-1163`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:435-441`
- Fix: Legacy cancel confirmation has heading `Are you sure you want to cancel this quiz?` and `Yes`/`No`; vNext uses Cancel quiz? / Leave quiz and different body.

## G2-3-003-031  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1229-1245`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:471-491`
- Fix: Legacy at <=767px opens full-width right-hand `Question Status` drawer, vNext always embeds navigation aside. Rebuild phone drawer with active question focus/close semantics.

## G2-3-003-032  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1165-1226`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:363-429`
- Fix: Legacy faculty preview has submissions modal width 720 with avatar, score pill and status; vNext `/quiz` is learner-only, faculty-specific preview needs route parity decision.

## G2-3-003-036  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:43-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:145-153`
- vNext now: `src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts:14-32`; `src/components/courses/learner-quiz-attempt.tsx:131-151`
- Fix: Legacy fetch own submission history with quizId only, new requires deliveryId; ensure old review URLs resolve correct current delivery rather than hard failure.

## G2-3-003-039  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:151-156`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:104-109`
- Fix: Legacy supports `review=true`, `embed=roadmap` and allowlisted `returnTo`; vNext handles review flag only and ignores embedded postMessage return contract.

## G2-3-003-043  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:330-404`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:131-204`
- Fix: Legacy retries token refresh for embedded roadmap before deciding faculty vs learner; new standalone quiz no embedded auth refresh path. Test expired iframe sessions and avoid wrong-role requests.

## G2-3-003-044  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:677-680`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1146-1148`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:344-361`
- Fix: Legacy loading and blank states `Loading quiz...`/`No Quiz Found`; new skeleton and null render can differ or look blank when no quiz.

## G2-3-003-048  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:306-319`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:907-941`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:471-491`; `src/components/courses/learner-quiz-attempt.module.css:39-42`
- Fix: Legacy phone breakpoint 767px with Questions drawer and top button; new md/ lg split keeps nav inline and changes sticky bar. Align 375, 768, 1280 rendering.

## G2-3-003-049  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:995-1005`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:503-518`
- Fix: Legacy options two columns at desktop; new single-column option rows at all sizes. Restore 768+ responsive grid.

## G2-3-003-050  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/leftpanel.js:67-84`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:475-488`
- Fix: Legacy question-nav aria-label includes answered/not answered and point value; vNext nav state label omits point value (verify); include points in accessible name.

## G2-3-003-051  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:977-982`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:80-94`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:497-518`
- Fix: Legacy applies HTML tag/attribute allowlist to rich quiz prompt; vNext plaintext no HTML sanitization needed but formatted educational content missing. Add safe parser with tested allowlist.

## G2-3-003-053  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1151-1163`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:435-441`
- Fix: Restore dialog copy (`No`/`Yes`) and source-specific cancellation language for pixel-level copy parity.

## G2-3-003-054  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:891-905`; `docs/legacy-source/frontend/src/components/Quiz/leftpanel.js:80-83`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:451-468`; `src/components/courses/learner-quiz-attempt.tsx:475-488`
- Fix: Restore `Question N`, `N pts`, question-type badge and `Close` labels exactly, not generic Progress/Back-only labels.

## G2-3-003-059  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:531-575`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:302-340`
- Fix: Legacy restore redirect is to validated `returnTo` or iframe postMessage; vNext fixed `/learn/allQuizzes` after 2s. Preserve integration with course roadmap.
