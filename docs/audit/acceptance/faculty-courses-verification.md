# Faculty Courses — chat-7 acceptance evidence

This file records source-level verification; orchestrator tests, DB integration and browser behavior have not been executed.

| ID | Status | Evidence (file + gap-named test) |
|---|---|---|
| FAC-courses-01 | DONE | `src/components/courses/faculty-course-tab-navigation.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-01 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-03 | DONE | `src/components/courses/faculty-course-list.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-03 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-04 | DONE | `src/components/courses/faculty-course-list.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-04 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-05 | DONE | `src/components/courses/faculty-course-list.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-05 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-06 | DONE | `src/components/courses/faculty-course-list.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-06 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-08 | DONE | `src/components/courses/faculty-course-list.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-08 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-11 | DONE | `src/components/courses/faculty-course-workspace.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-11 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-12 | DONE | `src/components/courses/faculty-course-workspace.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-12 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-13 | DONE | `src/components/courses/faculty-course-workspace.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-13 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-15 | DONE | `src/components/courses/faculty-lesson-authoring.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-15 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-16 | DONE | `src/modules/courses/faculty-live-mutation-model.ts`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-16 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-18 | DONE | `src/components/courses/faculty-lesson-video-manager.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-18 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-20 | DONE | `src/components/courses/faculty-lesson-video-manager.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-20 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-22 | DONE | `src/components/courses/faculty-item-actions.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-22 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-23 | DONE | `src/components/courses/faculty-lesson-authoring.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-23 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-24 | DONE | Accessible discard-draft dialog replaces native confirmation while keeping unsaved details until explicit approval; \`tests/unit/chat-7-graceful-actions.test.ts\` — \`GR-35 FAC-courses-24 uses a real draft-discard dialog and keeps unsaved input until confirmation\`;  `src/components/courses/faculty-lesson-authoring.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-24 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-25 | DONE | `src/components/courses/faculty-lesson-authoring.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-25 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-26 | DONE | `src/components/courses/faculty-course-home-signals.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-26 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |
| FAC-courses-34 | DONE | `src/components/courses/faculty-course-tab-navigation.tsx`; `tests/unit/faculty-courses-chat7-acceptance.test.ts` — `FAC-courses-34 maintains the faculty course behavior`. Tests authored but not run; source evidence only. |

Not verified: resource uploads (requires private bucket and scanning), enrollment/roster privacy, remaining open rows, and live failure recovery on all faculty pages.

| FAC-courses-14 | BLOCKED | Uploaded resource materials require a private scanned storage bucket. \`tests/unit/chat-7-storage-blockers.test.ts\` — \`FAC-courses-14 secure file provider pending\`. |
## Round 5 — shared safe errors
`src/components/courses/learner-course-api.ts` no longer forwards arbitrary server-authored issue messages. Known course domain codes retain their legacy user copy, and unknown errors use `friendlyApiError`. `src/components/courses/faculty-lesson-authoring.tsx` uses `apiFetch` on saves and keeps the accessible discard confirmation. `tests/unit/faculty-courses-chat7-round5-friendly.test.ts` contains tests `FAC-courses-23 GR-04`, `FAC-courses-15 GR-01`, `FAC-courses-24 GR-35`. Tests were authored, not run; remaining unrelated Faculty Courses gaps stay open.

| FAC-courses-R01 | DONE | `src/components/courses/faculty-course-home-signals.tsx`; `tests/unit/faculty-courses-chat7-risk-performance.test.ts` — `FAC-courses-R01 separates critical and moderate learner risk and has a true zero-risk empty state`. Tests authored, not run. |
| FAC-courses-R02 | DONE | `src/components/courses/faculty-course-home-signals.tsx`; `tests/unit/faculty-courses-chat7-risk-performance.test.ts` — `FAC-courses-R02 shows strongest and weakest performance with a learner distribution drilldown`. Tests authored, not run. |
| FAC-courses-29 | DONE | `src/components/courses/faculty-course-roster.tsx`; `tests/unit/faculty-courses-chat7-r7.test.ts` — `FAC-courses-29 confirms the audited source behavior`. Tests authored, not run. |

| FAC-courses-31 | DONE | `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`; `tests/unit/faculty-courses-chat7-r7.test.ts` — `FAC-courses-31 confirms the audited source behavior`. Tests authored, not run. |

| FAC-courses-R05 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/faculty-courses-chat7-r7.test.ts` — `FAC-courses-R05 confirms the audited source behavior`. Tests authored, not run. |

| FAC-courses-R06 | DONE | `src/components/courses/learner-course-discussion.tsx`; `tests/unit/faculty-courses-chat7-r7.test.ts` — `FAC-courses-R06 confirms the audited source behavior`. Tests authored, not run. |

| FAC-courses-21 | NOT-A-GAP | `src/components/courses/faculty-item-actions.tsx`; `tests/unit/faculty-courses-chat7-visibility-r7.test.ts` — `FAC-courses-21 matches the reviewed contract`. Legacy has no visibility toggle for non-video content; existing publish/archive behavior and video-only extra are intentional, not a parity requirement. |

| FAC-courses-27 | DONE | `src/modules/courses/faculty-course-home-service.ts` and `src/components/courses/faculty-course-home-signals.tsx`; `tests/unit/faculty-courses-chat7-partial-signals.test.ts` — `FAC-courses-27 retains successful source responses when attendance or an assignment fails`, `FAC-courses-27 shows Retry signals and never describes failed counts as zero or All clear`. Tests authored, not run. |

| FAC-courses-09 | DONE | `src/modules/courses/faculty-course-card-summary-service.ts`, `src/modules/courses/faculty-course-card-summary-model.ts`, `src/app/(authenticated)/teacher/courses/page.tsx`; `tests/unit/faculty-courses-chat7-batched-list.test.ts` — `FAC-courses-09 counts shared and exact Section records without leaking neighbouring deliveries`, `FAC-courses-09 uses fixed batched queries not one full workspace load per card`. Tests authored, not run. |
