# 2026-11-04 — Audit/notification selector ambiguity and global skill-usage isolation

**Repository:** `42Students/lms-vnext` — security changes staged for `main`.  
**Status:** Source code committed; adverse/positive unit tests authored; **not yet execution-verified**.  
**Parallel work:** Independent API-read/privacy lane; no edits to shared `docs/tracker.json` while other security lanes own it.

## Vulnerability classes and source corrections

1. **HTTP parameter pollution for scoped audit logs.** `GET /api/activity` previously read the *first* occurrence of `collegeId`, `organizationId`, `actorUserId`, date and cursor parameters with `URLSearchParams.get`. Conflicting legacy aliases (e.g., `actorId` plus `actorUserId`) were silently resolved by precedence. [`65782e6`](https://github.com/42Students/lms-vnext/commit/65782e68b72127a0055e33f80e1f28c68b725108) now returns HTTP 400/private-no-store on duplicate selectors, conflicting aliases or present-empty critical scope/cursor values before the activity read service is called. It retains existing permission and tenant authorization.
2. **Ambiguous notification inbox filters.** `GET /api/notifications` previously silently chose a single value from duplicate class/course/query/view/limit fields; `unreadOnly=garbage` silently became `false`. [`947f01f`](https://github.com/42Students/lms-vnext/commit/947f01fb5dccc264dee61d29d5bcddca7a29ca55) now denies duplicates, competing `query`/`q`, present-empty critical filters and invalid boolean values. The retired refresh `POST` also rejects duplicate view selectors before privilege decisions. Caller-owned inbox services remain unchanged.
3. **Shared parser contract.** [`b7b3e8d`](https://github.com/42Students/lms-vnext/commit/b7b3e8d68968badd5a26c42c583960d04b7d5510) adds `src/lib/security-query-selectors.ts`; this is shape validation only, **not** a replacement for server-owned tenant, resource and actor authorization.
4. **Global skill-usage metadata leakage.** `GET /api/skills?mode=stats` counts usage across the entire `db10SkillUsage` table, not a college-scoped query. Before [`4a84ce6`](https://github.com/42Students/lms-vnext/commit/4a84ce69d5921eee11b31c68e3ce0b51ff6cfa96), College Admin could reach these cross-college totals. The route now requires an active Super Admin context; an ordinary College Admin must receive 403 before touching DB. Ordinary authenticated skill search remains available.
5. **Unbounded skill-import JSON.** The same skills route previously used `request.json()` before validating imported rows, allowing an arbitrary-size untrusted payload to be fully buffered. It now reuses streamed `readBoundedJsonBody` and rejects malformed/oversize requests at 400/413 before import. The final [source-budget correction](https://github.com/42Students/lms-vnext/commit/385874e96d6676b35adb2bbebeee58b65587d851) enforces **4 MiB**, not 1 MiB, to preserve realistic maximum Unicode-rich 1,000-item imports.

## Authored tests and exact-SHA workflow

- `tests/unit/security-private-read-query-boundaries.test.ts`: duplicate/blank tenant and actor selectors, conflicting date aliases, pagination ambiguity, own inbox class/course/query filters, valid legacy aliases and positive read/own stats, wrong-origin rejection.
- `tests/unit/security-skills-catalog-boundaries.test.ts`: forged length, over-4 MiB import, malformed JSON, cross-origin and non-admin import rejection, successful bounded Super Admin import, ambiguous catalog params, College Admin global-stats denial, inactive Super Admin denial, active Super Admin aggregate and normal search.
- `.github/workflows/security-private-query-boundaries.yml`: push/PR-scoped `vitest` for both suites plus full TypeScript, with exact-SHA assertion and read-only GitHub permissions.

**Execution disclosure:** These tests are authored; successful Vitest/TypeScript/production PostgreSQL verification has **not** been observed in this connector session. Other security workflows have previously failed with zero executed steps; this does not prove a code assertion failure or a pass. Do not mark a control verified or assign a CI green status without an actual run receipt.

## Remaining assurance work

- Verify query behavior through a real reverse proxy and both historical adapters. Same-value duplicates are deliberately rejected; update legitimate client callers if they incorrectly produce repeats.
- For global skill statistics, add live seven-account cross-tenant checks verifying that no college-specific context can read platform-wide skill usage. Confirm Super Admin grants are valid, selected, and persisted at request time.
- Validate 4 MiB imports against actual configured ingress limits, valid maximum-size Unicode inputs, and the restricted PostgreSQL application role. Add burst/rate and expensive-query limits at a trusted gateway.
- Run actual focused workflow, fix failures without removing tests, then link a successful pinned commit/run to the **existing** `docs/tracker.json -> security` controls. Do not create another tracker.
