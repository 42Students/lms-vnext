# UX cross-audit — learning and teaching (chat-17)

**Date:** 2026-10-18 IST  
**Audit branch:** `chatgpt/chat-17-b` (synced with `main` before fixes)  
**Authors being cross-audited:** chat-3 (`/teacher`, `/teach`) and chat-7 (`/learn`, `/quiz`, `/dashboard`, `/notifications`).  
**Scope:** 84 enumerated routes; per-page source reading, critical rendered shared components, signed-off UX-PLAYBOOK, UX-AUDIT-RUBRIC, rollout brief, legacy catalogues A/B, authored notes and tests.  
**Test environment:** GitHub repository source connection only; no local clone, TypeScript executable, live browser, assistive-tech or device captures. Nothing below asserts an executed green test suite.

## Findings — BLOCKER / MAJOR / MINOR / NIT

| Finding | Severity | Affected page | Evidence (pre-fix main source:line) | Defect and user impact | Required / committed fix |
|---|---|---|---|---|---|
| **LX-01** | **MAJOR** | `/teacher/live-classes` | `src/app/(authenticated)/teacher/live-classes/page.tsx:65` | Link explicitly used target=_blank; native WebView may discard navigation with no fallback. | Shared ThirdPartyLink preserves Open secure meeting link, exposes HTTPS destination and same-tab open. Commit `2ead4e66`. |
| **LX-02** | **MAJOR** | `/learn/my-placements/schedule` | `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:72-73` | Online meeting and test links opened new windows; assessment screen-reader cue risk. | Use validated ThirdPartyLink for both, retain original visible labels and Take online assessment accessible name. Commit `b85cbd18, 86c51ece`. |
| **LX-03** | **MAJOR** | `/learn/my-placements/applications/[applicationId]/company` | `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx:80` | Employer website target=_blank created a broken native handoff. | Use shared HTTPS-only destination and copyable fallback without weakening own-application checks. Commit `9c8e7c79`. |
| **LX-04** | **MAJOR** | `/learn/profile` | `src/app/(authenticated)/learn/profile/page.tsx:140` | Learner-saved coding profiles used target=_blank with no WebView fallback. | Use ThirdPartyLink; keep learner-authored labels, private profile ownership, and inspectable destination. Commit `d7b4c4b0`. |
| **LX-05** | **MAJOR** | `/teacher/courses/[deliveryId]/[...courseTab] and /teach/courses/[deliveryId]` | `src/components/courses/faculty-course-workspace.tsx:150-153,404-410,536-539,625` | Faculty content URL opened a new window; course navigation/filter/detail controls were 40px. | Shared verified-HTTPS external control and 44px minimum action targets across faculty course workspace. Commit `bf21dcec`. |
| **LX-06** | **MAJOR** | `/learn/courses/[deliveryId]/[...courseTab]` | `src/components/courses/learner-course-workspace.tsx:329,348,473` | Learner links opened new windows, internal file-open needed extra window and links used 36px controls. | Share WebView-safe external link and saved-submission recovery; internal file opens same tab, actions >=44px. Commit `6b856862`. |
| **LX-07** | **MAJOR** | `/notifications, /learn/notifications and /teacher/notifications` | `src/components/activity/notification-list.tsx:132-136` | Notification title selection action was 40px high. | Preserve View notification label and callback; raise tap target to 44px with keyboard focus. Commit `f6ba5b5c`. |
| **LX-08** | **MAJOR** | `/learn/courses` | `src/components/courses/learner-course-list.tsx:508-513` | Show more courses progression button was 40px high. | Raise existing pagination/progression button to 44px, preserve loaded count and pagination logic. Commit `716012f0`. |
| **LX-09** | **MAJOR** | `/quiz` | `src/components/courses/learner-quiz-attempt.tsx:372,453` | Quiz Back controls were text-sized without accessible touch bounds. | Keep current draft/confirmation handling and original Back labels; add >=44px target and focus indicator. Commit `ba145e49`. |

**Unique confirmed source findings: 9 MAJOR, 0 BLOCKER, 0 MINOR, 0 NIT.** All 9 MAJOR items have source fixes on chat-17. Shared component repairs affect multiple consuming routes; findings are counted once, not multiplied for each route. Previously authored route-level tests were retained unchanged.

## Per-page ledger — complete 84-route inventory

Each page path was opened and checked for literal `target="_blank"`, native dialogs/popups, undersized interactive markup, route identity and owner-authored notes/tests. The table records confirmed issues or `—` when no *new* definite source BLOCKER/MAJOR was identified in the page shell. **It is not a substitute for hydrated interaction, per-field permissions or full mobile geometry testing.** The new `UX-learning-cross-audit-chat17.test.ts` pulls these six inventories directly and refuses missing routes.

| Area | Page | Finding(s) and remediation |
|---|---|---|
| `teacher` | `/teacher/allAssignments` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/allQuizzes` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/calendar` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/contacts` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/contacts/[contactsTab]` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/contacts/[contactsTab]/[membershipId]` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/courses` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/courses/[deliveryId]` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/[...courseTab]` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/assessment-health` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/assignments/manage` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/attendance-corrections` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/attendanceDetail` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/discussion-history` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/discussion-participation` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/discussions` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/gradebook` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/notices` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/quizzes/manage` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/reports` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/session-coverage` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/students` | **LX-05 fixed** |
| `teacher` | `/teacher/courses/[deliveryId]/students/[membershipId]` | **LX-05 fixed** |
| `teacher` | `/teacher/live-classes` | **LX-01 fixed** |
| `teacher` | `/teacher/notifications` | **LX-07 fixed** |
| `teacher` | `/teacher/profile` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/profile/contacts` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/profile/details` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/profile/teaching` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/report/assignment/[contentId]` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/report/assignment/[contentId]/submissions` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/report/quiz/[quizId]` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/report/quiz/[quizId]/attempts` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/response-followups` | — No new confirmed source-severity finding |
| `teacher` | `/teacher/results` | — No new confirmed source-severity finding |
| `teach` | `/teach/courses` | — No new confirmed source-severity finding |
| `teach` | `/teach/courses/[deliveryId]` | **LX-05 fixed** |
| `learn` | `/learn` | — No new confirmed source-severity finding |
| `learn` | `/learn/allAssignments` | — No new confirmed source-severity finding |
| `learn` | `/learn/allAssignments/[assignmentId]` | — No new confirmed source-severity finding |
| `learn` | `/learn/allQuizzes` | — No new confirmed source-severity finding |
| `learn` | `/learn/allQuizzes/[quizId]` | — No new confirmed source-severity finding |
| `learn` | `/learn/assignments` | — No new confirmed source-severity finding |
| `learn` | `/learn/attendance` | — No new confirmed source-severity finding |
| `learn` | `/learn/attendance/calendar` | — No new confirmed source-severity finding |
| `learn` | `/learn/calendar` | — No new confirmed source-severity finding |
| `learn` | `/learn/courses` | **LX-08 fixed** |
| `learn` | `/learn/courses/[deliveryId]` | **LX-06 fixed** |
| `learn` | `/learn/courses/[deliveryId]/[...courseTab]` | **LX-06 fixed** |
| `learn` | `/learn/courses/[deliveryId]/attendance-summary` | **LX-06 fixed** |
| `learn` | `/learn/courses/[deliveryId]/progress` | **LX-06 fixed** |
| `learn` | `/learn/my-placements` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/announcements` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/applications` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/applications/[applicationId]` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/applications/[applicationId]/company` | **LX-03 fixed** |
| `learn` | `/learn/my-placements/applications/[applicationId]/history` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/assessments` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/assessments/results` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/calendar` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/interviews` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/jobs` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/jobs/[jobId]` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/notification-preferences` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/offers` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/placement` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/preparation` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/rules` | — No new confirmed source-severity finding |
| `learn` | `/learn/my-placements/schedule` | **LX-02 fixed** |
| `learn` | `/learn/my-placements/support` | — No new confirmed source-severity finding |
| `learn` | `/learn/notifications` | **LX-07 fixed** |
| `learn` | `/learn/notifications/history` | **LX-07 fixed** |
| `learn` | `/learn/placements` | — No new confirmed source-severity finding |
| `learn` | `/learn/profile` | **LX-04 fixed** |
| `learn` | `/learn/profile/academic-record` | — No new confirmed source-severity finding |
| `learn` | `/learn/profile/completeness` | — No new confirmed source-severity finding |
| `learn` | `/learn/profile/verification` | — No new confirmed source-severity finding |
| `learn` | `/learn/projects` | — No new confirmed source-severity finding |
| `learn` | `/learn/projects/[projectId]` | — No new confirmed source-severity finding |
| `learn` | `/learn/quizzes` | — No new confirmed source-severity finding |
| `quiz` | `/quiz` | **LX-09 fixed** |
| `dashboard` | `/dashboard` | — No new confirmed source-severity finding |
| `notifications` | `/notifications` | **LX-07 fixed** |

## 21-point rubric and 10 excellence criteria crosswalk

| Rubric | Area checked | Evidence/result and limits |
|---|---|---|
| 1 | Playbook patterns | Reference archetypes used where source supports; generic adjectives are not accepted as evidence. |
| 2 | Route sampling | All 84 assigned page source files screened; shared workspace and form hot spots sampled directly. |
| 3 | Shared component anatomy | Audited primary PageHeader, DataTable, ConfirmDialog, input, course workspaces, notification list and ThirdPartyLink. |
| 4 | State coverage | Observed redirect/denied, skeleton/error route files, explicit empty, filtered, partial and offline patterns; host execution pending. |
| 5 | Colour contrast | Uses existing design tokens; computed live contrast not possible without deployed browser. |
| 6 | Type/spacing/motion | Patched observed 36/40px targets to 44px; new ad-hoc colours or animations avoided. |
| 7 | Legacy wording | Preserved visible labels and the schedule's screen-reader Take online assessment wording; sampled copy catalogue A/B. |
| 8 | Code/playbook parity | Repaired target=_blank and undersized interactive links contrary to signed-off shared-component rule. |
| 9 | Backwards compatibility | ThirdPartyLink added optional ariaLabel; existing prop signatures unaffected. Strict typecheck pending. |
| 10 | Unsafe popups | 84 route-shell scan + targeted shared component assertions forbid native popup calls and literal blank targets. |
| 11 | 320/360/390 phones | 44px target source remediations; real viewport overflow cannot be verified with connector-only source read. |
| 12 | Cards/filters/dialogs | Verified major shared course/notifications samples; route-by-route hydrated details still require browser. |
| 13 | Native WebView hazards | Nine blockers-to-mobile-navigation identified and fixed; same-tab HTTPS/destination/copy fallback implemented. |
| 14 | Slow/offline | Route-level loading/error resources and partial service safeguards sampled, not executed under network fault. |
| 15 | WCAG focus/navigation | 43+ shared screens sampled; critical Back/filter/curriculum/notification targets corrected. |
| 16 | Announcements | Status/alert sections sampled; live screen-reader output unverified. |
| 17 | Strict TypeScript | Targeted edits remain TS types-compatible by inspection; actual compiler not available. |
| 18 | Long lists | Course progression and shared list/notification sources inspected; 100-row benchmark deferred. |
| 19 | Reference implementations | Uses signed-off shared components; physical reference screenshots deferred. |
| 20 | 100-point rubric | Scope maps to the 21 audit checks and 10 excellence criteria; no invented numeric score. |
| 21 | Anti-drift | Dynamic 84-route test and 9 concrete component tests added; no existing tests removed or weakened. |

**Excellence 1–10:** (1) semantic page identity and original copy retained; (2) phone action target fixes; (3) existing loading/empty/error route checks without inventing false data; (4) assignment/quiz draft and confirm handlers sampled, unchanged; (5) course index/load-more and roster patterns sampled; (6) shared ConfirmDialog, drawer/link patterns reviewed; (7) success/error feedback unchanged; (8) focus/44px fixes; (9) IST and tokens unchanged; (10) pre-existing pagination/performance patterns retained. These are source-review observations, **not** browser-measured compliance.

### Controls and prevention

- `tests/unit/UX-learning-cross-audit-chat17.test.ts`: one inventory-count test, **84 route-level** anti-popup/touch assertions, **9 named finding tests** and a shared WebView fallback regression assertion. Uses page lists as test data rather than tautological file-length checks.
- Added that test to the existing `npm run ux:audit:unit` gate; existing tests, copy catalogs, permissions and services are not modified.
- Changed only scoped route files plus reused shared course, notification, quiz and ThirdPartyLink components. No production action or data migration.
- No endpoints, auth helpers, same-origin middleware, GET/POST behavior, permission selectors or tenancy-scoping services were modified.

### Verdict by area

| Area | Pages screened | Source BLOCKER open | Source MAJOR fixed (including inherited shared) | Source MAJOR still identified open | Verdict |
|---|---:|---:|---:|---:|---|
| /teacher | 36 | 0 | 3 (LX-01, LX-05, LX-07) | 0 | PASS WITH FIXES — source only |
| /teach | 2 | 0 | 1 (LX-05 shared) | 0 | PASS WITH FIXES — source only |
| /learn | 43 | 0 | 6 (LX-02, LX-03, LX-04, LX-06, LX-07, LX-08) | 0 | PASS WITH FIXES — source only |
| /quiz | 1 | 0 | 1 (LX-09) | 0 | PASS WITH FIXES — source only |
| /dashboard | 1 | 0 | 0 | 0 | PASS — source only |
| /notifications | 1 | 0 | 1 (LX-07 shared) | 0 | PASS WITH FIXES — source only |
| **Distinct total** | **84** | **0** | **9 unique** | **0 confirmed** | **PASS WITH FIXES — source only; conditional on CI** |

**Highest-risk unverified areas:** (i) native WebView navigation/return, especially online assessments and private signed-file downloads, (ii) real 320/360/390px keyboard and focus geometry, (iii) authenticated and tenant-scoped backend fault injection and TypeScript/test CI outcomes. Treat failures from orchestrator tests as reopening the corresponding source finding, not evidence that testing was already done.

**Sign-off scope:** Source-level **PASS WITH FIXES** for the nine confirmed defects. Browser/performance/screen-reader sign-off and compiler/unit-test success remain unverified; do not promote unchecked page inventories to accepted before the orchestrator gate runs.
