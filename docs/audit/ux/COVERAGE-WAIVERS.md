# UX coverage / raw-table waiver requests — pending owner decision

**Status: PROPOSED, NOT APPROVED.** No item in this file may be counted closed unless the owner explicitly approves it. These are intentional exceptions to the standard shared-kit UI or DataTable policy, with test evidence.

| Requested waiver ID | Surface | Reason | Substitute behavioural evidence | Owner decision |
|---|---|---|---|---|
| UX-LEARN-ALIAS-01 | `/learn` | Next.js server redirect to canonical `/learn/courses`; renders no UI | `UX-learn-redirect-alias-coverage-01.test.ts` | Pending |
| UX-LEARN-ALIAS-02 | `/learn/assignments` | Redirect to `/learn/allAssignments`; renders no UI | Same test | Pending |
| UX-LEARN-ALIAS-03 | `/learn/quizzes` | Redirect to `/learn/allQuizzes`; renders no UI | Same test | Pending |
| UX-LEARN-ALIAS-04 | `/learn/placements` | Redirect to `/learn/my-placements`; renders no UI | Same test | Pending |
| UX-LEARN-ALIAS-05 | `/learn/courses/[deliveryId]` | Encoded dynamic redirect to canonical `/learn/courses/[deliveryId]/home`, no UI | Same test | Pending |
| UX-ATTENDANCE-PIVOT-01 | `components/attendance/admin-attendance-workspace.tsx` | Semantic row-by-learner/column-by-calendar-day attendance pivot has variable dynamic columns and sticky learner column | `UX-attendance-calendar-scroll-01.test.ts`, shared `ScrollCue axis="x"` provides focus region, edge fades | Pending |
| UX-ATTENDANCE-PIVOT-02 | `components/attendance/faculty-attendance-workspace.tsx` | Faculty session/calendar action matrix requires exact per-day cells, not a record-list DataTable | Same test; shared horizontal ScrollCue | Pending |

The other nine raw `components/courses` and `components/attendance` record-list tables listed in the original coverage matrix were converted to shared DataTable. The `/learn/profile/data-access` real page has a dedicated UX test; these aliases have no UI and should not be represented as synthetic rendered pages.

Approval is a product/UX policy decision; the current chat-7 builder has not represented any waiver as approved.
