# Chat-12 graceful-operation evidence (Students, Requests, Verification)
Tests were authored but not executed by this lane. These entries describe touched-page adoption, not a global platform-wide sign-off.

| ID | Status | Evidence |
|---|---|---|
| GR-19 | DONE (Requests only) | `src/app/(authenticated)/tpo/requests/loading.tsx`; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-19` |
| GR-20 | DONE (Requests only) | `src/app/(authenticated)/tpo/requests/error.tsx`; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-20` |
| GR-31 | OPEN (partial) | Pending guard exists on nudge; shared hook not yet on main; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-31` |
| GR-32 | DONE (import control) | Conflict preserves choices and reports a calm message; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-32` |
| GR-64 | DONE (TPO CSV exports) | Content-type-checked downloads, failed response stays on page; `tests/unit/chat12-tpo-safe-export.test.ts`, `GR-64` |
| GR-71 | DONE (TPO request/verification screens) | Loading, empty, failed, filtered-empty states; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-71` |
| GR-72 | OPEN (partial) | Bulk verification receipt can show per-row failures; server page sections still need independent error boundaries; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-72` |
| GR-73 | DONE (TPO requests/verification filters) | Route boundary Retry preserves URL state; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-73` |
| GR-90 | DONE (touched inline messages) | Errors use role alert; `tests/unit/chat12-graceful-tpo.test.ts`, `GR-90` |
| GR-91 | DONE (touched retry and export) | Keyboard-visible focus and Retry; `tests/unit/chat12-tpo-safe-export.test.ts`, `GR-91` |

Still required: shared `apiFetch` and `useGuardedAction` adoption after chat-14 helpers land; independent orchestrator browser failures for final acceptance.

| GR-04 | DONE (chat-12 Students controls) | eight client components use `apiFetch`; `tests/unit/chat12-round3-api-fetch.test.ts` named test `GR-04` |
| GR-09 | DONE (chat-12 Students controls) | no raw `body.error` or `result.error` used in touched TPO students controls; `tests/unit/chat12-round3-api-fetch.test.ts` named test `GR-09` |

| GR-04 | DONE (chat-12 Requests & Verification) | decision POST, review GET and review POST use apiFetch; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `GR-04` |
| GR-32 | DONE (chat-12 Requests & Verification) | 409 keeps edits in Requests and resets stale review details for safe retry; named test `GR-32` |
