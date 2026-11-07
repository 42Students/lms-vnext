# UX-G160 — TPO timed restrictions and quick actions

Status: **DOING** in the canonical `docs/tracker.json#uxReview` board. This note records scoped implementation and remaining acceptance, not a DONE claim.

## Files and shipped improvements

- `src/components/tpo/tpo-timed-debar-control.tsx`: create/review duration, reason and lift controls, explicit pending lock, visible IST date guidance, disabled invalid submission, responsive tap targets and restriction history.
- `src/modules/placements/tpo-timed-debar-view-model.ts`: pure IST calendar conversion and typed validation of reason, real dates, future/inclusive end dates, drive counts 1..10,000 and manual lift.
- `src/components/tpo/tpo-topbar-new-menu.tsx`: clearly labelled navigation links separate from the nested follow-up modal, preserving encoded company context and direct follow-up access. **Caveat:** existing `src/components/shell/topbar/tpo-quick-create.tsx` is the mounted global quick-create surface. The scoped legacy-named component must not be counted as a live visual change unless route/render evidence demonstrates mounting.

The existing scoped TPO membership/college checks and strict same-origin API guard are untouched. The server still validates dates, active restrictions and permissions; the client validation is additional UX feedback only.

## Evidence in source

- `tests/tpo-timed-debar-ux.test.mjs`: IST rollover, invalid/expired date, drive-count and manual restriction cases; four isolated Node tests ran green on an equivalent helper copy.
- `tests/unit/ux-g160-timed-debar-validation.test.ts`: tracked Vitest coverage for date boundaries, accessible controls and menu semantics. This test must be run with the current production source on an exact commit SHA.
- Eight current-main safety assertions were inspected green for this group together with UX-G149. This does not replace CI or authenticated browser testing.

## Completion gate

1. Validate `npm run lint`, `npm run typecheck`, `npm test` and the targeted Node test at an exact SHA.
2. Desktop TPO (1280px): open learner participation, demonstrate blank, invalid, expired date, manual and drive-duration feedback; use a disposable test member for create/lift and confirm server persistence/history.
3. Phone TPO (390px and 320px): no horizontal overflow; open, review, cancel, error and successful states readable; keyboard/VoiceOver labels and focus order.
4. Learner/non-TPO and foreign-college permissions: requests must fail without leaking restriction history or applying changes.
5. Evaluate live global quick-create as a **separate rendered surface**; document that this source group contains a legacy component that may not be mounted. No false visual acceptance.
6. Record desktop and mobile browser captures, test commands and exact SHA proof, regression review and security review in the canonical group evidence; transition to DONE only after all are verified.

No exact-SHA CI, authenticated desktop, authenticated mobile or final route-parity result is claimed here.
