# Chat-3 unit failures Round 9

- `TPO-drives-29/30/38`: preserved portal name/link wording and added `target="_blank" rel="noopener noreferrer"` to the external employer portal.
- `api-origin-guard`: mutating POST and DELETE assignment-material routes now check `isSameOriginRequest` at their exported handler boundaries as well as the shared helper; cross-origin requests continue to return 403.
- `TPO-drives-45`: the existing one-time 11:59 PM IST selection and restored-draft token already match the test's expected source contracts; no regression change necessary.
- `TPO-drives-51`: the existing college create route still requires College Admin membership and renders the scoped workspace.
- `COL-people-20`: grant and revoke still require `admin-scope.select` before a membership write, and legacy copy is retained.

Focused regression cases added in `tests/unit/chat3-round9-origin-and-portal-regression.test.ts`. This is source-level review; test runner and device acceptance have not been executed.
