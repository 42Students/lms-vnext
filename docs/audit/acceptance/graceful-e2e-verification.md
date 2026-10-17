# Graceful-operation E2E verification — chat-15

Status column is an **authoring/ownership queue** and not executed acceptance. The orchestrator must independently run this suite at a pinned merged commit, report passing/failing/skipped cases and record source SHA before declaring any release gate closed. All items below are **not yet certified**; the browser tests were authored but not run by chat-15.

| ID | Status | Evidence: file + test |
| --- | --- | --- |
| GR-80 | BLOCKED | Authored: `tests/e2e/graceful-public.spec.ts` (`GR-80 public sign-in ...`), `graceful-role-saves.spec.ts` (`GR-80 <role> ... protects unsaved input`, `unknown record link`), `graceful-faculty.spec.ts` (`GR-80 Faculty assignment authoring ...`), `graceful-tpo.spec.ts` (`GR-80 TPO ... recoverable failure`), `graceful-mentor.spec.ts` (`GR-80 Mentor ...`), `graceful-recruiter.spec.ts` (`GR-80 Recruiter ...`). Blocked pending shared helper adoption, verified role fixtures and executed acceptance. |
| GR-81 | DONE | Authored: `tests/e2e/support/no-raw-error.ts` + `tests/e2e/graceful-helper.spec.ts`, tests `GR-81 rejects a raw error code ...`, `GR-81 rejects stack frames ...`, `GR-81 accepts actionable ...`. Not run; DONE = source authored only. |
| GR-82 | BLOCKED | Authored: `tests/e2e/graceful-production.spec.ts`, tests `GR-82 sign-in is branded...`, `GR-82 production does not serve JavaScript source maps`, `GR-82 production JSON 500 shows a reference id`, `GR-82 stale chunk recovers...`. Requires orchestrator-hosted real production build and executed smoke. |
| GR-83 | BLOCKED | `tests/e2e/README-graceful.md` describes cross-lane helper/unit/integration requirements. Helper test source is assigned to chat-14 and must be executed/certified by orchestrator; chat-15 cannot claim it. |

## Browser evidence

- Source branch: `chatgpt/chat-15-b`.
- Test execution: **NOT RUN by this lane** (per owner instruction).
- Browser verdict: **UNVERIFIED** until orchestrator runs the suite after required parallel branches merge.
