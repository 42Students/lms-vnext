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

| GR-04 | DONE (TPO debar forms) | Tagged participation and timed debar forms use shared apiFetch with safe 409/no-JSON paths; `tests/unit/chat12-debar-error-round3.test.ts` named `GR-04` |
| GR-32 | DONE (TPO debar forms) | Stale decision retains reason and offers retry; `tests/unit/chat12-debar-error-round3.test.ts` named `GR-32` |

| GR-30 | DONE (four chat-12 mutation controls) | `src/hooks/use-guarded-action.ts` invoked on Notes, Nudges, Bulk Verify and Add-to-Drive; `tests/unit/chat12-round3-guarded-actions.test.ts`, named `GR-30` |
| GR-31 | OPEN (partial) | Four covered controls use synchronous in-flight locking; other TPO actions still require adoption; `tests/unit/chat12-round3-guarded-actions.test.ts`, named `GR-31` |

| GR-04 | DONE (chat-12 bulk action panel) | `apiFetch` for preview/confirm/share; `tests/unit/chat12-round4-bulk-safety.test.ts` named `GR-04` |
| GR-30 | DONE (bulk action, saved view delete, nudges) | Guarded Action hook; named `GR-30` in `tests/unit/chat12-round4-bulk-safety.test.ts` |
| GR-35 | DONE (nudge and saved-view delete) | In-app Dialog confirmation instead of native window.confirm; named `GR-35` in `tests/unit/chat12-round4-bulk-safety.test.ts` |

| GR-30 | DONE (TPO Requests and Verification) | `useGuardedAction` on decision and review confirm; `tests/unit/chat12-round4-request-guards.test.ts` named `GR-30` |
| GR-31 | OPEN (partial) | Immediate-approval and modal decision both guarded; other TPO actions need audits; `tests/unit/chat12-round4-request-guards.test.ts` named `GR-31` |

| GR-30 | DONE (inline after-college editor) | guarded save prevents repeat; `tests/unit/chat12-round4-after-college.test.ts` named `GR-30` |
| GR-35 | DONE (inline after-college editor) | accessible confirmation replaces native confirm; `tests/unit/chat12-round4-after-college.test.ts` named `GR-35` |
| GR-90 | DONE (inline after-college editor) | failed save is role alert and selected value persists; `tests/unit/chat12-round4-after-college.test.ts` named `GR-90` |
