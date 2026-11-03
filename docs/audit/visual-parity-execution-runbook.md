# Visual parity execution runbook — old LMS reference versus vNext

**Reference:** `parity-baseline` (independent history; never merge into `main`).  
**Policy:** Follow `PIXEL_PARITY_MASTER_PLAN.md` on the reference branch and `docs/planning/clone-parity-protocol.md` on main. This tooling diagnoses *visual* differences; it cannot by itself certify functional or account parity.

## 1. Sources, environment and prerequisites

- A local checkout of the vNext implementation branch with dependencies installed (Node 22, Playwright Chromium).
- A **detached** worktree or directory containing the screenshot reference branch:
  `git fetch origin main parity-baseline`
  `git worktree add --detach ../lms-parity-baseline origin/parity-baseline`
- Deterministic test accounts, authorized tenant/role membership, and safe/nonproduction database fixtures.
- For protected routes, an existing locally generated Playwright `storageState` JSON obtained through the project's safe E2E login setup. Do not commit this file.
- Use exact 1280 × 800 capture conditions before attempting mobile or 1366 × 768 comparisons.

**Never use production credentials, unrestricted cross-tenant cookies, real outbound messaging or real business mutations just to produce visual screenshots.** Stored auth state, captured page text and screenshots may contain personal information; keep evidence in controlled locations and avoid publishing it in public CI artifacts.

## 2. Check integrity of the reference tree

Run:

`npm run test:parity:visual`

`npm run parity:visual:inventory -- --root ../lms-parity-baseline --json /tmp/visual-parity-inventory.json`

The inventory command checks:
- all queue-listed package documents, roles and route annotations;
- all screenshot paths referenced by packages;
- PNG header dimensions and 1280 px reference width;
- duplicate/missing/unreferenced screenshot files;
- image/package totals against the branch summary;
- old-only/vNext-only route inventory counts;
- capture coverage and known flagged states.

The local audit is read-only. Any `MISSING_IMAGE`, `INVALID_PNG`, `UNREFERENCED_IMAGE`, `PACKAGE_ROUTE`, or unexpected count is a **baseline mapping blocker**; reconcile before making parity claims. A `NON_REFERENCE_WIDTH` requires investigating the actual capture width, not automatically resizing it.

## 3. Capture the candidate vNext route (no mutations)

For a safe, query-free localhost candidate:

`npm run parity:visual:capture -- --url http://localhost:3000/mentor/calendar --state tests/.auth/mentor.json --out /tmp/mentor-001`

Against a specific old image:

`npm run parity:visual:capture -- --url http://localhost:3000/mentor/calendar --state tests/.auth/mentor.json --reference ../lms-parity-baseline/old/mentor/_mentor_calendar__base__9def459d92.png --out /tmp/mentor-001`

The capture uses:
- Chromium, 1280 × 800, device scale 1;
- locale en-IN, Asia/Kolkata timezone, light theme and reduced motion;
- wait for DOM readiness, fonts, image completion and layout frames;
- no automatic click, submit, save or remote API manipulation;
- viewport capture by default; `--full-page` is explicit;
- optional `--scroll-y N` for a known scroll state;
- safe non-secret query keys such as `tab` and `status` for captured deep links;
- remote HTTPS only when explicitly supplied `--allow-readonly-remote`.

Do not confuse visually comparing different user records with matched fixtures. A mismatched number/name/date can move controls; first reproduce the data or explicitly document constrained dynamic masks.

Output files in `--out`:
- `candidate.png` — freshly captured vNext image;
- `capture.json` — capture URL without query values, status, browser/version, dimensions, digest, geometry, overflow indicators, page errors;
- when `--reference` supplied: `overlay.png`, `diff.png`, `side-by-side.png` and `comparison.json`.

A 404/401/403, sign-in redirect, apparent load-error message, dimensions mismatch or pixel fail produces a nonzero exit status. The requested page state must still be independently reviewed.

## 4. Compare existing PNGs without a browser

For screenshots already available locally:

`npm run parity:visual:compare -- --old ../lms-parity-baseline/old/mentor/_mentor_calendar__base__9def459d92.png --new /tmp/mentor-001/candidate.png --out /tmp/mentor-001/standalone`

Optional:
- `--threshold 0.005` permits up to 0.5% differing comparable pixels (provisional, not a guarantee).
- `--tolerance 8` defines the per-channel byte difference below which an individual pixel is not flagged.
- `--masks /tmp/mentor-masks.json` permits bounded exclusion rectangles with meaningful reasons, capped at **2%** of reference pixels.

Mask file example (only if the test account necessarily differs):

`[{"x":1150,"y":30,"width":26,"height":18,"reason":"Different authorized test-user initials"}]`

This example illustrates JSON syntax, **not verified coordinates**. Measure the real region before using. Prefer the same fixture data. Never use a broad mask for tables, modals, nav, dates, or missing controls.

## 5. Interpret results correctly

- `dimensionMatch: false` — immediately fail; no rescaling to artificially align different layouts.
- `differentRatio` — the fraction of comparable pixels outside mask and tolerance that differ.
- `differenceBounds` — the smallest rectangular region that encloses flagged pixels.
- `meanAbsoluteChannelDifference` — relative diagnostic measure, not proof of visual equivalence.
- `diff.png` — red regions flag differences; muted regions reflect intentionally masked pixels.
- `overlay.png` — half-reference, half-candidate to detect shifted positions.
- `side-by-side.png` — original-resolution images separated by a gray gutter.
- `capture.json` `geometry` — DOM bounding boxes and suspect narrow text blocks; these are **candidate geometry only**, not automatic old DOM coordinates.

A low pixel error does **not** certify correctness if a missing action or wrong text is present, and a high pixel error may be due to legitimate different names/counters. Use separate DOM/wording/action comparison and the existing account parity tests.

## 6. Perform a package-level closure

1. Open `packages/<role>-NNN.md` on the reference branch.
2. Open every listed image and classify base, expansion, overlay, failure or unmatched state.
3. Match old/vNext images by semantic content, **not filename order**.
4. Mark differences SHARED (global/role component) or PAGE.
5. Locate exact legacy CSS and assets in `docs/legacy-source/frontend` and actual legacy repo at a frozen SHA.
6. Repair structure first; prefer shared components before page-specific overrides.
7. Run unit/lint/typecheck/affected E2E tests.
8. Fresh-capture exact current vNext SHA and fixture; compare image, geometry and interactive states.
9. Preserve old screenshots; do not update baselines merely to make tests pass.
10. Record each state and evidence in the existing parity pages/family ledgers; only then mark visually verified.
11. Review other accounts when a shared CSS/token changes.
12. Don't call an account closed until **uncaptured states** and **functional/clone gates** also pass.

## 7. Current initial work

- Inventory/code: [draft PR #216](https://github.com/42Students/lms-vnext/pull/216).
- Mentor narrow-grid correction: [draft PR #217](https://github.com/42Students/lms-vnext/pull/217).
- Reference inventory and first pilot findings: [INITIAL_BASELINE_AUDIT_2026-11-03.md](https://github.com/42Students/lms-vnext/blob/parity-baseline/INITIAL_BASELINE_AUDIT_2026-11-03.md).
- Master plan: [PIXEL_PARITY_MASTER_PLAN.md](https://github.com/42Students/lms-vnext/blob/parity-baseline/PIXEL_PARITY_MASTER_PLAN.md).

These are implementation tools and an initial CSS correction; **no package is visually closed until executable browser comparisons and approval have occurred.**
