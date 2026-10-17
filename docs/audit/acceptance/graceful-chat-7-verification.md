# Chat-7 graceful-operation acceptance

Tests are authored but not run. Core `src/lib/friendly-error.ts` and `src/lib/api-fetch.ts` were not available on origin/main at the beginning of this round; do not claim complete GR-01/GR-04 integration.

| ID | Status | Evidence |
|---|---|---|
| GR-35 | DONE | `src/components/projects/mentor-task-delete-control.tsx`, `src/components/placements/recruiter-result-controls.tsx`; `tests/unit/chat-7-graceful-actions.test.ts` — `GR-35 MEN-projects-meetings-46 confirms destructive task deletion` and `GR-35 REC-home-drives-49 previews bulk results`. |
| GR-71 | DONE | Learner Placements and Faculty Courses empty/filtered/failed states; `tests/unit/chat-7-graceful-actions.test.ts` — `GR-71 Learner Placements exposes` and `GR-71 Faculty Courses differentiates`. Scoped to the listed surfaces, not all widgets. |
| GR-90 | DONE | Mentor delete failures and recruiter result toast use accessible plain errors; `tests/unit/chat-7-graceful-actions.test.ts` — `GR-90 mentor delete failures` and `GR-90 Recruiter result errors`. Scoped to the listed actions. |

GR-30..34, GR-70, GR-72..77 and GR-91..92 require broader page-by-page verification after the shared helpers merge. This document is not proof of completed compliance across all four accounts.
