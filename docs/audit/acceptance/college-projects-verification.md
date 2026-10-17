# College Projects — chat-9 source verification (round 3)

Tests are authored but **not executed** by this builder. Orchestrator must run unit and DB integration suites.

| ID | Status | Evidence (path and gap-named test) |
|---|---|---|
| COL-projects-03 | OPEN | Mentor-only task creation gate remains inside admin workspace; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-03 retains an unresolved mentor-only task creation gate despite admin access to other editors` |
| COL-projects-06 | DONE | `src/components/projects/class-team-workspace-creator.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-06 creates one workspace per student only after scoped cohort preflight and confirmation` |
| COL-projects-07 | DONE | `src/components/projects/project-create-control.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-07 permits primary mentor, class, ACTIVE status and learner selection at creation` |
| COL-projects-12 | DONE | `src/components/projects/project-admin-readiness-page.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-12 exposes active readiness overrides with CSV and workspace management` |
| COL-projects-13 | DONE | `src/components/projects/project-admin-submissions-page.tsx`; `tests/unit/chat9-college-projects-s2-closure.test.ts` — `COL-projects-13 restores submission summary counters, revision fields and direct review controls` |

| COL-projects-01 | DONE | Review and lock policy is implemented, guarded and model-tested; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-01 allows only valid final submission review and lock transitions` |
| COL-projects-02 | DONE | Full College Admin workspace summary editor persists checked metadata; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-02 exposes full persisted College Admin workspace summary editing` |
| COL-projects-08 | OPEN | Visible-page CSV, card/list view and row sizes added; template tags and legacy status semantics are not complete; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-08 exports the scoped visible workspace page with safe CSV and list sizing` |
| COL-projects-09 | DONE | Primary mentor designation takes precedence in college snapshot; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-09 uses the designated primary mentor name rather than a co-mentor fallback` |
| COL-projects-10 | OPEN | Stalled/blocker/review buckets, actions and CSV source verified; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-10 provides risk buckets, blocker detail, mentor reassignment and page export`; partial source evidence only, remaining legacy parity must be verified. |
| COL-projects-11 | OPEN | Persisted blocker signal, inactive days and review source verified; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-11 counts persisted blocker signals alongside inactivity and review risk`; partial source evidence only, remaining legacy parity must be verified. |
| COL-projects-14 | DONE | Admin submission review controls and delivery evidence verified; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-14 renders administrator review actions inside Delivery without opening a second queue` |
| COL-projects-17 | DONE | Range chips, importance indicator and page CSV source verified; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-17 restores audit range chips, destructive markers and scoped export` |
| COL-projects-18 | OPEN | Generic activity-type filter exists, but resource-specific action coverage unverified; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-18 retains an activity-type and time filter but needs resource-change-specific verification` |
| COL-projects-19 | OPEN | Workspace, submission and template legacy page titles corrected; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-19 restores workspace, submissions and template page labels`; partial source evidence only, remaining legacy parity must be verified. |
| COL-projects-20 | OPEN | Missing membership now shows a recovery alert and dashboard link; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-20 shows a recoverable no-college message without redirecting silently`; partial source evidence only, remaining legacy parity must be verified. |
| COL-projects-21 | OPEN | Archived shortcut exists; deleted-workspaces and full-page creation semantics still missing; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-21 gives archived-workspace recovery and the existing creation/reassignment actions` |
| COL-projects-22 | NOT-A-GAP | Mentor/class/template filter was not present in legacy and remains a possible future improvement; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-22 is an improvement, not a missing legacy mentor/class/template filter` |
| COL-projects-23 | OPEN | Responsive overflow wrappers exist; 375px browser acceptance not done; `tests/unit/chat9-college-projects-round4-evidence.test.ts` — `COL-projects-23 uses responsive wrappers but retains browser width acceptance as open` |

Round 4: College workspace list now offers formula-safe visible-page CSV, table/cards, configurable row sizes, archived shortcut and no-membership recovery. All unit tests authored but not run. Mentor-only task authoring, exact resource audit, deletion semantics, and 375px browser pass remain open.

## Round 5 (2026-10-17)
| COL-projects-16 | DONE | Section-count table, GET search and filtered, formula-safe BOM CSV: `src/app/(authenticated)/college/projects/templates/page.tsx`, `src/modules/projects/project-template-catalogue-model.ts`, `tests/unit/chat9-college-projects-template-catalogue.test.ts` — `COL-projects-16 counts all template sections, filters on the server and exports only visible rows`. |
| COL-projects-08 | OPEN | Added template labels to cards/table from college-assigned template identity, `tests/unit/chat9-college-projects-template-catalogue.test.ts` — `COL-projects-08 renders template tags in both list and cards without introducing a new status`; legacy READY/BLOCKED status mapping still unresolved. |

| COL-projects-15 | OPEN | Workspace Team now links to preselected, UUID-validated tenant-scoped reassignment; `tests/unit/chat9-college-project-team-entry.test.ts` — `COL-projects-15 links workspace Team to an authorized preselected reassignment without inferring a different tenant`. Roster/change-role modal parity remains. |
