# 42LMS vNext — Pixel-to-Pixel Legacy Visual Parity Master Plan

**Document version:** 1.0  
**Issued:** 2026-11-03  
**Requirement:** Mandatory, evidence-backed reproduction of the OLD LMS visual experience in vNext, as closely as browser rendering and legitimate data differences permit.  
**Repository:** 42Students/lms-vnext  
**Reference branch:** parity-baseline, initially pinned at b4f9bdd5767f484169d6da14f615aa9b65a5f265  
**vNext captured revision:** 7acef7ec (from reference README; recover full SHA when validating)  
**Initial implementation base checked:** main at c7578f44f24234323e846b538334f21a4dc52816; re-fetch before every actual edit  
**Image capture:** 1280 × 800, 2026-11-03  
**Source code for visual values:** docs/legacy-source/frontend/src on vNext main, plus old LMS frontend repository  
**Status:** PLAN DOCUMENTED; implementation and certification are not implied by this document.

> The old LMS is the visual oracle. vNext must look like the same application, not a design inspired by it. Match layout, wording, typography, controls, density, navigation, modal states, and responsive behavior. Do not trade away security, permission checks, tenant isolation, database correctness, or working user flows to achieve a screenshot.

## 0. Executive direction and non-negotiable decisions

1. **Legacy appearance wins.** For a captured state, the old LMS screenshot is the reference for what is visible: element existence/order, type, color, shape, dimensions, arrangement, text, and state. Use the old source code to obtain exact CSS and component rules. Do not replace the old appearance with prototype styling or a generic modern redesign.
2. **Behavior remains safe and functional.** Retain vNext's authorization, correct data handling, accessible interaction and working functionality. If an extra vNext function is not visible in the old screenshot, preserve the capability using a documented, legacy-looking placement/interaction; do not silently remove it. If its presence inherently creates a visual mismatch, classify a deliberate approved exception.
3. **Never conflate feature parity and visual parity.** Different evidence, separate acceptance gates. A green screenshot with a nonfunctional Save button is not closed; a functional page that looks different is not visually closed.
4. **The screenshot branch is a reference, not a code branch.** This plan is stored here at the owner's explicit request, as a documentation-only exception to the existing read-only convention. Do not edit or re-encode reference images, alter original packages, or merge this independent-history branch into main. VNext source changes use a fresh branch off the latest main; integrate through the repo's normal safe process.
5. **Use existing authoritative tracking.** docs/tracker.json, docs/planning/clone-parity-protocol.md, route manifest, existing parity pages and role ledgers remain canonical for product/release readiness. This document and packages/QUEUE.md guide visual execution, but do not silently override existing DB/API requirements or create a competing product tracker.
6. **No fictional closure.** Claims must reference an exact screenshot pair, executed browser test, result artifact, and tested vNext SHA. The words “implemented,” “visually verified,” and “fully closed” are never interchangeable.
7. **Finish actual work in discrete integrated batches.** Each coding pass should produce a bounded correct change, tests, captured evidence, and a commit. Check latest main and overlapping changes before edits. Avoid re-auditing already grounded findings except when sources changed.
8. **Reject superficial similarity as completion.** Structural differences, a missing action, broken text wrapping or wrong modal are blockers even if a global image similarity percentage is high.
9. **Do not use global !important patches as a structural substitute.** Correct DOM, component variants, layout ownership, shared tokens and role-specific behavior in that order.
10. **No percentage without denominator and evidence.** Report exact matched states, attempted states, blocked captures, exceptions and executed test results.

## 1. Inventory and trust boundaries

### 1.1 Captured scope

The following figures come from summary.json and the 783 package files on this branch, not from a claimed live-code census:

| Account | Screenshots | Packages | Page paths captured on both | Old-only route classifications | vNext-only route classifications |
| --- | ---: | ---: | ---: | ---: | ---: |
| Learner | 339 | 71 | 19 | 0 | 17 |
| Faculty | 206 | 55 | 11 | 0 | 20 |
| Mentor | 50 | 22 | 4 | 0 | 17 |
| TPO | 696 | 200 | 20 | 4 | 91 |
| College Admin | 1,670 | 384 | 34 | 45 | 63 |
| Course Coordinator | 208 | 51 | 0 | 19 | 0 |
| **Total** | **3,169** | **783** | **88** | **68** | **208** |

**Interpretation:** “old-only” or “vNext-only” means **not automatically paired in this capture**. It does not prove a missing or extra product feature. Source route aliases, conditional access, path renaming, redirected flows, capture failures and current code must be checked. Some role counts may include overlapping exposed route families; inspect rather than assuming cardinality equals unique missing features.

**Not covered as dedicated baseline roles:** Recruiter/HR and Super Admin. Add full capture/census before certifying the entire product. Global TPO and any other currently supported memberships must be identified in the current account manifest and covered if applicable.

### 1.2 Baseline branch map

- `README.md`: capture limitations and original lane instructions.
- `summary.json`: aggregate role/image/package/route matching summary.
- `packages/QUEUE.md`: ordered 783-package execution inventory.
- `packages/<role>-NNN.md`: an old/vNext page pair with a maximum of ~10 screenshots per package; images may be in different semantic order.
- `packages/<role>-unmatched.md`: unpaired path classifications, including potentially unvisited/aliased pages.
- `old/<role>/*.png`: captured legacy appearance.
- `vnext/<role>/*.png`: vNext as captured at 7acef7ec, **not necessarily today's main**.
- `old/<role>/coverage.json` and `vnext/<role>/coverage.json`: capture reachability and flags.

Do not mutate existing reference files. If recapture is required, preserve originals and keep new evidence revisioned outside this branch or in explicitly new, separately named files approved for capture expansion.

### 1.3 Known quality limitations

1. Different test users/data can change names, dates, row counts, statuses, timestamps and lengths.
2. Save actions were blocked during capture; some transitions and post-save states are absent. Some vNext popups may falsely suggest successful saving.
3. Screenshot annotations such as `load-failed` and `blank` require investigation; do not copy a failure state as the target appearance.
4. Only a small sample of dynamic detail routes was visited; route capture coverage is not exhaustive.
5. Some pages were unreachable in old and/or vNext; old Mentor reached 4/13 identified routes and vNext Mentor reached 18/36 at capture time.
6. A screenshot can render at full-page height far beyond 800px if text wrapping or page layout is broken. Compare first viewport and full page separately; do not scale images to conceal differences.
7. The documentation under `docs/design` and existing visual snapshots contain historical acceptance objectives, some of which conflict with this stricter legacy-appearance mandate. Apply the precedence rules below.

### 1.4 Oracle precedence and conflict resolution

For **visual** questions:
1. Exact old screenshot of the *same state* and target viewport.
2. Old production frontend source at frozen frontend SHA: computed DOM/CSS, assets, icons, and font information.
3. Additional live old LMS captures from that frozen source when screenshot evidence is absent/ambiguous.
4. Current existing vNext legacy token and shell documents only where they agree with old rendering.
5. Prior prototypes or UI kit defaults only where no higher reference exists.

For **behavior/security** questions:
1. Current product/security decisions and enforced vNext tenant/role boundaries.
2. Current/frozen legacy frontend+backend behavior oracle, per `docs/planning/clone-parity-protocol.md`.
3. Existing parity specs/ledgers and tested end-to-end workflows.

When old visual fidelity conflicts with safety, accessibility, a required new function or binding behavior: do not silently choose. Document the exact difference, impacted screenshot, reason, and approved treatment in the existing parity record; preserve the user job.

## 2. Outcomes and definitions of done

### 2.1 Four independent completion dimensions

- **Coverage:** All current legacy account route/page/interaction states mapped, captured or explicitly blocked with reason.
- **Visual:** Measured old-vNext appearance matches each valid reference under the defined capture environment.
- **Functional:** Existing permitted user jobs work, including creation/update, filtering, errors, authorization, role-scoped data and producer→consumer dependencies.
- **Release confidence:** Tests, screenshot review, exact SHA evidence, stale-oracle reconciliation and clone gate are complete.

A package may be “code fixed” but not “visually verified.” An account may have all captured packages verified but not be “complete” while unvisited old surfaces or another role are open.

### 2.2 Strict visual acceptance rubric

A screen fails immediately if any of the following remain unexplained:
- Wrong information architecture, layout hierarchy, component type or visible element order.
- Missing legacy action/label/section or an extra prominent element changing the legacy composition.
- Clipped/overlapping text, uncontrolled wrapping, broken column geometry, horizontal overflow.
- Wrong sidebar active state, logo, top bar, menu position, overlay state, icon family or table density.
- Materially wrong placement/dimensions of header, canvas, tabs, cards, buttons, dialogs or rows.
- A mismatch hidden by broad masking, image scaling, data substitution or automatic snapshot acceptance.

After structural correctness, apply pixel diagnostics. Start with **≤0.5% raw differing pixels in deterministic stable regions** as a provisional demanding gate, **not** a guaranteed attainable number. Calibrate against same-old same-old re-captures to measure rasterization noise; define approved per-region tolerances, SSIM/perceptual scores, geometry bounds and exclusion masks. Near-identical pixels do not by themselves justify closing an element with mismatched wording or semantics.

### 2.3 Program closure

No account is complete until:
- No unclassified legacy surfaces or unverified required state rows.
- All valid reference pairs accepted or explicitly approved as exceptions with evidence.
- All uncaptured or unpaired routes dispositioned, and relevant missing captures added.
- Desktop reference and required responsive states verified.
- No introduced behavior, accessibility, tenant isolation or security regressions.
- All affected account family-verification records fresh at final oracle SHA.
- All applicable repo parity commands and full release gate pass.

## 3. Phase 0 — Prepare safely before touching UI

1. Read current `AGENTS.md`, `docs/tracker.json`, `docs/planning/clone-parity-protocol.md`, existing account ledgers, `docs/design/ui-clone-checklist.md` and this plan.
2. Re-fetch latest `main`, `parity-baseline`, legacy frontend `prod-2026` and backend `prod-2026` SHAs. Treat names as moving pointers; record exact SHAs.
3. Verify `parity-baseline` is an independent-history reference branch; never try to merge it into `main`.
4. Inspect prior open branches/PRs for code affecting the same shell, style sheet or page.
5. Select a narrow code scope and branch from the freshest `main`. Do not directly patch image reference files.
6. Keep working datasets isolated: development/test accounts only, never production credentials, production writes or live messaging.
7. Establish a rollback path for every shared shell/style change.

**Exit:** source SHAs recorded, product tracking authority known, selected edit ownership/scope checked, test environment safe.

## 4. Phase 1 — Source and screenshot reconciliation

### 4.1 Build the canonical reconciliation view

For each baseline package, derive:
- package ID; account; legacy route; vNext route;
- old screenshot paths and state labels;
- captured vNext screenshot paths and labels;
- base/overlay/expand/hover/focus/empty/error categories;
- valid comparable states vs known corrupted/unavailable states;
- route source files, shared shell dependencies and styles;
- current browser reachability;
- known differences and dependencies;
- existing parity ledger/family IDs (if present);
- latest/accepted/blocked evidence SHA.

Do **not** treat filename order as semantic pairing. Read the actual images or use captured interaction labels and visual content to align corresponding states.

### 4.2 Full route and state reconciliation

- Read route manifests and current route-capable source files; ignore framework helper files that cannot serve routes.
- Walk sidebars, internal action links, redirects, tabs, dynamic routes, modal launchers, breadcrumbs and deep links for every role.
- Check route permissions and feature/module gates before calling a route “missing.”
- Map legacy aliases (e.g., `/college-admin/assignments` to `/college/assignments`) explicitly.
- Classify unpaired routes: MATCHED_ALIAS, UNCOVERED, OLD_MISSING, NEW_EXTENSION, RESTRICTED, UNREACHABLE, RETIRED_APPROVED, or BLOCKED.
- If captures omit hover, focus, disabled, loading, empty, error, confirmation, drawer or post-save states, add their capture requirements to the existing account ledger.
- Recruiter, Super Admin and uncaptured Coordinator variants receive separate coverage requirements.
- Validate screenshots against live old source: a capture failure is never the intended design.

### 4.3 Initial known visual discrepancies

- `mentor-001`, Meetings: old is a compact meeting list; captured vNext is a much more elaborate scheduling dashboard with severe narrow-column text overflow and extreme page height.
- `learner-001`, All Assignments: old has one compact list row and course dropdown; vNext has extra summary chips, multiple filters, larger cards and different button placement.
- `admin-001`, Assignments: old has “Courses & Content,” rounded nav pills and compact table rows; vNext uses different hierarchy, underlines/breadcrumbs, more filters and more columns.
- `faculty-001`: vNext screenshot marked load-failed; investigate/recapture before claiming a visual pair.
- `tpo-001`, Announcements: old has multiple expansion/modal states while captured vNext package has only its base; coverage gap requires recapture and interaction review.

**Exit:** all initial package states indexed, serious failures identified, route/state blind spots added to existing parity tracking.

## 5. Phase 2 — Deterministic visual testing harness

### 5.1 Capture environment

For every reference/candidate comparison record:
- Chromium/Playwright browser version and OS/font availability.
- 1280 × 800 viewport (reference), deviceScaleFactor, zoom/scale and screen mode.
- Color scheme, forced-colors setting, reduced-motion setting, locale, timezone, language, date format and font smoothing where feasible.
- Authenticated role, tenant, modules, deterministic fixture IDs and data seed version.
- Exact URL, query params, scroll position, selected tab, dropdown/modal state and any internal state required.
- Reference image SHA/hash and vNext git SHA.
- Capture type (viewport vs full-page), clipping and element context.
- Network readiness criteria and explicit font readiness (wait for fonts and settled content; don't rely solely on `networkidle`).
- A stable animation/transitions policy, frozen clock where safe, and no real external side effects.

### 5.2 Comparison methods — multiple independent detectors

1. **Structural/DOM:** landmark presence, old-vNext text/label order, action inventory, data attributes and accessible names.
2. **Geometry:** measured bounding-box x/y/width/height for shell, heading, table, modal, main controls and visible landmarks.
3. **Pixel:** create absolute-difference/heatmap image, change ratio, transparent 50/50 overlay and side-by-side triptych. Keep native image dimensions.
4. **Perceptual:** SSIM or a calibrated perceptual metric to distinguish legitimate antialiasing noise from meaningful difference; never use as the sole gate.
5. **Typography:** font family, loaded weight, computed size, line-height, letter-spacing, wrapping and baseline alignment.
6. **Interaction:** screenshot comparison of active, hover, focus, open, closed, disabled, loading, error and empty states.
7. **Accessibility/overflow:** visible focus, keyboard/escape behavior, clipping, hidden content and horizontal scroll checks.

A global pixel score can improve while a small but critical control disappears. Maintain critical-region gates separately.

### 5.3 Masking policy

Mask only demonstrated non-comparable dynamic values (e.g., different test-user names/IDs, timestamp digits) after checking their bounding boxes. Preserve their containers, dimensions and text wrapping; prefer matching deterministic data over masking. Never mask sidebar, modal, table or large content regions as an easy way to pass.

### 5.4 Implementation approach

Reuse `@playwright/test` and the existing `tests/ui01–ui10` visual/functional suites. Add a **separate old-vs-vNext reference comparator** rather than making vNext's previous screenshots the new legacy oracle. Use built-in Node where possible; add only justified image-comparison dependencies with tested lockfile changes. Use deterministic test fixtures/mock transport to isolate appearance without faking functional acceptance.

Keep generated diff imagery out of the source reference branch and do not change original baselines when tests fail. Artifacts should be attached to runs or stored under a revisioned, generated evidence path outside the immutable baseline tree.

**Exit:** calibration tests demonstrate repeatability, missing-state and pixel/geometry detectors catch intentionally introduced failures, and a pilot comparison runs on a pinned revision.

## 6. Phase 3 — Shared shell and visual primitives (highest leverage)

### 6.1 Source ownership and style hierarchy

Inspect and reconcile:
- `src/components/shell/app-shell.tsx`
- `src/components/shell/sidebar-nav.tsx`
- `src/components/shell/topbar/`
- `src/components/shell/prototype-portal-frame.tsx`
- `src/app/globals.css`
- `src/styles/legacy-skin.css`
- `src/styles/prototype-portals.css`
- `src/styles/micro-details.css`
- `src/styles/college-admin-north-star.css`
- shared components under `src/components/ui/` and account components.

Inspect actual computed styles at the target viewport before editing. The current application contains role-dependent prototype portal styling; do not blindly replace one variant with another. Distinguish portal-specific real legacy behaviors, then implement the correct old portal treatment for that role.

### 6.2 Dependency-ordered work

| Tier | Target | Properties to verify |
| --- | --- | --- |
| S01 | Logo and sidebar | rail width, icon size, collapsed/expanded states, active indicator, hover, dividers, scrolling, focus |
| S02 | Topbar | height, search position/width, badges, organization, avatar, menu, border |
| S03 | Main canvas | viewport origin, container width, padding, border, background, radius, content-flow |
| S04 | Typography | fonts actually loaded, heading/body/label/table/toolbar fonts, weights, wrapping |
| S05 | Colors/tokens | backgrounds, foreground, border, disabled, focus, success/error, hover |
| S06 | Tabs/filter bars | rounded pills vs underlines where the old role has them, ordering, actions |
| S07 | Tables/lists | header cells, row density, columns, truncation, line separators, actions |
| S08 | Inputs/buttons | actual heights/radii, icon placement, default/hover/focus/disabled/loading |
| S09 | Overlays | modal/drawer size, position, backdrop, scroll, escape/focus, footer actions |
| S10 | Minor graphics | icons, badges, avatars, tooltips, progress, pagination, timestamps |

Repair structural component markup first, shared styles second, page selectors last. Prefer semantic visual variants over a growing stack of page-specific exceptions.

### 6.3 Shared change regression grid

For each shared edit:
- capture representative Learner/Faculty/Mentor/TPO/Admin pages, plus Recruiter/Super Admin when references exist;
- compare collapsed and expanded navigation where applicable;
- compare one table, one modal, one long page, one empty state and one form;
- run focused existing shell tests;
- roll back or narrow the selector if unrelated roles regress.

**Exit:** measured shared layout and component properties match the relevant old LMS role-specific values, with no cross-account regression.

## 7. Phase 4 — Cross-account pilot

Pilot packages in order:
1. `learner-001` — assignments; basic list geometry, filters and row density.
2. `mentor-001` — meetings; first fix severe text overflow/page height, then exact legacy list presentation.
3. `tpo-001` — announcements; modal-state and action completeness.
4. `admin-001` — assignments; heading hierarchy, pills, dense table/actions.
5. A **valid Faculty package** selected after excluding/recapturing the known `faculty-001` loading-failure state.

For each pilot:
- identify all old and vNext comparable states and inspect images manually;
- list every visible difference with old screenshot coordinate/element and source code value when available;
- categorize SHARED vs PAGE; address shared dependency first;
- implement the smallest cohesive source change;
- run lint/typecheck/focused unit/E2E checks actually available in environment;
- recapture identical state at exact viewport and data;
- generate artifacts and evaluate structural, geometry and pixel results;
- have a second independent visual review reject false positives;
- record exact test commit, remaining differences and next package.

A pilot is not “done” because one base image matches while a modal or button fails.

**Exit:** independently reviewed passing pilot evidence for each applicable account, with a reusable script/procedure and measured thresholds.

## 8. Phase 5 — Production-line package execution

### 8.1 Ordering and batching algorithm

Prioritize in this sequence:
1. Shared defects repeated across many roles/screens (once shared base is understood).
2. Broken/clipped text, missing important old elements and failed loading.
3. High-use page families with reliable matching reference data.
4. Dense table and modal-heavy families with many repeatable visual primitives.
5. Remaining matched packages within each account, in queue order.
6. Unmatched and uncaptured surfaces, in parallel when independent.
7. Micro-pixel polish after structural and responsive defects are eliminated.

Don't send all workers into the same global stylesheet. Prefer disjoint source files; detect changed-file overlap before integration and serially reconcile shared-file changes. Package IDs are **work units, not exclusive worker lanes**.

### 8.2 Difference record schema (recommended fields)

- ID; account; package; route; state; reference image path/hash.
- Element/selector/visual landmark; mismatch description; old measured value; candidate value.
- Classification: STRUCTURE, TYPOGRAPHY, GEOMETRY, COLOR, ICON, TEXT, STATE, OVERFLOW, CAPTURE, FUNCTIONAL.
- Ownership: SHARED or PAGE, with shared component path.
- Severity: P0 BLOCKER, P1 MAJOR, P2 VISIBLE, P3 MICRO.
- Status: UNREVIEWED, AUDITING, GAP, FIXED, VISUAL_PASS, CLOSED, BLOCKED, STALE, EXCEPTION_APPROVED.
- Test artifact paths; comparison scores/regions; test type/results; current and accepted SHAs; reason for block/exception.

### 8.3 Per-package acceptance checklist

- [ ] Correct old/vNext pairing; no misleading load-error/skeleton pair.
- [ ] All listed screenshots viewed and semantically mapped.
- [ ] Visible element inventory and text compared.
- [ ] Shared issues fixed in shared owners; page-specific issues at page owner.
- [ ] Existing features/actions retained and relevant accessibility unaffected.
- [ ] Exact-viewport screenshot recaptured; overlay/diff/geometry evaluated.
- [ ] Mobile and other affected responsive states verified at family gate.
- [ ] Browser behavior test and relevant functional regression executed.
- [ ] Exact vNext SHA, old ref SHA and artifact links recorded.
- [ ] Independent review accepts remaining variation or reopens defect.
- [ ] Existing parity page/family ledger updated with fresh evidence.

### 8.4 Closure semantics

`UNREVIEWED → AUDITING → GAP → FIXED → VISUAL_PASS → CLOSED`.

- `FIXED` means only code exists.
- `VISUAL_PASS` means comparable states pass visual acceptance but may require functional/family evidence.
- `CLOSED` requires all package requirements, relevant behavior, reviewer acceptance and SHA evidence.
- `BLOCKED` needs a reproducible blocker and next action.
- `STALE` if upstream legacy source or a shared change invalidates evidence.
- `EXCEPTION_APPROVED` is never a generic shortcut for unfinished work.

Track packages in the existing work queue, but authoritative product closure remains in the existing repository trackers and account specs.

## 9. Phase 6 — Missing, unmatched and incomplete coverage

### 9.1 Triage procedure

For every “old-only” and “vNext-only” route:
1. Inspect current route file and role/module guard.
2. Resolve redirects, aliases, consolidated pages, nested tabs and deep-link states.
3. Check the old capture log and old frontend for reachable UI.
4. Check the live vNext environment for the route/state.
5. Assign an explicit classification with proof; capture missing state if required.
6. If a real old daily-use surface is absent, add gap and implement via existing parity flow.
7. If a new vNext-only product feature exists, preserve it, record the legacy visual placement strategy and any owner-approved exception.

### 9.2 Additional account and state capture

Cover Recruiter/HR, Super Admin, Course Coordinator, and any additional enabled production roles (e.g. Global TPO if deployed). Verify notifications, settings, profile, courses/lessons, assignments/quizzes/exams, projects/workspaces, placements/recruiter flows, attendance, resources, reports, search, exports and support. For each daily-use family capture create/edit/detail, empty/populated/large, disabled/denied, failure/retry and post-save states.

Existing tests may require authenticated fixture accounts and protected flows. Never use live production accounts, outbound messaging, irreversible writes, or real customer data to manufacture screenshot coverage.

**Exit:** zero unexplained route/state omissions and complete accounted evidence across all relevant accounts.

## 10. Phase 7 — Functional, responsive and release gates

### 10.1 Functional checks independent of screenshots

- Navigation, role routes, Back/Forward, keyboard/focus/escape, scroll restoration.
- Search, sort, filter, pagination, export and view state.
- Create/edit/delete/confirm, form validation, disabled/loading/errors/retry.
- Notifications/deep links, schedules/timezones, files and privacy.
- Role and tenant isolation, module access, negative authorization, stale actions.
- Cross-role producers and consumers: Admin/Faculty authoring to Learner; TPO/HR placement scheduling to Learner; Admin/Mentor workspace workflows; learner verification to authorized review.

### 10.2 Responsive grid

1. 1280 × 800: baseline exact visual comparison.
2. 1366 × 768: representative desktop/laptop (existing clone protocol).
3. ~390 × 844: mobile state, navigation, scroll and touch targets.
4. Critical intermediate breakpoint and tablet only when layout/workflow changes.
5. Wider and long-content stress checks for representative complex views.

No arbitrary squeezing of the 1280 reference into mobile; responsive behavior must follow the actual legacy source or separately approved responsive specification.

### 10.3 Existing repo commands and evidence

Use the real available commands at the actual tested revision:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`
- `npm run test:e2e` (scope appropriately while implementing)
- `npm run parity:status`
- `npm run parity:pages`
- `npm run parity:learner` for Learner
- `npm run parity:clone-gate`
- existing relevant `tests/ui01–ui10` visual and global regression suites.

Do not weaken test assertions or convert failed visual cases to skips to claim green. Report any unavailable browser, DB or test infrastructure as a blocker, not a pass.

## 11. Phase 8 — Final independent certification and drift sweep

1. Freeze exact old FE and BE cutover SHAs; record exact vNext candidate SHA.
2. Re-run old route census and compare all changes since every prior verified family oracle.
3. Mark affected old evidence STALE and reopen; maintain unaffected accepted results if their dependency graph is unchanged.
4. Recapture all applicable baselines using stable fixtures and the pinned browser environment.
5. Run automated image, geometry and structural checks on every comparable state; perform independent visual spot-check and targeted high-risk full review.
6. Re-run all cross-role functional/permission checks and required browser/responsive matrices.
7. Check that no product parity, family verification or release tracker is still PARTIAL/MISSING/VERIFY/BLOCKED/STALE.
8. Record unresolved pixel noise separately from remaining real defects; get explicit approval for any legitimate exception.
9. Require `npm run parity:clone-gate` to report READY: YES before calling vNext an as-is replacement.
10. Produce a final sign-off report containing denominator, attempted, passed, blocked, failed, exception counts and SHA/evidence links per account.

## 12. Visual measurement specification

### 12.1 Geometry

Record bounding boxes for main shell, sidebar rail, topbar, canvas, heading, primary action, tabs/filters, table, modal and any element whose size controls page flow. Require near-exact positioning/sizing within explicitly calibrated 1–2 CSS pixel tolerance when rasterization/rounding requires it; do not assume one tolerance fits every element.

### 12.2 Raw pixel ratio

`diffRatio = countOfDifferingComparablePixels / countOfComparablePixels` after alignment and narrowly justified dynamic mask. Use identical image size, color space and channel handling. A high diff ratio caused entirely by an intentionally different user name is investigated, not automatically accepted. A low diff ratio with a missing critical action fails.

### 12.3 Additional signals

- Region-level SSIM/perceptual differences (calibrated).
- Text-row baseline and wrapping comparison.
- Horizontal/vertical overflow assertions.
- Surface depth and shadow/border differences.
- State transition, focus and dropdown geometry.
- Stable second-run capture reproducibility.

Store calculated metrics and actual images; never fabricate a numeric parity percentage.

## 13. Evidence artifacts and storage

Keep **reference inputs** immutable. For each executed screen state, produce:
- reference identifier and image path/hash;
- candidate URL, route, role, viewport and vNext SHA;
- screenshot PNG, side-by-side PNG, 50% overlay PNG and diff/heatmap PNG;
- geometry JSON including critical element boxes;
- comparison JSON with metrics, mask rationale and pass/fail;
- associated test log and console/network issues;
- reviewer notes, approved exceptions and next action.

Generated runtime artifacts are not source reference files. Preserve failed comparison artifacts for debugging; successful screenshots must not overwrite the old LMS reference by default.

## 14. Safety and architecture rules

- Never alter DB migrations, permission checks, tenant constraints or backend API semantics merely to get a visual match.
- Never fake an action as functional because an old screenshot depicts a button; preserve working API integration.
- Don't copy old Pages Router/Redux/Ant Design architecture file-by-file; reproduce the visible output using the current Next.js component architecture.
- Prefer exact legacy SVG/logo/icon assets if licensed/available in the project over approximate substitutes.
- New shared styles must be scoped and measured; forbid uncontrolled cascade hacks.
- Preserve responsive, keyboard and assistive technology behavior even if legacy lacks it; document any resulting tiny visual deviation.
- Test login/notifications with safe fakes, never real outbound SMS/email.
- Keep security and privacy exception scope explicit.

## 15. Coordinated parallel execution without duplicate trackers

- Before every working batch, inspect latest main and affected file paths in open work.
- Work on a new branch from latest main for coding; include one coherent area and test evidence.
- Independent packages can run in parallel; do not create exclusive worker lanes as the repo's current AGENTS.md disallows them.
- Shared shell/token files are integration hotspots: serialize changes, compare fresh base, reconcile before pushing.
- Don't modify the same repository file in parallel through stale SHAs or force-overwrite competing changes.
- Each implementation commit must update the related existing parity evidence/ledger as appropriate.
- When a package is blocked for two substantive passes, record exact blocker and continue an independent item; preserve prior progress.
- Communicate progress in units of verified packages and failed/blocked states, not vague descriptions of “80% done.”

## 16. Impact-first prioritization

Prioritize by **measured business and visual impact**, not just ease of editing:

`priorityScore = severity × affectedReferenceStates × sharedComponentLeverage × usageCriticality / estimatedComplexity`

This is a sorting heuristic, not proof that one page is more important than security/functional requirements. Never let package-volume optimizations bury a P0 broken page. Candidate P0 issues include severe overflow, unreachable visible pages, missing old primary daily-use surfaces and load errors.

Start shared shell/typography once; then pilot and fix strongly repeated patterns. Tables, tabs and overlays should be handled as families, not via dozens of copy-paste CSS overrides.

## 17. Pilot evidence template

For each pilot package:

**Package:**  
**Old route and vNext route:**  
**Old screenshot paths/hash:**  
**vNext captured screenshot paths/hash:**  
**Old FE/BE SHA:**  
**Current tested vNext SHA:**  
**State pairing:**  
**Capture quality flags:**  
**Critical mismatch table:** Element | Old target | Current output | Shared/Page | Severity | Source owner.  
**Implemented source files:**  
**Automated comparison:** capture env, diff ratio, perceptual/geometry result and artifacts.  
**Browser behavior checks:** actual command/run status.  
**Regression across other roles:** actual states compared.  
**Reviewer decision:** PASS / FAIL / BLOCKED.  
**Exceptions and rationale:**  
**Existing parity ledger links:**  
**Next package and precise blocker:**  

## 18. Account-specific execution notes

### Learner — 71 packages
Start with assignments, courses, navigation, quizzes, projects, attendance, profile and placements. Distinguish missing legacy elements from newly added vNext summary chips and utility controls. Follow `docs/planning/learner-ui-surface-ledger.md` and family verification before declaring closure.

### Faculty — 55 packages
First resolve the known `faculty-001` load-failed capture. Then ensure legacy assessment, grades, quiz, class scheduling, attendance, contacts, course navigation and overlays match. Compare real table/status populated states where captured.

### Mentor — 22 packages
Start `mentor-001` immediately because its captured vNext calendar has dramatic overflow and wrong hierarchy. Separate old meetings-list content from new scheduling controls; preserve permitted scheduling functions in a legacy-consistent treatment. Capture more unvisited routes to avoid misleading completion.

### TPO — 200 packages
High surface and interaction density; work by page family. Separate genuine TPO portal shell from old prototype-specific navigation and correct modals, lists, buttons, placement workflows, recruiter and student surfaces. Avoid making the TPO-specific shell global.

### College Admin — 384 packages
Largest baseline set. Start `admin-001` and shared course-content tab/table primitives. Verify courses, people, academics, placements, projects, calendars, activity and settings. Investigate many old-only project/workspace and placement routes before asserting absence.

### Course Coordinator — 51 packages
Only old screenshots exist here. Confirm current vNext role and permissions/route implementation against the actual product decision. Treat screens as a distinct unmatched coverage workstream, not as already visually paired.

### Recruiter/HR and Super Admin — not yet in baseline package count
First perform route/source census and safe captures. Do not report the overall LMS product visually complete without this evidence. Preserve existing role-specific approval and access logic.

## 19. Triple audit of this execution plan

### Audit A — Completeness / hidden gaps
**Threats:** package queue only covers visited screens; role omissions; unpaired routes mistaken for missing features; overlays and post-save states uncaptured; differences in test users.  
**Controls added:** source route census, role completeness, semantic state pairing, explicit coverage classifications, bad-capture recapture, no “package count = product coverage” shortcut.  
**Pass criteria:** zero unclassified legacy user-visible surfaces and complete known-blocker ledger.  
**Residual risk:** a rare state absent from both source inventory and browser exploration; mitigate with workflow/state-machine review and final independent exploratory pass.

### Audit B — Precision / false green
**Threats:** screenshot diff polluted by font/locale/data; masking hides defects; approximate CSS; vNext snapshots confused with old oracle; a global similarity score hides a missing button.  
**Controls added:** deterministic browser capture, frozen revisions, stable fixtures, calibration, DOM/geometry/typography/pixel methods, critical-region gates, independent review.  
**Pass criteria:** reproducible tests and critical layout correct with documented tolerances; no unexplained structural mismatches.  
**Residual risk:** irreducible rasterization differences across OS/fonts; mitigate via pinned rendering environment and documented noise bounds.

### Audit C — Delivery / regressions / throughput
**Threats:** endless page-level CSS hacks; concurrent edits of shared shell; rework after global styles; visual-only closure; stale legacy reference.  
**Controls added:** dependency-ordered shared pass, cross-role visual regression grid, narrow coherent source batches, exact commit proof, parallel only on independent files, final frozen-oracle sweep.  
**Pass criteria:** integrated edits pass code/browser checks; zero unverified “closed” items; current oracle reconciled.  
**Residual risk:** missing authentication/data infrastructure for some states; mark blocked with exact prerequisites rather than guessing or approving.

**Triple-audit verdict:** plan corrected for all three identified classes of failure; this is not an assertion that implementation/tests have passed.

## 20. Exact initial execution batch

**Batch 0: foundation audit (immediate)**
1. Confirm reference and current main SHAs; preserve branch separation.
2. Check image/package totals and verify old-vNext state label mapping, producing a machine-checkable inventory where practical.
3. Read and reconcile existing shell/design/prototype CSS; list conflicting authoritative rules.
4. Select pilot packages and explicitly flag invalid screenshots and missing states.

**Batch 1: comparator (immediate after inventory)**
1. Implement reproducible image metadata/diff tool with a focused unit test.
2. Produce first real matched screenshot overlay from two existing baseline files.
3. Record capture environment and data-mask requirements.
4. Make comparator fail clearly on missing or unmatched images.

**Batch 2: first end-to-end visual fix**
1. On a fresh branch from main, start with a bounded high-leverage shared fix or `mentor-001` overflow fix after source inspection.
2. Validate all affected accounts' shell on actual browser captures and run relevant tests.
3. Store exact commit/evidence and mark the package FIXED only until visual review passes.
4. Continue the next independent package once its acceptance gate can run.

## 21. Reporting contract

Each run must communicate:

- **Reference:** parity-baseline pinned SHA and current legacy FE/BE SHAs.
- **Code base:** tested vNext SHA and branch.
- **Newly visual-verified:** exact package/state IDs and artifact/test links.
- **Still open:** matched packages, unmatched routes, missed captures, capture-invalid cases, role omissions.
- **New code:** exact commits and affected shared/page files.
- **Checks executed:** commands, actual pass/fail, blocked reason.
- **Regressions:** newly detected with severity, not hidden.
- **Next execution item:** one package/family and why.

Do not report fabricated similarity, fake CI passes or “everything is green” because a screenshot happens to look close.

## 22. Explicit final release checklist

- [ ] Pinned old FE and BE production SHAs recorded and fresh.
- [ ] All account route manifests and role memberships reconciled.
- [ ] All 783 original packages classified; all comparable states verified or explicitly exceptioned.
- [ ] Unpaired old/vNext classifications accounted for with source proof.
- [ ] Recruiter/HR and Super Admin baseline coverage added and verified.
- [ ] Course Coordinator and extra production roles dispositioned.
- [ ] All previously failed/blank/blocked capture states investigated and recaptured as required.
- [ ] All shared shell, typography, table, form, tab, overlay and icon rules checked.
- [ ] Desktop exact reference and required responsive states reviewed.
- [ ] Visual diff, geometry, critical-region and accessibility checks executed at pinned vNext SHA.
- [ ] Behavior/permissions/tenancy and cross-role flows pass.
- [ ] Existing parity ledgers, pages, family records and clone gate are fully accepted.
- [ ] Full CI/test evidence at frozen candidate revision is present.
- [ ] Final independent review confirms no unexplained old-vNext deltas.
- [ ] A quantitative sign-off report, including exceptions and blocked counts, is published.

---

### Working principle

**Match what people see, preserve what people can safely do, prove both on the exact code version being shipped.** The baseline branch contains evidence; the application branch contains fixes. Each package closes only through verifiable comparison and regression checks.