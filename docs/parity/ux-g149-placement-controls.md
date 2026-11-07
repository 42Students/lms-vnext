# UX-G149 — Placement staff controls acceptance

Status: **DOING**. Canonical status remains `docs/tracker.json#uxReview`; this note is implementation evidence, not an independent status tracker.

## Scope, rationale and changes

- `src/components/placements/tpo-selection-import.tsx`: prevents a slow, superseded CSV read from overwriting the latest preview; rejects resubmission after a partially confirmed import until the selection register is reloaded. Users see the confirmed chunk count and a reconciliation action.
- `src/components/placements/tpo-waitlist-promotion-control.tsx`: ambiguous error or confirmed success blocks further offer release against a stale preview token. Provides full reload to re-check seats, rank and issued offers.
- `src/components/placements/tpo-week-hour-calendar.tsx`: invalidates older lead requests whenever a new hour opens or an unfinished draft closes. Clarifies keyboard alternatives to drag-and-drop.

These changes do not add privileged API access, weaken CSRF/origin checks, change membership/tenant authorization or alter DB models. API decisions and tenant scoping remain authoritative server-side. Confirmed and uncertain mutations deliberately fail closed rather than risk duplicate offers/selections.

## Automated evidence

- Added `tests/ux-g149-placement-recovery.test.mjs` (Node source contracts) and `tests/unit/ux-g149-tpo-placement-recovery.test.ts` (Vitest source contracts, executed by `npm test` in CI).
- Direct current-main inspection verified fourteen source assertions on revision guards, partial/ambiguous commit locks, server-issued preview tokens and lead-request invalidation. These are **source checks**, not browser execution.
- Existing relevant suites: `tests/unit/chat5-placements-ux-workflows.test.ts`; TPO calendar/selection browser coverage under `tests/e2e`.

## Acceptance still required before DONE

1. **Exact-SHA checks:** `npm run lint`, `npm run typecheck`, `npm test` and `node --test tests/ux-g149-placement-recovery.test.mjs` must pass with links/logs for that SHA. Do not extrapolate from queued/pending CI on rapidly changing `main`.
2. **Desktop (1280px):** import a valid selection CSV, test unmatched/duplicate rows, confirm a partial server error and verify there is no second mutation until full reload; verify error and success notices.
3. **Mobile (390px, also 320px):** verify horizontal scrolling, no page overflow, accessible review/confirmation, keyboard/focus return and safe waitlist button states.
4. **Calendar:** open hours rapidly with delayed recruiter API responses, confirm the newer slot's leads are not overwritten, close/reopen, and exercise keyboard and drag interaction.
5. **Negative server cases:** cross-tenant / non-TPO access rejected; conflicting waitlist preview token and repeated selection submissions must remain rejected by the server (UI is defense in depth).
6. Confirm and link desktop/mobile capture paths plus regression/security reviews in the canonical `uxReview.groups[UX-G149].evidence` record; only then transition DOING to DONE.

No browser or exact-SHA end-to-end pass is asserted by this document.
