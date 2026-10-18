# Shared UI kit exhaustive-coverage ledger — chat-17

**Source inventory:** every file under `src/components/ui` (39 files; checked 2026-10-18). **Ownership:** chat-17. **Scope:** shared visual primitives only; other lanes own Projects route authorization. All test names below refer to `UX-kit-` prefixed test cases. This is a **source-to-test traceability ledger**, not proof of CI success or device-browser coverage.

Tests are in:
- `tests/unit/UX-kit-projects-hardening-chat17.test.tsx` (`UX-kit-HARDEN-01..22`),
- `tests/unit/UX-kit-role-and-overlay-chat17.test.tsx` (`UX-kit-HARDEN-23..31`),
- `tests/unit/UX-kit-states-chat17.test.tsx` (`UX-kit-STATES-01..15`),
- `tests/unit/UX-kit-scroll-motion-01.test.tsx` (`UX-kit-scroll-motion-01..08`).

**Coverage evidence levels:** tests marked only as static SSR/source assertions do **not** prove client keyboard interactions, mobile scroll physics, stateful DOM behavior or actual WCAG conformance; those remain browser/CI gates. No assertion has been intentionally weakened to hide a failure. The known scroll-cue SSR expectation was corrected to assert actual *unmeasured* state and the source's accessible overflow label, rather than falsely advertise an overflow region.

| UI file | Exported runtime components/functions | Behavioral or state test IDs (all UX-kit prefix) | Assertions / limitations |
|---|---|---|---|
| `avatar.tsx` | `avatarInitials, Avatar` | STATES-09; HARDEN-11 | blank/long name, image referrer policy, initials |
| `bottom-sheet.tsx` | `BottomSheet` | STATES-05; HARDEN-16 | nondismissible, accessible title, safe area and scroll |
| `breadcrumbs.tsx` | `Breadcrumbs` | STATES-09; HARDEN-09; HARDEN-35 | last item not linked; unsafe external/encoded hrefs become text; current-page a11y |
| `button.tsx` | `Button` | STATES-01; HARDEN-01 | variants, loading, disabled, submit and 44px |
| `card.tsx` | `Card` | STATES-12; HARDEN-10 | heading, semantic article, footer action |
| `confirm-action-dialog.tsx` | `ConfirmActionDialog` | STATES-04; HARDEN-16 | pending disables action; consequences and cancel |
| `confirm-dialog.tsx` | `ConfirmDialog` | STATES-04; HARDEN-16 | pending/disabled destructive action, no dismiss |
| `data-table.tsx` | `DataTable, isSafeDataTableHref` | HARDEN-17; HARDEN-27; HARDEN-30; HARDEN-35; HARDEN-36 | empty, formatted cell once, mobile, shared guarded row links |
| `dialog.tsx` | `Dialog` | STATES-05; HARDEN-16 | nondismissible title, safe viewport, scroll |
| `disabled-reason.tsx` | `DisabledReason` | HARDEN-07 | reason associated with disabled control |
| `disclosure.tsx` | `Disclosure` | STATES-12; HARDEN-12 | semantic details/summary and defaultOpen |
| `drawer.tsx` | `Drawer` | STATES-05; HARDEN-16 | nondismissible title, route history, scroll |
| `empty-state.tsx` | `EmptyState` | STATES-08; HARDEN-06 | empty is not alert; optional recovery |
| `error-state.tsx` | `ErrorState` | STATES-08; HARDEN-06 | alert is not success, explicit recovery |
| `file-upload.tsx` | `FileUpload, fileSizeIsValid, fileMatchesAccept, mustClearFileSelection` | STATES-13; HARDEN-05; HARDEN-28; HARDEN-34 | disabled/unavailable fallback, size/type, combined assistive helper/error IDs |
| `filter-bar.tsx` | `FilterBar` | STATES-11; HARDEN-19; HARDEN-37 | search visible, activeCount clamp, WebView media fallback, focus/keyboard cleanup |
| `form-field.tsx` | `FormField` | STATES-03; HARDEN-03 | id association, helper/error, invalid merge |
| `graceful-page-loading.tsx` | `GracefulPageLoading` | STATES-07; HARDEN-13 | directory/card, readable loading, timeout source |
| `inline-notice.tsx` | `InlineNotice` | STATES-08; HARDEN-07 | alert/status semantics and dismiss action |
| `input.tsx` | `Input` | STATES-02; HARDEN-02 | required, disabled, invalid |
| `loading-state.tsx` | `LoadingState` | STATES-07; HARDEN-13 | skeleton and accessible label |
| `long-text.tsx` | `LongText` | STATES-09; HARDEN-11 | untrusted string escaping and wrapping |
| `page-header.tsx` | `PageHeader` | STATES-12; HARDEN-10 | single h1, action area |
| `page-loading.tsx` | `PageLoading` | STATES-07; HARDEN-13 | skeleton count, slow loading recovery source |
| `pagination.tsx` | `Pagination, paginationWindow, normalizedPageCount` | HARDEN-08; HARDEN-31; HARDEN-36 | clamp nonfinite, 10k pages, unsafe links disabled, labels |
| `permission-action.tsx` | `PermissionAction` | HARDEN-20; HARDEN-23; HARDEN-24; HARDEN-25 | own/foreign scope, scoped SA, disabled/ended actor, hidden child |
| `scroll-cue.tsx` | `ScrollCue` | STATES-15; HARDEN-21 | SSR truthful overflow semantics, resize/measurement source |
| `select.tsx` | `Select` | STATES-02; HARDEN-02 | disabled, invalid |
| `selection-controls.tsx` | `Checkbox, Radio, Switch` | STATES-06; HARDEN-04 | native semantics, disabled/checked, switch |
| `skeleton.tsx` | `Skeleton` | STATES-07; HARDEN-13 | zero/NaN/high count bounded, reduced-motion |
| `stat-tile.tsx` | `StatTile` | STATES-12; HARDEN-11; HARDEN-36 | finite number, invalid fallback, safe internal-only link |
| `status-badge.tsx` | `StatusBadge` | STATES-08; HARDEN-10 | five tones/readable labels |
| `tabs.tsx` | `Tabs, tabNextEnabled` | STATES-10; HARDEN-18; HARDEN-33; HARDEN-36 | zero/all disabled, stale tab selection fallback, one reachable panel |
| `textarea.tsx` | `Textarea` | STATES-02; HARDEN-02 | disabled, invalid |
| `third-party-link.tsx` | `ThirdPartyLink` | STATES-14; HARDEN-14; HARDEN-32 | reject HTTP/js/credentials/backslash/controls; same-tab/copy fallback |
| `toast.tsx` | `enqueueToast, clearEvictedToastTimers, ToastStack, ToastProvider, useToast` | HARDEN-15; HARDEN-29 | persistent errors, bounded info, timer cleanup, viewport |
| `tooltip.tsx` | `InfoPopover, Tooltip` | STATES-12; HARDEN-12 | summary keyboard and info content |
| `use-confirm-flow.tsx` | `useConfirmFlow` | HARDEN-20 | cancel/unmount resolver source contracts |
| `use-overlay-webview.ts` | `ownsOverlayHistoryEntry, useOverlayWebview` | HARDEN-26 | marker identity, back stack, resize listener cleanup source |

## Shared visual and accessibility invariants

**Motion:** `scroll-cue`, `skeleton`, `disclosure`, overlays and `globals.css` use reduced-motion paths. Source/SSR tests check the branches and classes; use real browser reduced-motion snapshots before release.

**No unsafe navigation:** `ThirdPartyLink` denies non-HTTPS and URLs with credentials; `DataTable.isSafeDataTableHref` rejects protocol-relative, backslash and encoded/obfuscated slash row links. Neither accepts a string ID as authorization. Verify actual redirect chains independently.

**Failure truthfulness:** `InlineNotice` and `ErrorState` assert live-region semantics; `ToastStack` preserves persistent errors and caps only transient notices. Loading surfaces do not assert an action succeeded merely because a spinner disappears.

**Interaction gates not yet certified:** browser-level focus trap, Escape/back-button sequencing for nested Dialog/Drawer/BottomSheet, actual resize-triggered scroll fade, screen-reader announcement order, upload selection/reselection via real `FileList`, touch keyboard occlusion, reduced-motion timelines, and click/double-submit concurrency. SSR/source tests are necessary but insufficient; do not mark all account journeys unbreakable on this ledger alone.

**CI commands:** `npm run test:ux:kit:hardening` and `npm run typecheck`. Re-run with source `main` rebased into `chatgpt/chat-17-b` and update this ledger based on cloud results.

- **UX-kit-HARDEN-33..34:** Tabs now select the first enabled panel when an old bookmark points to a missing/disabled tab, with consistent selected ARIA and keyboard tabstop. FileUpload connects helper, error and unavailable text with combined IDs rather than replacing one with another. Corresponding `tests/unit/UX-kit-states-chat17.test.tsx` cases guard both.

- **UX-kit-HARDEN-35:** `src/lib/safe-internal-href.ts` centralizes percent-encoding-aware absolute path validation. `DataTable` retains its prior public export, and `Breadcrumbs` now denies external/obfuscated hrefs without disabling valid internal links. Negative and valid link assertions are in `UX-kit-role-and-overlay-chat17.test.tsx`.

- **Browser witness:** `tests/e2e/ux-safe-internal-href-chat17.spec.ts` transpiles the production `isSafeInternalHref` function and tests hostile encodings and legitimate URLs against Chromium's own URL origin resolver. Execute with `npx playwright test tests/e2e/ux-safe-internal-href-chat17.spec.ts`. This covers navigation parsing only; it is not proof of authenticated Projects end-to-end permission safety.

- **UX-kit-HARDEN-36:** `StatTile`, navigation-style `Tabs`, and `Pagination` now use `isSafeInternalHref` just like `Breadcrumbs`/`DataTable`. Invalid targets become inert labeled states; all are tested in `tests/unit/UX-kit-states-chat17.test.tsx`.

- **UX-kit-HARDEN-27:** the single listed chat-17 unit regression was re-read against `DataTable` and `ScrollCue`. It preserves **exactly one** formatter call per row, rejects unsafe row links and renders an accessible caption while SSR lacks physical overflow. Its brittle implementation-string assertion was replaced with semantic caption/scroll-label patterns, and ordered formatter calls are now explicitly asserted. Requires a refreshed cloud runner to confirm passing; the published report is from an older commit.
- **UX-kit-HARDEN-36:** hidden field detail authorization is **per-row**, not global to the table. Rows without `mobileDetail.canView(row)` do not run or serialize the sensitive cell formatter, disclose a fallback value on mobile, or render an unauthorized detail link. Mixed-permission assertions cover the leak and authorized row continuity.

- **UX-kit-HARDEN-37:** `FilterBar` no longer requires `window.matchMedia` on embedded WebViews; it listens for resize and restores listener, body overflow and focus on closing. Source and SSR assertions are in `tests/unit/UX-kit-states-chat17.test.tsx`.

## Interactive browser contract additions — UX-kit-HARDEN-38/39, UX-kit-E2E-01..03

- `ToastProvider` no longer assumes `crypto.randomUUID()` exists in embedded mobile WebViews: provider-scoped monotonically unique React keys have no security significance. `UX-kit-HARDEN-38` verifies static fallback and persistent error behavior.
- `useOverlayWebview` now reacts to `window.resize` **in addition to** `visualViewport` events, updating dialog available height/top/bottom on engines that lack `visualViewport`. `UX-kit-HARDEN-39` checks listener registration and teardown.
- `src/app/e2e/chat17-ui-kit/page.tsx` returns `notFound()` unless `NODE_ENV === "development"`; its companion client module mounts real `Dialog`, `Tabs`, `ScrollCue`, `FilterBar`, `FileUpload`, and `ToastProvider`. It carries no live tenant data, and is intended only for developer/CI browser verification.
- `tests/e2e/chat17-ui-kit-interactions.spec.ts` uses Chromium to exercise actual native Escape/focus return; arrow navigation skipping disabled tabs; measured horizontal overflow cue, resize-to-no-overflow cue removal and reactivation; filter overlay with missing `matchMedia`; hostile, oversized, valid, and invalidated `FileList`; and toasts with `crypto.randomUUID` made unavailable. `tests/unit/UX-kit-dev-harness-chat17.test.ts` checks that the route cannot become an exposed production fixture.
- Run `npm run test:e2e:chat17:kit` with Playwright browsers installed and a development server; the script also includes the isolated native URL parsing witness. These tests are **authored but not confirmed passing** by this connector-only session. Other controls (nested bottom-sheet history, real reduced-motion hardware, screen readers, and authenticated route permissions) remain separate gates.

- **UX-kit-E2E-04:** the development-only harness mounts a real `Drawer` with a nested `BottomSheet`. Browser test `tests/e2e/chat17-ui-kit-interactions.spec.ts` checks that closing the nested sheet returns to the parent drawer's history marker without closing the parent; a subsequent genuine Back dismisses the drawer and restores opener focus. Native Chromium result is still pending.

- **UX-kit-E2E-05:** the development-only browser harness includes a real `Skeleton` and keyboard-native `Disclosure`. Playwright emulates `prefers-reduced-motion: reduce`, inspects the *actual* computed skeleton pseudo-element animation duration, and toggles disclosure using Enter and Space while confirming hidden content remains nonvisible when closed. This is a browser acceptance test awaiting CI execution, not a claim of full motion/screen-reader certification.

- **UX-kit-E2E-06:** `tests/e2e/chat17-ui-kit-interactions.spec.ts` now mounts an actual pending `ConfirmDialog` (development-only, no mutations) and verifies one submission, disabled pending confirm/cancel actions, Escape refusal while pending, and focus restoration after the simulated operation finishes. This is a browser test awaiting CI execution; it does not replace backend idempotency checks.

## Unowned UX spillover — UX-projects-raw-table-44

The **generated** `docs/audit/ux/COVERAGE-MATRIX.md` currently lists five Projects components under “raw <table> outside DataTable”. Inspecting the latest source reveals each has already migrated to the shared `DataTable` and none contains raw table markup: `class-team-workspace-creator`, `mentor-task-allocation`, `project-admin-submissions-page`, `project-admin-workspace-list`, and `super-admin-template-subview-page`. `tests/unit/UX-projects-raw-table-chat17.test.ts` guards these five routes against regression and is part of `npm run test:ux:kit:hardening`. **Do not edit the generated matrix by hand:** rerun `node scripts/audit/ux-coverage.mjs` in CI to refresh the scanner against merged source, then audit the remaining red entries by owner.

- **UX-kit-HARDEN-45:** `DataTable` never includes `mobilePriority="hidden"` columns in `More details`. A restricted cell may remain visible on desktop where its column is appropriate; mobile CSS hides it. SSR tests verify no duplicate/private value inside the disclosure and Chromium test verifies viewport-dependent visibility plus public overflow details. Tests are committed but not claimed passing until CI.

- **UX-kit-HARDEN-47:** disabled `FileUpload` no longer announces an invalid input when the only problem is availability. It retains disabled native semantics and helper/unavailable `aria-describedby` IDs. Unit SSR cases in `UX-kit-states-chat17.test.tsx` check this; browser assistive technology should verify the spoken message.

- **UX-kit-HARDEN-48:** Disabled `Switch` uses the same `has-[:disabled]:cursor-not-allowed` affordance as native Checkbox/Radio. Static JSX test verifies the label and input remain 44px and truly disabled; physical pointer/focus behavior requires browser testing.

- **UX-kit-HARDEN-49:** `FormField` propagates `required` to the actual cloned native control as well as the screen-reader/visible indicator; the render-function contract includes `required` too. Unit checks required, optional and already-required inputs.
- **Unowned table migration:** `CollegeRecurringPreview` and `AcademicModuleScopeInventory` are no longer raw mobile-unfriendly HTML tables. `tests/unit/UX-recurring-preview-table-chat17.test.ts` and `tests/unit/UX-academic-scope-table-chat17.test.ts` protect their legacy copy, contextual values, IST formatting and hierarchy paging. Regenerate `docs/audit/ux/COVERAGE-MATRIX.md` against merged code; the static snapshot can predate these migrations.

- **Unowned TPO WebView migration (UX-UNOWNED-TPO-03):** Built-in employment-type toggle now uses the shared ConfirmDialog hook rather than native `window.confirm`; the original stale-version CAS and last-active-type safeguards remain. Source regression is in `tests/unit/UX-tpo-job-types-confirm-chat17.test.ts`; real mobile keyboard and API concurrency still require browser/service witnesses.

- **UX-kit-HARDEN-50:** FileUpload clears stale type/size validation messages when disabled/unavailable, without retaining a submitted FileList. Chromium regression deliberately feeds an invalid file, disables the native picker, checks the error disappears and disabled is no longer incorrectly `aria-invalid`, then re-enables it. Runner result is pending.

- **UX-UNOWNED-TABLE-04:** Super Admin interview operations is migrated to mobile DataTable without dropping the eleven legacy headings, conflict warnings, filtered CSV export, authorized schedule link or `.ics` calendar download. `tests/unit/UX-admin-interviews-table-chat17.test.ts` guards the source and formatter intent. Actual mobile scroll and calendar download behavior should be verified in browser CI.

- **UX-UNOWNED-TABLE-04 browser witness:** The dev-only harness mounts two fictional, overlapping Super Admin candidate interviews (no personal tenant data). `tests/e2e/chat17-ui-kit-interactions.spec.ts` verifies mobile candidate visibility, venue double-booked warning, department filtering, Clear filters recovery, and a real downloadable `.ics` file. Browser CI remains pending; do not infer production permission safety from demo-only data.

- **UX-UNOWNED-DENSE-GRID-05:** `TpoSpreadsheetGrid` and college-admin monthly attendance are intentionally matrix-style, with URL-backed columns/pinning or calendar-date columns and per-day actions. Their raw table DOM is presently necessary for parity; the separate mobile card mode and horizontal scroll accessibility source contracts are in `tests/unit/UX-dense-grids-chat17.test.ts`. `docs/audit/ux/chat17-dense-grid-exceptions.md` lists the browser/permission gates; do **not** mark these as green on source assertions alone.

- **UX-UNOWNED-TABLE-06:** Private learner verification education records now render via shared DataTable using a projection that copies *only* level, institution, year, marks and marksheet-presence status. Malformed snapshot nodes are skipped, strings bounded to 200 chars, and arbitrary identity/document fields never serialized. `tests/unit/UX-verification-education-table-chat17.test.ts` guards both privacy and responsive column mapping; signed private receipt links remain untouched. CI pending.

- **UX-UNOWNED-TABLE-07/08:** Super Admin student history and faculty CSV outcomes migrated to shared responsive DataTable. Faculty importer replaces browser `window.confirm` with shared confirmation, retaining the server `confirmed:true` gate and file-size validation. `tests/unit/UX-superadmin-import-tables-chat17.test.ts` asserts fields and operation controls. Still requires keyboard/mobile browser witnesses and running the CI unit suite.

- **UX-UNOWNED-GRID-09:** College semester course mapping is a provisional dense-table exception due to drag/drop and inline edit state, now guarded by shared horizontal `ScrollCue`, named up/down actions and 44px controls. Source assertion: `tests/unit/UX-college-term-mapping-scroll-chat17.test.ts`; browser and screen-reader acceptance still required.

- **UX-UNOWNED-DENSE-GRID-10:** College role directory keeps two intentionally distinct presentations: wide semantic desktop table inside `ScrollCue` and a separate `md:hidden` responsive card list with role-gated contact/audit/class-move/lifecycle actions. `tests/unit/UX-college-role-directory-mobile-chat17.test.ts` guards their source parity. Real device accessibility and authorization remain acceptance gates; raw table scanner entry is provisional, not green.

- **UX-UNOWNED-GRID-11:** Both College Admin academic directories now have shared horizontal `ScrollCue` and 44px action links, retaining conditional table cells and original commands. Unit source regression `tests/unit/UX-college-academic-directory-scroll-chat17.test.ts`; real narrow-screen table header and focus/a11y acceptance remains pending.

- **UX-kit-HARDEN-51:** The native `Switch` has both track and `::after` sliding thumb transitions. `motion-reduce:after:transition-none` prevents the thumb animating when reduced motion is requested; `UX-kit-states-chat17.test.tsx` verifies both transition gates. Live reduced-motion browser computation remains pending.

- **UX-kit-HARDEN-52:** Pagination caps finite page counts at `Number.MAX_SAFE_INTEGER` instead of emitting duplicate page keys/navigation links beyond JavaScript's exact integer range. Unit case verifies distinct adjacent page links at the extreme boundary and rejects scientific-notation URLs. Actual backend pagination remains capped separately.

- **UX-kit-HARDEN-53:** `DisabledReason` now gives its wrapper a keyboard tab stop only if its single child action is disabled. The native disabled Button remains disabled, while the focusable group reads the visible reason and the Button retains pre-existing `aria-describedby` IDs. Enabled actions do not gain a redundant focus stop. Tested via SSR association/keyboard-focusability contract; real screen reader validation remains a final acceptance gate.

- **UX-kit-HARDEN-54:** FileUpload merges caller-supplied `aria-describedby` targets with its own helper/error/unavailable IDs instead of overwriting them. Externally validated enabled fields keep `aria-invalid`; disabled pickers never claim to be invalid. SSR test checks both states and relationships; browser FileList and assistive technology acceptance remains pending.

- **UX-kit-HARDEN-55:** Interactive Tabs motion is now disabled under `prefers-reduced-motion` without changing legacy labels, role=tab, ARIA selection or focus navigation. The shared Buttons/Input/Select/Textarea were already motion-safe; tab indicator was the missing transition exception.

- **UX-kit-HARDEN-56:** Loading Button's actual busy/disabled semantics can no longer be overwritten by a caller's stale `aria-busy={false}`; explicit non-loading ARIA busy values still pass through. This fixes misleading screen-reader state while guarded saves run.

- **UX-kit-HARDEN-57:** Inline success notices no longer vanish while the app is backgrounded. Their dismissal timer pauses when `document.hidden` and restarts when the tab becomes visible. Error/info notices retain their original persistence and no component text changes. Source/SSR state test added; browser visibility-event behavior awaits final acceptance.

- **UX-kit-E2E-07/08/09:** Development-only Chromium fixtures now exercise focus on the disabled-reason wrapper and its associated description, a hidden-tab success notice that remains readable until return, FileUpload merging external help with built-in help, and actual reduced-motion Tabs transition duration. These complement static unit contracts; browser CI deferred by owner until full task queue completion.

- **UX-kit-E2E-10:** ScrollCue observes the viewport and **all direct children** for `ResizeObserver` changes. A second sibling changing width now updates overflow cues without relying on the first element resizing; a development-only Playwright resize witness checks both directions.

- **UX-kit-E2E-11:** Timed success/info toast timers pause on background-tab visibility and resume on foreground return, while error toasts remain persistent. The browser case checks a success notice after more than its original timeout while hidden and verifies dismissal after foreground resume; evicted timers and duration metadata are removed together.

- **UX-kit-HARDEN-58:** DataTable treats exceptions from per-row hidden-column permission and optional mobile-detail navigation callbacks as **deny/no-link**, not a crash or implicit access grant. A denied formatter is not evaluated, and an authorized cell remains visible even when its optional detail link fails. Unit behavior case 58 covers both.

- **UX-kit-E2E-12:** PageLoading and GracefulPageLoading now restart their 12-second slow-recovery timer when the request identity/shape changes, rather than displaying a stale timeout from the previous request. Playwright's clock tests the PageLoading handoff at 11+2+11 seconds without real waiting. Source uses effect cleanup on label/variant/count and label/shape respectively.

- **UX-kit-HARDEN-59:** `enqueueToast` replaces a notice with the same event ID instead of generating duplicated React keys and duplicate accessibility announcements; a non-finite timed cap falls back to the documented limit 3. Provider-issued IDs remain unique by default.

- **UX-kit-E2E-13:** The development-only browser fixture intentionally throws from `DataTable.mobileDetail.canView` and `rowHref`. A restricted private cell must never be mounted or serialized while the authorized row label remains usable; Playwright covers this failure mode beyond SSR contracts.
