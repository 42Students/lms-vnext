# UX-G015–G024 and UX-G029 — authenticated error recovery checkpoint

**Date:** 2026-11-08  
**Claim owner:** `chat-ux-admin-college-ten-20261108`  
**Canonical state:** All ten groups remain **DOING** in `docs/tracker.json#uxReview.groups`. This is an implemented source-level improvement, **not group UX closure**.  
**Source review HEAD:** `53cd6d2ce3458c90c4ca9a11273dc5e011fa75d3` (other chats also write `main`).

## Scope

| Group | Journey | Error boundaries inspected |
| --- | --- | ---: |
| UX-G015 | Admin placements operations, interviews, job settings | 6 |
| UX-G016 | Admin placement job workspace, joining | 5 |
| UX-G017 | Admin joining, offers and retention | 5 |
| UX-G018 | Admin screening, seasons and shortlist | 6 |
| UX-G019 | Admin student lookup and project detail | 6 |
| UX-G020 | Admin project oversight and submissions | 5 |
| UX-G021 | Admin project template workspace | 6 |
| UX-G023 | Admin workspace creation and academic directories | 6 |
| UX-G024 | Admin settings, students and tenant setup | 5 |
| UX-G029 | College announcements, assignments and attendance | 6 |
| **Total** | | **56** |

## Fix

- Previously, a route-level `GracefulErrorBoundary` without `insideShell` could render a **full-screen public-style 500** on authenticated admin screens, hiding the signed-in navigation and ignoring the role-scoped return route. Changed the owned boundaries to use `insideShell` and safe parent links, with `showHeader={false}` when a route already provides a page header.
- The custom `ErrorState`/error screens frequently offered **Retry only**, leaving users trapped if a service continued to fail. They now retain Retry and show a mobile-friendly secondary link to a stable authorized parent route or dashboard.
- **54 changed `error.tsx` files** in the ten scoped groups. The two unchanged error boundaries already had appropriate in-shell/secondary navigation.
- No schema, API, tenant-scope, authentication, authorization, permission, row-level-security or data-writing logic was changed. Links are navigation only, not authorization bypasses.

## Verification performed

- Read the live canonical tracker and verified these ten groups remained assigned to this chat.
- Read back **56/56** error source files through the GitHub connector after the edits; all passed the static checks for a retained `reset` action and either explicit `insideShell` for the shared error component or a return link for custom recovery.
- Added `tests/ux-admin-college-error-recovery.test.mjs`, a reusable Node source contract test. **The Node test was authored but not executed in a full repository checkout here.**
- GitHub commit statuses and associated PR-triggered workflow runs checked after source changes: **none were reported**. This is not a passing CI result.

## Not yet verified — blockers to DONE

1. Execute `node --test tests/ux-admin-college-error-recovery.test.mjs`, the affected lint/typecheck checks, and existing page/unit regressions against one recorded source SHA.
2. Render all affected error states under their actual authenticated routes, including forced data failures, at desktop **1280×800** and mobile **390×844**; save screenshots, check horizontal overflow, focus/keyboard traversal, tap targets, Retry and parent navigation.
3. Exercise representative forbidden-role, wrong-college and revoked-scope cases. A safe return link must **not** be treated as proof that underlying role/tenant boundaries passed.
4. Review each group's **page, loading, empty, form, overlay, filter, deep-link and success states** with production-safe fixtures. This source pass covers error recovery only and does not fulfill complete journey acceptance.
5. Record exact executed test and browser proof, regression/security review and commit SHA inside the account parity contract, then use the canonical group transition to mark each group DONE separately.

Do not count this file, the source-readback assertions, the existing engineering task totals or a test-only commit as evidence that the ten groups are closed.
