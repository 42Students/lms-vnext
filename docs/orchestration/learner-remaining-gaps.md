# Learner remaining gaps — complete non-DONE parity inventory

**Snapshot:** 2026-10-14 · `chatgpt/chat-5` · source:
`docs/planning/learner-ui-surface-ledger.md` and
`docs/planning/account-surface-parity.md`.

**Not an execution tracker.** `docs/tracker.json` remains the sole live
tracker. This document enumerates **every operational Learner L-row whose
literal status is not DONE**, even CLOSED/FIXED rows that have recorded code
but not parent account/family acceptance. It also enumerates **every
Learner account-matrix row not DONE**. Neither a test file nor a Git commit
is proof of runtime acceptance. Never infer a missing database table merely
from an old ledger note without checking the registered journal.

## Inventory totals

- **579** operational Learner ledger rows not literally DONE
  (including coded but not final-accepted rows).
- **28** Learner account-matrix rows not marked DONE.
- Ledger statuses: BLOCKED 14 · CLOSED 143 · FIXED 174 · GAP 73 · REDESIGNED 5 · RETIRED 1 · UNCHECKED 169.
- Primary blocker categories: buildable 530 · missing migrated table 28 · owner decision 21.

Each row below gets one **initial** dependency category: **buildable** means
source implementation/verification can proceed using registered data;
**missing migrated table** means the canonical registered record/field/producer
is absent or unverified and needs database reconciliation; **owner decision**
means an explicit product, privacy, policy, or storage-system disposition is
needed. These are triage judgments, **not a certified schema audit**.
`CLOSED` and `FIXED` rows are included as **acceptance work**, not falsely
labeled missing implementation. The true operational backlog is the
GAP/UNCHECKED/BLOCKED rows, subject to fresh inspection.

## Account-surface matrix — every row not DONE (28)

| Surface | Status | Blocker | Required gate |
| --- | --- | --- | --- |
| Courses list | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Course Overview | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Course Attendance | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| All Assignments | PARTIAL | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| All Quizzes | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Standalone quiz attempt UX | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Class Schedule | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Attendance summary | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Placements dashboard | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Applications | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Assessments | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Interviews | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Career Calendar | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Jobs list | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Job detail | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Placement Cell | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Placement Rules | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Overview | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Team | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Sprints / Board | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Tasks | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Resources | PARTIAL | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| Project Meetings | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Delivery | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Project Activity | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Notifications feed | PARTIAL | buildable | Close outstanding underlying ledger rows and execute exact legacy/browser and PostgreSQL acceptance. |
| Self Profile | PARTIAL | missing migrated table | Reconcile missing/unknown canonical persisted schema and producer before implementing this legacy job. |
| `/learn` redirect | RETIRED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |

## Detailed Learner operational rows — every row not literally DONE (579)

A `CLOSED`/`FIXED` label is locally resolved implementation only; all
entries below need final family/matrix evidence before global DONE. Full
legacy-to-vNext descriptions remain in the canonical linked ledger.


### L0 (17 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L0-001 | Exact legacy sidebar order + group-boundary separators | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-002 | Sidebar label + route: Courses | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-003 | Sidebar label + route: Quizzes | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-004 | Sidebar label + route: Assignments | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-005 | Sidebar label + route: Class Schedule | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-006 | Sidebar label + route: Attendance | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-007 | Sidebar label + route: My Placements | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-008 | Sidebar label + route: Projects | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-009 | Sidebar label + route: Notifications | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-010 | Sidebar label + route: Profile | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-011 | Projects feature-flag visibility | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-012 | Placements feature-flag visibility | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-013 | Conditional Drive Day sidebar item | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-014 | Active sidebar highlight across nested routes | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-015 | Learner mobile sidebar/open-close behavior | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-016 | Learner topbar/account switch/sign-out behavior | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L0-017 | `/learn` redirect to Courses | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L1 (26 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L1-001 | Page title/naming = Courses | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-002 | Program context | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-003 | Semester selector | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-004 | Historical semester browsing | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-005 | Past-semester read-only signal | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-006 | Regular vs Electives filter | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-007 | Search courses | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-008 | Course card name/code | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-009 | Section/class metadata | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-010 | Credits metadata | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-011 | Elective badge | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-012 | Course progress | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-013 | Continue/next-learning cue | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-014 | Card click opens Overview | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-015 | First-run/no-courses empty state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-016 | Filtered-empty state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-017 | Loading skeleton | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-018 | Request/error state + retry/back | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-019 | Mobile card/filter behavior | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-020 | Instructor name on learner course card | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-021 | Course thumbnail + fallback image | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L1-022 | Electives group heading in mixed All view | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-023 | Show-more pagination after 48 cards | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L1-024 | Malformed/incomplete legacy record warning | REDESIGNED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |
| L1-025 | Invalid credit warning/exclusion | REDESIGNED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |
| L1-026 | Semester fetch retry/fallback message | REDESIGNED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |

### L2 (29 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L2-001 | Course detail default redirect to Overview | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-002 | Exact learner tabs: Overview / Learning Path / Attendance / Discussions | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-003 | Blueprint hidden for Learner | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-004 | Students hidden for Learner | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-005 | Back to Courses | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-006 | About this course | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L2-007 | What you'll learn / learning-path summary | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L2-008 | Faculty/teacher context | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-009 | Section + semester context | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-010 | Credits/elective context | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-011 | Next action priority: due assessment → live session → continue lesson | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-012 | Overall progress metric | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-013 | Lesson progress metric | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-014 | Assignment progress metric | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-015 | Quiz progress metric | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-016 | Unified recent course updates | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L2-017 | Course-team update links to Discussions | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-018 | Assessment/live update links to exact item | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-019 | Historical course Overview read-only messaging | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-020 | Course not-found/access handling | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-021 | Course loading/error state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-022 | Overview mobile behavior | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L2-023 | Authored introduction content | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L2-024 | Authored rich HTML overview + sanitization | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L2-025 | Authored takeaways list | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L2-026 | Long overview Read more / Show less | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-027 | Partial course-details/progress widget warning state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-028 | Announcement body preview + Read more / Show less | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L2-029 | Detailed lesson/item progress drill-down | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L3 (37 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L3-001 | Learning Path title/description | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-002 | Overall progress header | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-003 | Content filters: All / Lectures / Resources / Assessments / Live Sessions | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-004 | Lesson ordering | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-005 | Lesson expand/collapse | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-006 | Deep link focuses lesson/content | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-007 | VIDEO representation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-008 | YOUTUBE representation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-009 | RESOURCE representation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-010 | LIVE_CLASS representation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-011 | ASSIGNMENT representation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-012 | QUIZ representation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-013 | Scheduled/locked item state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-014 | Future live URL withheld | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-015 | Live class join CTA | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-016 | Ended live class state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-017 | Uploaded video playback | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L3-018 | Uploaded video resume/progress | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L3-019 | YouTube resume/progress | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-020 | Resource open | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L3-021 | Resource download | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L3-022 | Manual content completion rules | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-023 | Assignment open/view | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-024 | Assignment submit | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-025 | Late assignment submission | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-026 | Assignment file upload | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L3-027 | Quiz open/take | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-028 | Quiz completed/result state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-029 | Course progress refresh after actions | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-030 | Empty learning path | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-031 | Partial lesson/no-items state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-032 | Learning Path mobile behavior | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L3-033 | Current lesson + completed/in-progress lesson status | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-034 | Per-lesson content-type breakdown/counts | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-035 | Assignment due / overdue and expired-quiz row cues | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-036 | Video/YouTube watched percentage on roadmap row | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L3-037 | Roadmap content viewer/drawer interaction parity | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |

### L4 (18 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L4-001 | Course attendance summary | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-002 | Classes held count | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-003 | Present count | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-004 | Absent count | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-005 | Percentage | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-006 | Threshold signal | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-007 | Unmarked sessions explanation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-008 | Session date/time | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-009 | Faculty/location context | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-010 | Present/Absent/Late/etc badge | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-011 | No attendance state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-012 | Learner cannot mutate attendance | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-013 | Historical course attendance readable | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-014 | Mobile attendance cards | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-015 | Previous / direct month picker / next month | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-016 | Future classes display as Scheduled, not Present | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-017 | Threshold headroom / recovery guidance | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L4-018 | Read-only per-course attendance history by month | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L5 (17 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L5-001 | Discussion feed | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-002 | Faculty/learner author context | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-003 | Timestamp context | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-004 | Pinned message/update | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-005 | Post message | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-006 | Delete own message | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-007 | Cross-class isolation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-008 | Poll/refresh behavior | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-009 | Empty feed | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-010 | Load error/retry | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-011 | Historical discussion read-only | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-012 | Mobile discussion behavior | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L5-013 | Consecutive-message sender grouping | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-014 | Initial load lands at newest message | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-015 | New-message unseen counter while reading history | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-016 | Multiple pinned-message count/context | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L5-017 | Persistent discussion invitation/help cue | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L6 (23 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L6-001 | Page title = All Assignments | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-002 | Aggregate learner assignment scope | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-003 | Course filter | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-004 | Pagination | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-005 | Course metadata | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-006 | Created/due metadata | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-007 | Not submitted state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-008 | Due soon state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-009 | Overdue + late allowed state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-010 | Submitted state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-011 | Submitted late state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-012 | Graded state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-013 | View/submit primary action | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-014 | Submission/view drawer parity | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-015 | Submission text/link/file fields | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L6-016 | Grade masked until publish | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-017 | Metrics/summary pills | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-018 | Loading skeleton | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-019 | Request failure/retry | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-020 | Zero assignments | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-021 | Filtered empty | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-022 | Deep link exact assignment | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L6-023 | Mobile assignment cards/drawer | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L7 (18 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L7-001 | Page title = All Quizzes | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-002 | Aggregate published quiz scope | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-003 | Course filter | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-004 | Pagination | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-005 | Not attempted state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-006 | Attempted state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-007 | Missed state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-008 | Result-published state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-009 | Due/close timing | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-010 | Attempt count/limit | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-011 | Take Quiz action | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-012 | View Result action | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-013 | Correct delivery in deep link | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-014 | Loading skeleton | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-015 | Request failure/retry | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-016 | Zero quizzes | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-017 | Filtered empty | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L7-018 | Mobile quiz list | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L8 (22 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L8-001 | Full-screen/no learner shell | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-002 | Quiz title/progress header | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-003 | Question number navigation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-004 | Previous/Next navigation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-005 | SINGLE_CHOICE rendering | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-006 | MULTIPLE_CHOICE rendering | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-007 | Answer persistence during navigation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-008 | Answer persistence across refresh | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-009 | Submit confirmation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-010 | Prevent unavailable/closed attempt | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-011 | Attempt limit enforcement | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-012 | Deadline enforcement | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-013 | Review mode | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-014 | Results withheld until publish | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-015 | Correct answers shown only when allowed | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-016 | Fatal load error + retry | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-017 | Missing URL params recovery | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-018 | Browser Back behavior | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-019 | Double-submit/race protection | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-020 | Mobile attempt layout | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-021 | Unanswered-question warning before submit | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L8-022 | Post-submit return to prior page | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L9 (19 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L9-001 | Page title = Class Schedule | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-002 | Today metric | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-003 | Next class metric | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-004 | Next classes preview | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-005 | Month view | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-006 | Week view | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-007 | Day view | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-008 | Previous navigation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-009 | Today navigation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-010 | Next navigation | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-011 | Course filters | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-012 | Event title/time | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-013 | Course/faculty/location/section context | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-014 | Event link to course | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-015 | No schedule state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-016 | Filtered-empty view state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-017 | Load error vs true empty | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-018 | Browser-local date grouping | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L9-019 | Mobile agenda/list fallback | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L10 (20 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L10-001 | Page title = Attendance | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-002 | Course selector | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-003 | Prevent raw course-id flash | REDESIGNED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |
| L10-004 | Previous month | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-005 | Direct month/year picker | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-006 | Next month | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-007 | Total/Held metric | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-008 | Present metric | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-009 | Absent metric | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-010 | Attendance percentage | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-011 | College threshold/eligibility signal | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-012 | Per-course overview | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-013 | Desktop date/day/time/status table | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-014 | Mobile attendance list | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-015 | Select-course empty state | REDESIGNED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |
| L10-016 | No-records selected-month state | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-017 | Request failure is not shown as empty | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-018 | Retry attendance load | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-019 | Loading skeleton | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L10-020 | Learner read-only / tenant scope | CLOSED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L11 (20 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L11-001 | Exact placement tabs | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L11-002 | First-run onboarding hero | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-003 | Partial-source error alert | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-004 | Hero greeting | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-005 | Next-action priority | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-006 | Assessment urgency action | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-007 | Interview urgency action | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-008 | Next scheduled event action | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-009 | Browse jobs fallback action | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-010 | Open-jobs snapshot | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-011 | Applications snapshot | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-012 | Interviews snapshot | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-013 | Assessments snapshot | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-014 | Needs-attention list | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-015 | Attention overflow CTAs | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-016 | Rolling 7-day calendar preview | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-017 | Recent placement activity | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L11-018 | Loading skeletons | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-019 | Error counts remain unknown, not zero | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L11-020 | All dashboard CTAs preserve intended filter/context | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L12 (22 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L12-001 | Page title/tab name = Drives | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L12-002 | All drives tab | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-003 | Saved tab | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-004 | Search with URL state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-005 | Browser Back/Forward search hydration | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-006 | Sort by deadline | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-007 | Sort newest | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-008 | Sort highest CTC | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-009 | Job/employment type filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-010 | Location filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-011 | Eligible-only filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-012 | Closing-soon filter | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L12-013 | Save job | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-014 | Unsave job | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-015 | Pagination | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-016 | Open/not-open/closed grouping | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-017 | Deadline urgency labels | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-018 | Eligibility state on card | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L12-019 | Existing application state on card | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L12-020 | Saved-jobs failure distinct from all-jobs failure | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-021 | First-run/filtered-empty | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L12-022 | Mobile jobs list/filters | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L13 (16 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L13-001 | Drive/company/job identity | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-002 | Eligibility checklist/reasons | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-003 | Role details | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-004 | Compensation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-005 | Locations/work mode | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-006 | Openings | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-007 | Deadline | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-008 | Apply CTA | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-009 | Existing application state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-010 | External application mode | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L13-011 | Registration requirements | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L13-012 | Closed/not-open state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L13-013 | Not-eligible state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-014 | Not-found/access handling | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L13-015 | Back to Drives/navigation | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L13-016 | Application uses the Profile resume; no per-drive resume upload | GAP | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |

### L14 (24 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L14-001 | Search + URL state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-002 | Back/Forward hydration | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-003 | Stage filter chips | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-004 | All / In Progress / Completed views | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-005 | Sort recent activity | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-006 | Sort stage | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-007 | Sort company | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-008 | Attention banner | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-009 | Review offers opens full offered list | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L14-010 | Application cards | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-011 | Journey/status visualization | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L14-012 | Application Detail modal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-013 | Application History modal | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L14-014 | Company Preview modal + retry | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L14-015 | Withdrawal request modal + reason | GAP | owner decision | Confirmed reason-bearing direct self-withdrawal is implemented and audited; legacy approval-style request is a separate workflow needing explicit owner parity disposition. Execute focused DB and browser evidence before closure. |
| L14-016 | Offer accept confirmation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L14-017 | Offer decline confirmation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L14-018 | Assessment deep link | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-019 | Interview deep link | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-020 | Job/similar roles deep link | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-021 | Loading state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-022 | Hard/inline error state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-023 | First-run/filtered-empty | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L14-024 | Mobile cards/modals | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L15 (19 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L15-001 | Route is materialized, not placeholder | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-002 | Pending / Completed views | GAP | missing migrated table | Reconcile missing/unknown canonical persisted schema and producer before implementing this legacy job. |
| L15-003 | Search | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-004 | Urgency filter | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-005 | Due today bucket | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-006 | Due this week bucket | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-007 | Later bucket | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-008 | Waiting on employer link bucket | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-009 | No deadline bucket | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-010 | Overdue bucket | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-011 | Employer-link unavailable state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-012 | External assessment launch | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-013 | Time-critical leave confirmation | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-014 | Local non-authoritative submitted reminder | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-015 | Undo/dismiss/change reminder | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-016 | Job/application navigation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-017 | Loading/error/empty/filter-empty | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L15-018 | Employer-side submission disclaimer (not a server receipt) | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L15-019 | Applied official assessment results | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L16 (20 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L16-001 | Route is materialized, not placeholder | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L16-002 | Upcoming / Past views | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-003 | Search | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-004 | Highlight deep link | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-005 | Countdown/live/past badges | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-006 | Confirm interview | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-007 | Join now | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L16-008 | Interview Detail modal | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-009 | .ics download | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-010 | Google Calendar link | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-011 | Request new slot | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-012 | Reschedule reason | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-013 | Preferred date/daypart/details | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-014 | Cancel reschedule request | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-015 | Reschedule summary + copy | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-016 | Decline interview confirmation | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-017 | Withdrawal request | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-018 | Loading/error/empty | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L16-019 | Mobile interview actions/modals | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L16-020 | Deterministic assessment vs interview round-kind classification | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L17 (15 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L17-001 | Route is materialized, not placeholder | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L17-002 | Agenda mode | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-003 | Month mode | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-004 | Week mode | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-005 | Day mode | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-006 | Previous / Today / Next | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-007 | Date picker | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-008 | Event-type filters | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-009 | Event chips | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-010 | Selected-event detail drawer | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-011 | Event action/deep links | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L17-012 | Partial-source failure + retry | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L17-013 | Empty calendar state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L17-014 | Timezone handling | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L17-015 | Mobile agenda fallback | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |

### L18 (27 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L18-001 | Route is materialized, not placeholder | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-002 | Debar alert | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-003 | Registration card | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-004 | Placements choice | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-005 | Higher Studies choice | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-006 | Not Interested choice | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-007 | Consent workflow | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-008 | Placement Rules link | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-009 | Offers list | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-010 | Accept offer | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-011 | Decline offer | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-012 | Offer acceptance preview | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-013 | Your rounds | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-014 | Confirm round | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L18-015 | Ask to reschedule | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-016 | Requests list | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-017 | Registration-change request | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-018 | Correction request | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-019 | External-offer request | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-020 | Absence-dispute request | GAP | missing migrated table | Required registration/consent/request data producer is not verified as migrated; do not invent state. |
| L18-021 | Offer-extension request | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-022 | New Request modal dynamic fields | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L18-023 | Notices from placement cell | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L18-024 | Notice dispute flow | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L18-025 | Offer-letter/file flow | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L18-026 | Page loading/error/retry/empty | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L18-027 | Personal placement activity alerts, not official notices | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L19 (8 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L19-001 | Route is materialized, not placeholder | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L19-002 | Back action | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L19-003 | Personal "Where you stand" note | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L19-004 | Authoritative college rules summary | BLOCKED | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L19-005 | Rule-change applicability wording | GAP | buildable | Implement/reconcile the specified legacy interaction on migrated data and execute denial/UI checks. |
| L19-006 | Loading skeleton | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L19-007 | Load error + Retry | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L19-008 | Drive-level eligibility explanation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

### L20 (17 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L20-001 | Page title = Projects | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-002 | Search my projects | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-003 | Current only filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-004 | Active filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-005 | In progress filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-006 | Ready filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-007 | Blocked filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-008 | Archived filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-009 | Needs my review filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-010 | Needs my action filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-011 | Project card title/status | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-012 | Team/mentor context | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-013 | Progress/readiness signal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-014 | Archived/read-only signal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-015 | Correct project navigation | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L20-016 | Loading/error/empty/filtered-empty | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L20-017 | Mobile project list/filter UI | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L21 (12 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L21-001 | Overview tab | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-002 | People & Meetings tab | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-003 | Releases and Sprints tab | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-004 | Board tab | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-005 | Resources tab | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-006 | Activity tab | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-007 | Task Allocation hidden for Learner | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L21-008 | `?tab=tasks` compatibility → Board | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L21-009 | `?tab=meetings` compatibility → Team | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L21-010 | `?tab=delivery` opens final delivery flow | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L21-011 | Tab click does not remount/lose modal/form state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L21-012 | Not-found/access/error state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L22 (6 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L22-001 | Project narrative/description | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L22-002 | Goals/deliverables | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L22-003 | Definition of done | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L22-004 | Project status/readiness | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L22-005 | Learner final-delivery summary | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L22-006 | Archived/read-only behavior | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L23 (10 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L23-001 | Team member list | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-002 | Member roles | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-003 | Mentor information | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-004 | Meeting list | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-005 | Request meeting | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-006 | Cancel meeting/request | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-007 | Meeting status | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-008 | Meeting timezone/date handling | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-009 | Meeting external link safety | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L23-010 | Empty/error states | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L24 (9 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L24-001 | Release list/order | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-002 | Release state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-003 | Sprint list/order | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-004 | Current sprint signal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-005 | Sprint goal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-006 | Sprint dates | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-007 | Sprint needs-attention signal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-008 | Learner-visible lifecycle actions | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L24-009 | Empty/no sprint/release state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L25 (14 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L25-001 | Board columns/statuses | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-002 | Priority filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-003 | Sprint scope filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-004 | Assignee filter + Mine | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-005 | Release filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-006 | Search tasks | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-007 | Task card title/type/priority/points | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-008 | Task detail modal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-009 | Learner task status transitions | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-010 | Task submission/link flow | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-011 | Assignment/ownership visibility | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-012 | Unassigned/attention state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-013 | Board empty/filter-empty | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L25-014 | Mobile board/task interaction | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L26 (10 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L26-001 | Resource list | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-002 | Resource type | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-003 | Description/notes | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-004 | Related sprint/task | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-005 | Visibility Everyone/Mentors | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-006 | Link resource | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-007 | File resource | BLOCKED | owner decision | Resolve external or product-owned prerequisite; do not bypass the documented acceptance gate. |
| L26-008 | Required/pinned/access context | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L26-009 | Open/download file | BLOCKED | owner decision | Resolve external or product-owned prerequisite; do not bypass the documented acceptance gate. |
| L26-010 | Empty/error states | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L27 (10 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L27-001 | Activity feed exists | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-002 | Sprint changes filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-003 | Task changes filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-004 | Team & meetings filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-005 | Resources shared filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-006 | Submission updates filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-007 | Date-range filter | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-008 | Actor/time/context presentation | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-009 | Meaningful/noise-controlled history | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L27-010 | Empty/error state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L28 (7 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L28-001 | `?tab=delivery` deep link | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L28-002 | Final submission form/modal | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L28-003 | Submission link/file | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L28-004 | Submission status | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L28-005 | Review feedback | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L28-006 | Resubmit/reopen rules | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L28-007 | File-backed final delivery | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |

### L29 (18 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L29-001 | Page title = Notifications | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-002 | Course notifications | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-003 | Project notifications | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-004 | Placement/job notifications | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-005 | Announcements/general notifications | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-006 | Personal notifications | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L29-007 | Unread signal | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L29-008 | Mark read | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L29-009 | Action: Take Assessment | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-010 | Action: View Interview | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-011 | Action: View in My Applications | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-012 | Action: View Course | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-013 | Project deep links | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-014 | Loading state | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-015 | Empty state | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L29-016 | Error/stale/retry behavior | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L29-017 | No cross-college/cross-role leakage | FIXED | buildable | Learner-specific and legacy shared mark-read single/bulk paths now use persisted college/role fences; DB success/denial and browser tests must run before family DONE. |
| L29-018 | Mobile notification list | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |

### L30 (43 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L30-001 | User summary/name/program | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-002 | Profile completeness | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-003 | Profile image view | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-004 | Profile image upload/remove | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L30-005 | Resume view/status | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-006 | Resume upload/import/remove | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L30-007 | Contacts | FIXED | buildable | Implemented confirm-only optional alternate-phone/contact-email edit with active own-college/role validation, JSONB section update, audit privacy and fresh PostgreSQL success/denial tests; execute focused PG/browser acceptance. Login contact changes are not included. |
| L30-008 | Social profiles | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-009 | Address | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-010 | Personal details | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-011 | Identity numbers + masking | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-012 | Aadhaar/PAN file upload/import/replace cleanup | BLOCKED | owner decision | Secure storage, privacy retention, or attachment pipeline requires approved implementation disposition. |
| L30-013 | Experiences add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-014 | Education/qualifications add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-015 | Skills add/edit/delete/proficiency | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-016 | Learner projects add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-017 | Certifications add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-018 | Achievements add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-019 | Languages add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-020 | Extracurricular add/edit/delete | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-021 | Hobbies edit | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-022 | Metadata section | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-023 | Publications/awards legacy handling | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-024 | Job Preferences must be absent from learner Profile | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-025 | Placement Academic Record must be absent from learner Profile | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-026 | Contact deep-link scroll | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-027 | Connect-accounts deep-link scroll | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-028 | Optional-section partial failure isolation | RETIRED | owner decision | Obtain product-owner approval of the documented redesign/retirement and final legacy parity evidence. |
| L30-029 | Loading skeleton | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-030 | Hard-error + Retry | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-031 | Visibility refresh | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-032 | Role fence/redirect | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L30-033 | Mobile profile cards/forms | UNCHECKED | buildable | Inspect current implementation and close missing behavior, tests, mobile and source-of-truth verification. |
| L30-034 | Profile Verification card | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-035 | Education verification missing/ready/submitted/verified/sent-back states | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-036 | Identity verification missing/ready/submitted/verified/sent-back states | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-037 | Send / resend changed Education or Identity for verification | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-038 | Verified profile badge + verified-by/date | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-039 | Sent-back reason and change-needed guidance | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-040 | Changed-since-verification / update-pending semantics | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-041 | Education marksheet upload/replace/view, PDF/JPG/PNG ≤5 MB | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-042 | Aadhaar/PAN private document upload/view tied to Identity verification | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |
| L30-043 | Verification status refresh while page remains visible | GAP | missing migrated table | Authoritative persisted record/field or verified producer is not registered; reconcile migration and ownership. |

### L31 (6 rows)

| ID | Learner parity requirement | Recorded status | Blocker | Reason / acceptance gate |
| --- | --- | --- | --- | --- |
| L31-001 | Detect learner's Drive Day assignment | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L31-002 | Conditional sidebar item only when assigned | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L31-003 | Learner-safe Drive Day landing | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L31-004 | Assigned drive/round context | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L31-005 | Learner cannot see/manage TPO-only controls | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |
| L31-006 | Not-assigned access denied/empty | FIXED | buildable | Source implementation recorded; execute focused DB/UI/mobile verification and finalize family acceptance. |

## Batch-specific facts and open proof

- **L15-005** Due today and **L15-006** Due this week: IST-calendar
  date buckets are authored on the actual learner-only assessment rounds.
  Week is Monday–Sunday and includes today; already-past/unscheduled rounds
  never silently count as future assessments.
- Existing shortlisted placement rounds and approved reschedules are the
  only time sources. No provider submission, grading or recruiter
  confirmation can be inferred from a schedule.
- No new write routes or unregistered data sources were introduced;
  authorization checks and PostgreSQL denial tests are authored.
- `L15-002` official Pending/Completed provider semantics, other
  deadline buckets, link-launch confirmation, and runtime/mobile/browser
  acceptance remain open. Parent Assessment surface stays PARTIAL.
- No `docs/tracker.json` task, global phase gate, or account matrix
  surface was changed to DONE.

## 2026-10-14 positive-path evidence follow-up

L29-017 is now FIXED at source level, not DONE: notification read and
acknowledgement use a persisted active learner membership and originating
college. Test fixtures create a user, membership, enrollment, application,
scheduled round and notifications during the integration test. Positive-path
and negative-path assertions were authored; executable PostgreSQL, TypeScript,
ESLint and browser outcomes remain outstanding. The Learner Notifications
matrix row remains PARTIAL and `docs/tracker.json` is unchanged.

## 2026-10-14 Applications withdrawal batch

Direct Learner self-withdrawal is now available through a responsive,
confirmed, reason-required Applications drawer. The existing migrated
`placement_applications` / `placement_application_status_history`
and transactional `placements.application.withdrawn` audit were reused.
A fresh-fixture PostgreSQL test asserts persisted status, private reason,
audit metadata without reason text, idempotence, and forged-college,
suspended, wrong-role and malformed-input denial. The test is authored;
it must execute on disposable PostgreSQL before it can count as passing
acceptance evidence. The older approval-style withdrawal **request**
remains unresolved under L14-015 and is not represented as equivalent.
All account matrix parent rows remain PARTIAL; `docs/tracker.json`
is unchanged.

## 2026-10-14 Learner contact-only write

L30-007 now includes an explicit mobile confirmation to edit the persisted
alternate phone and contact email. The dedicated same-origin PATCH accepts
only those two values and `confirmed: true`, validates the active
persisted Learner's own membership and account, edits only the contacts
JSONB section in a transaction, and records a PII-free activity audit.
A fresh PostgreSQL fixture with isolated membership/profile tests validates
success, preserving unrelated sections, audit, forged college, suspended
membership, wrong role and persisted live revocation. These tests are
authored; executed test/browser evidence remains outstanding. Do not
mistake this for changing primary OTP/login phone or account email, which
requires a separate verified-credential workflow. Profile is still PARTIAL.

## 2026-10-14 temporary chat-4 Learner assignment

PARTIAL — Implemented registered placement-only notification choice mutation and confirmation UI, backed by `placement_candidate_preferences` booleans. No generic notification-preferences table, saved-job persistence or application-note column was invented; the saved-jobs source remains staged and is not journal-confirmed. Positive-path/denial PostgreSQL fixtures, unit tests and audit checks authored; independent lint/tsc/DB/browser evidence remains outstanding. The original snapshot counts are unchanged.

## 2026-10-14 buildability skips for this learner batch

- L1-021 course thumbnail: canonical course-image field not verified in migrated schema; requires a registered image association before a real thumbnail source can be rendered. Do not fabricate image links.
- L3-017/018/020/021 uploaded playback/download: private storage integration, byte range streaming and authenticated object retrieval acceptance are required; excluded from this no-storage batch.
- L2-024 rich HTML overview: no registered authored rich overview field/sanitization contract; requires migrated content source and XSS-safe rendering policy.
- L30-034 through L30-043 learner verification: no confirmed vNext verification state machine/private document schema or approved upload workflow. Do not invent verified badges or statuses.

L17-007: date picker uses only persisted learner-scoped placement rounds, converted to ISO strings at the client boundary; acceptance remains PARTIAL until fresh disposable PostgreSQL, static checks and mobile/browser timezone review.

L17-010: own-scoped calendar event details backed by migrated placement rounds; event IDs are checked against the returned membership-scoped events rather than accepted from caller input. New unit and disposable PostgreSQL tests authored, browser/DB acceptance pending.

L17-015: month/week mobile fallback now groups only real authorized events by IST calendar day and retains exact round and details links. No fabricated schedule entries; database and responsive acceptance pending.

L11-003: partial-source placements dashboard now distinguishes read failures from empty data, prevents swallowed authorization errors with an upfront persisted learner gate, shows successful sections and a refresh control, and masks missing metric sources as unknown. Fresh-learner PostgreSQL tests and pure-model tests authored, independent error-injection/CI/browser acceptance pending.

2026-10-14 L2-007: published learner learning-path preview and measured item completion now shown on Course Home; authored takeaways remain separate. All unit, PG, typecheck/lint and responsive acceptance still required.

2026-10-14 L2-006: About panel now labels persisted content provenance instead of conflating author HTML, catalogue and path description; surfaces course code and missing faculty honestly. No rich HTML/storage field invented. Authored unit+PG and responsive acceptance outstanding.

2026-10-14 L2-016: own course update feed now mixes persisted learner completion/submissions with course-team posts and upcoming deadlines. Grading events excluded without published grade timestamps. Fresh PG, unit, JSX/lint and browser acceptance pending.

2026-10-14 L2-022: responsive Course Overview navigation targets only sections present for an authorized course; no fake mobile content or storage. Unit and fresh-learner PG assertions authored; browser/device and accessibility review remains.

Skipped in this batch for missing canonical source or external dependencies: L1-021 course thumbnail (no verified migrated image association); L12-013/014 saved job (saved-job persistence unconfirmed in registered journal); L13-016 per-drive resume upload (storage/private-object handling missing); L30-034..L30-043 profile verification (no verified state machine, document upload or review process); external sends intentionally untouched without provider/consent contracts.

2026-10-14 L15-003: assessment search saves an own-scoped filter in the page URL without trusting query-selected learners, and restores on browser navigation. No employer submission state inferred. Skip L15-002 provider Completed view: migrated schedule does not record actual provider submissions; requires registered provider receipt/outcome mapping.

2026-10-14 L15-004: expanded assessment urgency controls to include later, past scheduled time, and missing employer date using migrated shortlisted placement rounds and approved-reschedule instants. Skipped provider-completed/received status (L15-002) because no migrated authoritative submission receipt exists. Authored unit and own-learner PG tests; execution and browser acceptance remain.

2026-10-14 L16-002: own interview schedule now has explicit upcoming/past/unscheduled counts with navigable URL view state; past time never treated as confirmed attendance or employer outcome. L16-006 confirmation remains blocked by absence of a registered learner confirmation event. Pure and independently seeded PG tests authored but not executed here.

2026-10-14 L16-003: interview name/employer search is now shareable and recoverable through the URL, bounded to 100 characters and applied only to persisted own shortlisted interviews. Requires executed fresh PostgreSQL, TypeScript/ESLint and Back/Forward browser acceptance. No external messages or provider confirmations attempted.

Skipped high-cost/unregistered rows this batch: L1-021 thumbnail (no trusted registered image association); L13-016 per-drive resume upload (private storage policy); L15-002 provider Completed view (no authoritative submission receipt); L16-006 employer interview confirmation (no registered confirmation state); L18-007 placement-cell consent workflow (no approved consent-state transition/opt-in policy); L30-034..043 verification (private document storage and moderation/verification tables not confirmed). No fake statuses or URLs created.

2026-10-14 L14-002: application filters use URL history and bounded parsing with own-membership-scoped source data. Skipped L1-021 (no canonical image association), L13-016 (private storage/upload approval), L30-034..043 (unmigrated verification/review document state). Fresh-PG and browser acceptance pending.

2026-10-14 L12-022: mobile Drives filters collapse with active-filter count and remain accessible while desktop controls stay shown. Persisted own-college read and pure test authored; browser and disposable-DB execution outstanding. Skipped L13-016: private resume-object upload policy/storage approval absent.

2026-10-14 L14-024: mobile applications filters reveal active URL selections; cards and drawer links use full-width accessible actions. No external sends/storage. Own learner PG and unit tests authored, browser/runtime acceptance pending.

2026-10-14 L5-012: touch-friendly own-course discussion composer with explicit Post and safe message wrapping; does not change write permissions or faculty moderation. Independent learner PostgreSQL test authored; device keyboard/CI acceptance pending. Skipped L2-024 rich authored HTML (unmigrated authoring schema and sanitization contract).

2026-10-14 L6-023: mobile assignment card now surfaces own persisted submission/deadline urgency and uses full-width accessible primary action and drawer links. Explicit skip L1-021 image thumbnail: no registered canonical image association; L2-023/024/025 authored intro/rich HTML/takeaways: no migrated authoring fields or validated sanitization; L13-016 per-drive resume upload: authenticated private storage route/consent approval required; L15-002 provider completed state: provider submissions not migrated; L30-034..043 verification: private proof and review tables not confirmed. Isolated PG, lint/tsc and browser acceptance outstanding.

2026-10-14 L7-018: mobile quiz cards display own attempt availability and published-results-only status, with touch-sized links. Does not invent provider outcomes, scores or send external notifications. Fresh-learner PG and pure-model tests authored; CI and mobile acceptance pending.

2026-10-14 L3-032: mobile Learning Path exposes an ordered, filtered index from real published lesson items and deep links to focused lessons with Next Link. Skipped L3-037 interactive storage-backed video/content overlay: private streaming and authorized file access need a separate browser and storage acceptance pass; do not invent media URLs. Fresh own-learner PG, typecheck, lint, mobile and accessibility acceptance pending.

2026-10-14 L11-015: attention badge and overflow action now expose the true number of own scheduled assessment/interview rounds within seven days rather than misleading three-item count; partial-source failure masks total and overflow. No inferred employer completion. Isolated PG and model tests authored; browser/CI acceptance pending.

2026-10-14 L14-006: own-member Applications view now supports screening-stage sorting using existing persisted journey reads and strict URL enum. Fresh-learner PostgreSQL test and pure models authored; isolated DB and browser acceptance pending. Skipped L13-016 per-drive resume upload (private object storage/consent), L15-002 provider completion (no authoritative submission receipt), L30-034..043 verification (unmigrated review schema and private uploads).

2026-10-14 L12-017: own-college placement drive cards distinguish persisted deadline urgency using server-provided ISO snapshot, without client-clock drift. Skipped L12-013/L12-014 saved jobs: persisted favorites/membership-scope writes not verified in migrated schema. Fresh PostgreSQL, static checks and browser acceptance pending.

2026-10-14 L14-008: authorized Applications header now surfaces saved screened stages with own-ID detail links; does not invent urgent times or recruiter decisions. Skipped L15-014 provider submitted reminder as non-authoritative without external receipt and L18-007 opt-in because registration-consent policy not approved. Unit/isolated-PG and browser acceptance pending.

2026-10-14 L14-019: Applications now opens the exact learner-owned shortlisted interview by persisted application/round ID, preserving generic fallback where no scheduled interview exists. Independent learner PostgreSQL read+denial tests authored. Skipped L16-006 interview confirmation: no registered receipt/attendance state transition; L13-016 private per-drive resume upload: storage and consent approval required. Runtime and browser acceptance pending.

## 2026-10-14 learner batch: explicitly skipped ledger rows and blocking dependencies

The rows below were considered but intentionally not promoted to PARTIAL; they require infrastructure, migrated evidence, or a product decision not delivered by this batch:

- **L1-021:** No trusted migrated course-thumbnail/image association or fallback asset contract.
- **L2-023:** No authored introduction-content field in the migrated course model.
- **L2-024:** No migrated rich-overview HTML field or approved sanitizer/content authoring contract.
- **L2-025:** No authored takeaways-list field; lesson titles cannot be presented as authored outcomes.
- **L12-013:** No verified membership-scoped persisted saved-job write/read contract.
- **L12-014:** No verified membership-scoped persisted saved-job write/read contract or unsave audit.
- **L13-016:** Private resume object storage, upload authorization and consent policy need approval.
- **L15-002:** External assessment provider completion receipts are not migrated; scheduled elapsed time is not a result.
- **L16-006:** No registered learner interview-attendance confirmation state or audit/decision contract.
- **L18-007:** Placement-cell opt-in/consent state transitions and applicable privacy policy are not approved.
- **L30-034:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-035:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-036:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-037:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-038:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-039:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-040:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-041:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-042:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.
- **L30-043:** Profile verification requires migrated private proof documents, reviewer workflow and authoritative verification disposition.

2026-10-14 L14-020: exact own application to published drive and its role choices through scoped persisted `placement_applications.job_id` (not a guessed matching company). Similar-role recommendations remain BLOCKED until approved recommendation criteria and availability rules are registered. Skip L1-021 course image: no canonical migrated image association; L13-016 private resume: storage/consent authorization required; L30-034..043 profile verification: missing trusted document/review state machine.

2026-10-14 L13-015: published Drive detail now preserves only schema-allowed filter/sort/page state when returning to Drives; no caller-college/actor selector. Authored own-learner PG and URL-model tests; app-router/browser and static acceptance pending.
Skipped L12-013/L12-014 saved favorites: registered learner favorite persistence not verified; do not fake saved state. Skipped L13-016 private per-drive resume: storage/consent policy unresolved.

2026-10-14 L16-019: mobile interview drawer prioritizes effective IST persisted schedule and full-width actions; date-only status never implies attendance/completion. Own-learner PG and model tests authored; mobile/CI acceptance remains. Skipped L16-006 confirm attendance: no migrated learner acknowledgement state or employer acceptance record.

2026-10-14 L19-005: learner Placement Rules now distinguishes future eligibility checks from already-submitted applications using own `placement_applications` status via verified scoped journey service. Versioned College-wide rule change and retroactivity remain BLOCKED by missing canonical policy version/effective-date/approval source; explicit College owner decision required. Pure-model and own fresh-learner PostgreSQL tests authored, not executed in this session.
Skipped L15-002 provider completion (external receipt not migrated); L18-007 opt-in policy/consent state not approved; L30-034..043 verification lacks reviewed documents and trusted state machine.

2026-10-14 L16-004: selected owned interview from persisted scoped rounds is highlighted, and filtered-out deep links can be revealed without leaking foreign records. Fresh learner PG and pure-model tests authored. Browser/runtime acceptance pending. Skips: L1-021 has no trusted course image association; L13-016 requires private resume storage; L16-006 lacks audited learner attendance confirmation state; L30-034..043 lack migrated verification review/document contracts.

2026-10-14 L16-005: refreshed minute-by-minute own interview countdown and honest time-window badge from persisted scheduled time and optional duration. No employer attendance/completion inferred. Pure model and self-owned learner PG authored; runtime/browser acceptance pending.

2026-10-14 L16-015: copyable approved-reschedule summary uses persisted scoped exception with original/approved IST times; never includes private join URL, consent, or employer send. Pure model and fresh-learner PG test with own approved request/exception authored; runtime/clipboard acceptance outstanding.

2026-10-14 L16-009: own interview .ics export now folds UTF-8 content lines to RFC5545 75-octet limit and includes calendar method/scale, preserving exact UTC persisted schedule/duration and excluding join links. Pure and fresh-learner PG authored; manual import/CI acceptance outstanding.

2026-10-14 L14-018: own-application assessment action resolves an exact persisted TEST round; does not guess assessment IDs from result history. Skips: L1-021 course thumbnail (no migrated image association); L13-016 resume upload (private-storage authorization absent); L30-034..043 profile verification (private proof/review states not migrated).

2026-10-14 L11-005: own issued offers expiring in the next 24 hours now take hero priority; missing/expired offers are not fabricated. Added fresh-learner offer read and denial PG coverage, pure model tests. Skip L13-016 per-drive resumes (private storage/consent not registered); L30-034..043 verification (document review tables not migrated).

2026-10-14 L12-021: own published Drives distinguish zero published opportunities from filter-excluded opportunities. No fabricated jobs or saved-job state. Skip L12-003/013/014/020 saved favorites: registered private saved-job table not verified; L13-016 per-drive upload: private storage/consent approval missing. Pure and own-fixture PG authored; execution pending.

2026-10-14 L13-012: authorized published job detail displays an honest no-new-application reason from scoped role and deadline state; never treats a withdrawn or rejected application as a new entitlement. Fresh-learner PG and pure-model coverage authored, not yet executed.

2026-10-14 L14-003: own application screening-stage chips and counts use existing persisted learner-scoped journey. Skipped L13-016 (private storage/resume consent), L18-023/024 (no migrated official college notices/dispute source), L30-034..043 (no approved verification/review state). Execution and browser acceptance outstanding.

2026-10-14 L29-016: healthy personal notifications survive optional announcement-source errors, while authorization errors still propagate. Own learner + personal event/notification PG fixture authored; append-only audit event intentionally retained. Browser failure-injection and execution pending. Skipped L18-023/024 college notices/disputes: no migrated authoritative notice source or dispute policy.

2026-10-14 L30-031: Profile now refreshes saved data on tab visibility without refreshing during save/open editor, and reconciles new server document only when the current view was unchanged. No verification/file storage invented. Fresh-learner read PG and pure unit authored; multi-tab/browser test pending. Skipped L30-027 Connect Accounts: connector permissions/linked-identity UX and owner authorization contract not approved.

2026-10-14 L29-009: assessment notification action distinguishes generic assessment page from exact own application+round detail, drops untrusted selector query, and does not claim external provider submission. Fresh own-learner real TEST round and notification PG evidence authored; source/test/browser acceptance pending. Skipped external assessment submit: employer/provider confirmation flow and receipt integration not migrated.

2026-10-14 Support History cancellation: existing request cancellation hardened by live learner entitlement, transactional updatedAt comparison, own-only UI, confirmation and audit. Skipped saved-job write (placement_saved_jobs present only as staged DB08 source, no registered migration), profile proof uploads (private R2 bucket absent), and new email/SMS sends (prohibited by orchestrator decision). PostgreSQL/unit/runtime acceptance pending.

2026-10-14 Support History pagination: fixed hard 30-row truncation using existing own-college requests, schema-validated status/type/page selectors and filter-preserving Next/Previous links. Unit and isolated learner PostgreSQL tests authored; no file or external send added. Runtime/mobile acceptance pending.

2026-10-14 learner notification inbox query: category/unread/search controls now reflect browser history with strict allowed query parameters; own personal notification reads and announcement fallbacks unchanged. No external sending. Unit and fresh-learner PostgreSQL tests authored; browser/static acceptance pending.

2026-10-14 learner inbox read-all: explicit mobile confirmation for existing readAt-audited, own-college scoped idempotent acknowledgement; no external provider or new storage. Fresh PG + unit tests authored; completion requires CI/browser and simultaneous acknowledgement acceptance. Stale replay is a harmless no-op rather than an error by the established notification read policy.

2026-10-14 Profile sections: same-section stale versions now denied transactionally under row lock; other sections preserved with jsonb_set. Optimistic request includes expectedItems; no identity documents/files and no new external sending. Added pure-model and own-learner PostgreSQL tests, multi-tab/CI acceptance pending.
