# UX-G004 — Activity Log → event detail

**2026-11-07 | owner:** `ux-activity-group-chat-2026-11-07` | **canonical status:** `docs/tracker.json#uxReview.groups[UX-G004]`.

## Six registered surfaces

- `PAGE-0003` — `/activity`, the scoped feed, raw audit log and search/filter form.
- `PAGE-0002` — `/activity/[eventId]`, scoped individual event detail.
- `ROUTE-STATE-0005` and `ROUTE-STATE-0006` — Activity Log error and loading.
- `ROUTE-STATE-0003` and `ROUTE-STATE-0004` — Event detail error and loading.

The existing error routes retain `GracefulErrorBoundary` and the loading routes retain bounded `GracefulPageLoading`. Detail loading now has a working Activity Log breadcrumb.

## Source improvements

1. Category and range links retain the authorized investigator's module, importance, event/entity, actor and tenant selection. The previous implementation silently discarded these advanced filters. Cursor pagination is intentionally reset on query changes, and the scoped helper excludes super-admin-only search fields for lesser roles and never propagates a forged college parameter over a pinned admin scope.
2. Seven-day and 30-day presets are inclusive (today plus 6/29 earlier calendar days). Custom date inputs no longer appear as the 30-day preset. A default rolling window remains visibly selected after category changes; all-time investigations visibly select the all-time date option.
3. `Reset` retains a super-admin's explicit college filter and current raw/grouped mode while clearing investigative filters. Empty feed recovery uses the same scope-respecting destination.
4. On phones, raw audit log results have labelled readable cards and same-tab event links rather than depending on a 1120px wide table. The desktop forensic table retains its eight historical columns and adds a direct event drill-down without changing CSV schema.
5. Event detail metadata has a named, keyboard-focusable scrolling region with a visible focus outline. All original event labels, timestamp semantics, tenant rules and redaction remain intact.

## Regression / evidence gates

- Pure URL semantics: `tests/unit/UX-G004-activity-navigation.test.ts` covers retained query context, cursor reset, college scope, least-privilege filter fields, raw/grouped state and date changes.
- Existing source contracts: `tests/unit/UX-activity-index-01.test.ts`, `tests/unit/UX-activity-event-detail-01.test.ts`.
- Browser: `tests/e2e/ux-activity-journey.spec.ts` targets 1280px and 320/390px, keyboard focus, mobile overflow, raw-event drill-down when records exist, and learner denial.
- Workflow: `.github/workflows/ux-activity-acceptance.yml` runs source lint, TypeScript, focused Vitest, disposable PostgreSQL-backed authenticated Playwright, and uploads viewport evidence.
- **Closure rule:** Mark `DONE` only after checking a successful exact-SHA workflow run, screenshots for 320/390/1280px, meaningful detail navigation with a seeded event, and no regression to College Admin/Super Admin permissions. Without those receipts, retain `DOING`, regardless of commits.

**Out of scope:** DB/API activity taxonomy or CSV authorization, the legacy audit storage gaps, and wider security certification. UI changes must not be interpreted as closing those independent workstreams.
