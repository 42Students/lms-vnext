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

## Additional interactive acceptance package — 8 November 2026

- Development-only `/e2e/ux-g149-placement-recovery` mounts the **real** three TPO components with synthetic applicants/offer previews/future calendar dates. It returns not-found outside development or unless `UX_G149_PLACEMENT_FIXTURE=1`. No source code weakens any server-side guard, role or tenant membership.
- `tests/e2e/ux-g149-tpo-placement-recovery.spec.ts` exercises seven browser scenarios: partial 101-row import (100 confirmed, second POST unknown, no duplicate retry), confirmation cancellation, stale waitlist release with preserved preview token and fail-closed UI, slow calendar lead response supersession after a new hour, mobile and desktop no-overflow, and anonymous POST denial at protected endpoints. All mutating calls from the fixture are intercepted and responses controlled; this does not send a real offer.
- `.github/workflows/ux-g149-placement-recovery-acceptance.yml` adds exact-source SHA, scoped lint, whole-project TypeScript, both source-safety suites, existing placements regression and seven Chromium scenarios with saved responsive screenshots and failure traces.
- Status stays **DOING** pending an actual green job, authenticated TPO + foreign-college/learner server-policy checks, an end-to-end accepted mutation in a disposable scoped DB, and keyboard/refresh visual review. A synthetic mocked browser proof alone cannot close these transaction-sensitive placement surfaces.

## Executed regression and defect repair — 8 November 2026

- Run [42461276482](https://github.com/42Students/lms-vnext/actions/runs/42461276482) executed exact-SHA lint, whole-project TypeScript and 16/16 source/placement unit checks **green**. Its browser job found a real UI race: the `FileUpload` component clears its file on being disabled while reading; the resulting null callback incremented `fileRevision` and discarded the successfully parsed selection preview.
- Fixed the race in `src/components/placements/tpo-selection-import.tsx`: a synthetic null picker reset while `reading` does not invalidate the pending read. The focused unit suite also asserts this guard. This change makes the original 101-row selection preview reachable without loosening the CSV validation or server rights.
- Subsequent exact-SHA run [42461747755](https://github.com/42Students/lms-vnext/actions/runs/42461747755) again passed scoped lint/TypeScript and 16/16 unit/source tests. The browser then reached the original confirmation dialogs, revealing ambiguous Playwright selectors that matched both the underlying opener and an overlay confirm button. The actual UI correctly kept the waitlist opener disabled after uncertain POST. Tests were corrected to select the opener explicitly and retain the disabled assertion.
- Latest browser-spec correction commit: `1ee7b8c2a536ea257708c5d6f4315545a70dcac3`. Dedicated workflow 42462557010 was queued when last checked. **No full browser or group DONE claim** until the subsequent successful execution and all remaining server/tenant/transaction checks are attached.
