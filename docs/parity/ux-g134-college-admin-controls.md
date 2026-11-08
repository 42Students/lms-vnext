# UX-G134 — College administration interactive components

**Canonical UX state:** `docs/tracker.json#uxReview.groups[UX-G134]`; owner `chat-ux-college-components-20261108`; status DOING pending executed acceptance.
**Scope:** 15 registered `src/components/college/` UI controls.

## Full registered source review

| Surface | Current recoverability / source decisions |
| --- | --- |
| `college-admin-profile-editor.tsx` | Per-card dirty baseline preserves unrelated profile drafts; changed section writes are versioned; synchronous write lock added to block repeat Save. |
| `college-department-insights.tsx` | Read-only department aggregates preserved; source review did not identify a focused edit. |
| `college-faculty-assignment-actions.tsx` | Duplicate creation is locked through user confirmation and the full sequential result receipt loop, plus guarded assignment deactivation. Partial failure details are retained. |
| `college-faculty-csv-import.tsx` | Existing useGuardedAction, draft revision checking, row status results, safe CSV content and inline validation retained. |
| `college-faculty-reassign-action.tsx` | Existing synchronous mutation lock and confirmation preserved; API status/code mapped to user-safe retry and denial copy. |
| `college-faculty-schedule-reassign.tsx` | Existing 200-session truncation and per-session receipt preserved; API failures now use centralized safe error copy. |
| `college-offering-metadata-action.tsx` | Credits and display-order validation, version precondition, and confirmation retained; raw server error codes no longer shown. |
| `college-person-audit-modal.tsx` | Async request version invalidation preserved; error copies now mapped from status/code, not exposed server payload. |
| `college-person-edit-action.tsx` | Existing guarded edit/save and client confirmation retained. |
| `college-person-profile-overview-modal.tsx` | Request-version guard, read-only profile and learner privacy retained; API failure text sanitized. |
| `college-role-directory-workspace.tsx` | Existing role-aware directory filtering, pagination and actions retained; no change to access scope. |
| `college-student-csv-import.tsx` | Existing guarded action and stale-preview state invalidation retained. |
| `college-student-import-history.tsx` | Existing AbortController and request version prevent stale private receipts after dialog close. |
| `college-student-register-form.tsx` | Added synchronous lock for the full confirmation-and-write lifecycle to prevent duplicate registrations while prompt is open. Partial registration still requires checking student roster before retry. |
| `use-college-confirmation.tsx` | ConfirmDialog keyboard/focus behavior and async cancel resolution retained, no native blocking prompt. |

## Regression and browser acceptance

- `tests/unit/ux-g134-college-controls.test.ts` documents guards, versioning, safe errors and denied statuses; assertions remain independent of production data.
- `tests/e2e/ux-g134-college-controls.spec.ts` exercises college-admin student registration / faculty assignment / own profile / people directory across desktop 1280 and mobile 390; invalid registration form, plus Learner-denied people export.
- `.github/workflows/ux-g134-college-acceptance.yml` is an exact-SHA workflow with disposable PostgreSQL 17, generated auth keys, scoped lint, typecheck, Vitest, Chromium role cases and retained screenshots.
- Group closure requires an **executed successful exact-SHA run**, desktop/mobile artifacts, relevant negative tests, regression/security review and a canonical completion evidence object. Do not infer a pass from these authored test files or this source-only audit.

## Security/regression notes

- All existing service-side college permission/tenant checks remain authoritative; UI guard is a UX duplicate-submit protection, not a security control.
- Unknown backend API codes are mapped using `friendlyApiError`, preventing accidental machine-code/private detail leaks while preserving actionable permission, conflict and session recovery copy.
- Per-row faculty bulk failures stay visible; no false atomicity is claimed, and repeated attempts must be reviewed against actual receipts.
- The source changes do **not** establish global security or deployed release certification.
