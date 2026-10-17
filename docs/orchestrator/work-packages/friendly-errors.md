# Cross-cutting package: friendly errors (customers must never see raw codes or server details)

Owner concern (2026-10-17): the old LMS showed server error notifications to users; that is bad for a product we sell. vNext must show calm, plain messages, never a raw code (`INTERNAL_ERROR`, `FORBIDDEN`, `HALL_BOOKING_FAILED`), never a stack trace, never a database message.

## Part 1: shared layer (owner: chat-9, first thing next round, on main quickly)
- `src/lib/friendly-error.ts`: `friendlyApiError({status, code})` returning a user message. Mapping: network failure and 5xx and `INTERNAL_ERROR` -> "Something went wrong on our side. Please try again in a moment."; 401 / session codes -> "Your session has ended. Please sign in again."; 403 / `FORBIDDEN` -> "You do not have permission to do this."; 404 -> "We could not find that."; 409 / conflict codes -> "This changed while you were working. Refresh and try again."; 400 / `INVALID_REQUEST` -> "Please check the highlighted fields and try again."; 429 -> "Too many attempts. Please wait a minute and try again." Domain codes keep their own legacy wording where a module mapper exists (`tpo-crm-api-error.ts`, `tpo-messaging-api-error.ts`, `announcement-api-error.ts` ...): the helper must consult those first, then fall back to the generic text above. Never return the raw code.
- `src/lib/api-fetch.ts` (client): `apiFetch(url, init)` that parses the JSON error body, handles network errors, and throws an `Error` whose `message` is already the friendly text; callers keep their `catch (reason) { setError(reason.message) }` shape.
- Every 5xx JSON response carries a short reference id (`requestId`, 8 chars) and the server log line for that error carries the same id; the friendly 5xx text may add "Reference: <id>" so support can trace it. Add it in `src/lib/api-error.ts` (`apiErrorResponse`) and the global/page error boundaries.
- Unit tests: one per mapping row, plus "never returns a string that matches /^[A-Z0-9_]{6,}$/".

## Part 2: adoption (every lane, on the pages they touch, once Part 1 is on main)
Replace every place a client component renders `result.error`, `reason.message` from a raw code, or a literal code string, with `apiFetch` / `friendlyApiError`. A unit test per touched component group: a failed fetch (500, 403, network error) renders the friendly text and never the code. Grep to find them: `grep -rn "result.error\|?? \"[A-Z_]*FAILED\"" src/components`.

## Part 3: visibility (orchestrator, later)
Cloud Logging alert on `severity=ERROR` for `api.unhandled_error` with email to the owner, and the staged DB10 log-alert admin page. Not a lane task.

Until Part 1 is on main: lanes must not add new places that display a raw code; use a short plain sentence of your own and leave a `// friendly-errors` comment to adopt the helper later.
