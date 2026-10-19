# Checkpoint F1 / F2 — old LMS overlay parity audit

Owner: chat-16. Date: 2026-10-19. Reference: `docs/design/ui-clone-checklist.md`, **STRICT TICK RULE**. This is a **source-level** comparison, not a screenshot or CI approval. Source refs below are repository-relative `path:line`. “Match” denotes the stated property/state only, not whole-item parity.

## Strict results

- [ ] **F1 — Modals, dialogs, drawers, popconfirm** (missing: exhaustive legacy variant/state tables, fresh checkout-wide grep proof, and browser/phone/tablet verification; native responsive filter Drawer and mobile navigation have been migrated, but CSS/behavior parity of all consumers remains unverified)
- [ ] **F2 — Toasts, tooltips, popovers, dropdown/context menus** (missing: legacy toast-specific state/duration source, context-menu icon/divider/state inventory, branch-wide grep proof, and popup closing-animation parity)

No item is ticked: both value and coverage proof are incomplete even though many individual values match.

## F1: property-by-property source evidence

| Property and state | Old LMS exact value and source | vNext effective value and source | Result |
| --- | --- | --- | --- |
| Drawer scrim default | `rgba(30,54,63,.1)`; `docs/design/legacy-styles/components___antddesign.scss:143-145` | `rgba(30,54,63,.1)`; `src/components/ui/legacy-overlays.css:12-15` | Match, drawer type |
| Desktop/right notification drawer shadow | `-4px 0 24px rgba(0,0,0,.12)`; `components___notification-drawer.scss:402-405` | `-4px 0 24px rgba(0,0,0,.12)`; `src/components/ui/drawer.tsx:40` | Match, right drawer |
| Generic side-drawer mobile/nav width | `82%` with `max-width:300px`; `components___antddesign.scss:305-310, 414-417` | Mobile navigation passes `side="left"` in `src/components/shell/mobile-navigation.tsx:32-36`; `[data-side=left]` uses `min(82vw,300px)` in `src/components/ui/legacy-overlays.css:48-54` | Match for the legacy navigation variant; other side drawers unverified |
| Modal phone max width | `calc(100vw - 32px)`; `components___antddesign.scss:1037-1041` | `w-[calc(100%_-_2rem)]`; `src/components/ui/dialog.tsx:53` | Match when viewport container is full width |
| Modal mobile available height | `calc(100dvh - 48px)`; `components___antddesign.scss:1057-1061` | `calc(var(--lms-visual-height) - 3rem)`; `src/components/ui/dialog.tsx:53-54` | Match height allowance; visualViewport adjustment is an intentional WebView enhancement |
| Modal mobile radius | `12px`; `components___antddesign.scss:1057-1062` | `var(--lms-canvas-radius)`; `src/components/ui/dialog.tsx:53` | Token resolution / every variant not independently proved |
| Modal header padding | `16px 24px`; `components___common.scss:1093-1097` | `16px 24px`; `src/components/ui/legacy-overlays.css:17-20` | Match |
| Modal title clearance | `padding-right:50px`; `components___common.scss:1100-1103` | `50px`; `src/components/ui/legacy-overlays.css:25-27` | Match |
| Modal close placement | `top:16px;right:16px`; `components___common.scss:1048-1057` | `top:16px;right:16px`; `src/components/ui/legacy-overlays.css:28-33` | Match |
| Modal desktop close diameter | `40px`, radius `20px`; `components___common.scss:1049-1055` | `sm:min-h-10 sm:min-w-10 rounded-full`; `src/components/ui/dialog.tsx:60` | Match for desktop with 40px computed dimensions |
| Modal close shadow | `0 2px 8px rgba(0,0,0,.1)`; `components___common.scss:1057` | Same; `src/components/ui/dialog.tsx:60` | Match |
| Modal close hover text | `#1a1d21`; `components___common.scss:1068-1080` | `#1a1d21`; `src/components/ui/legacy-overlays.css:34-36` | Match |
| Modal body padding | `24px`; `components___common.scss:1084-1090` | `sm:p-[var(--lms-canvas-padding)]`; `src/components/ui/dialog.tsx:62` | Token resolution / narrow phones differ; not fully proved |
| Modal footer action gap, phone | `8px`; `components___antddesign.scss:1064-1070` | `8px`; `src/components/ui/legacy-overlays.css:40-43` | Match |
| Footer mobile action target | `min-height:44px`; `components___antddesign.scss:1069-1073` | `min-height:44px`; `src/components/ui/legacy-overlays.css:44-46` | Match |
| Close glyph | Old Ant close icon `16px`; `components___common.scss:1068-1075` | SVG canvas `16px`; `src/components/ui/overlay-close-icon.tsx:3-8` | Match dimensions; icon path still needs side-by-side visual proof |
| Drawer close mobile touch target | `44px`; `components___antddesign.scss:335-346` | `min-h-11 min-w-11`; `src/components/ui/drawer.tsx:45` | Match |
| Drawer mobile body scroll | `scrollbar-width:none`, WebKit scrollbar hidden; `components___antddesign.scss:349-360` | `ScrollCue` plus scrollbar suppression; `src/components/ui/drawer.tsx:47`, `src/app/globals.css` overlay scrollbar rules | Partially proved |
| Modal opening animation | Various Ant modal variants / pageSlideIn 180ms; `components___antddesign.scss:1-15, 960-1065` | `lms-legacy-dialog-enter 180ms ease-out`; `src/components/ui/legacy-overlays.css:150-165` | **Not proved as same keyframes** |
| Modal exit/close animation | Native Ant close motion not exhaustively represented in bundled SCSS | `useOverlayExit` holds native dialog top layer for `180ms` (`src/components/ui/dialog.tsx:36`, `src/components/ui/use-overlay-exit.ts:10-45`); CSS `lms-legacy-dialog-exit` in `src/components/ui/legacy-overlays.css` | Implemented exit; exact legacy keyframes/duration not proven |
| Disabled or pending destructive confirmation | Ant button disabled/confirm rules; `components___antddesign.scss:899-906` and button override rules | Shared `dismissible` and pending guards; `src/components/ui/dialog.tsx:15-25, 49-51`, `src/components/ui/confirm-action-dialog.tsx:7-20` | Behaviour guarded; visual state not fully audited |
| Error / empty / loading modal content | Page-specific legacy variants | Consumer-owned content under `ScrollCue`; `src/components/ui/dialog.tsx:62` | **Not equivalent for all callers** |

## F2: property-by-property source evidence

| Property and state | Old LMS exact value and source | vNext exact value and source | Result |
| --- | --- | --- | --- |
| Tooltip background | `#1a1d21`; `components___antddesign.scss:48-51` | `#1a1d21`; `src/components/ui/legacy-overlays.css:65-67` | Match |
| Tooltip radius | `8px`; `components___antddesign.scss:49-51` | `8px`; `src/components/ui/legacy-overlays.css:66-68` | Match |
| Tooltip type | `12px/16px`; `components___antddesign.scss:52-54` | `12px/16px`; `src/components/ui/legacy-overlays.css:71-72` | Match |
| Tooltip padding | `6px 16px`; `components___antddesign.scss:54` | `6px 16px`; `src/components/ui/legacy-overlays.css:69` | Match |
| Tooltip min height | `27px`; `components___antddesign.scss:55` | `27px`; `src/components/ui/legacy-overlays.css:68` | Match |
| Tooltip shadow | `0 2px 8px rgba(0,0,0,.2)`; `components___antddesign.scss:56` | Same; `src/components/ui/legacy-overlays.css:73` | Match |
| Tooltip arrow dimensions | `10×10px`; `components___antddesign.scss:59-63` | `10×10px`; `src/components/ui/legacy-overlays.css:75-79` | Match dimensions |
| Tooltip arrow alignment | Legacy arrow right `-2px`; `components___antddesign.scss:59-64` | Right `-2px`; `src/components/ui/tooltip.tsx:54` and `src/components/ui/legacy-overlays.css:75-79` | Match static right-edge offset; other placements still unverified |
| Tooltip Escape/focus | Ant trigger keyboard behavior varies by placement | `Escape`, hover, focus and touch paths; `src/components/ui/tooltip.tsx:20-54` | **Legacy timing equivalence unproved** |
| Header dropdown radius | `6px`; `components___dropdown.scss:27-35, 93-101` | `6px`; `src/components/ui/dropdown.tsx:85-86` | Match |
| Header dropdown shadow | `9px 11px 28px rgba(0,0,0,.1)`; `components___dropdown.scss:32-35, 98-100` | Same; `src/components/ui/legacy-overlays.css:80-83` | Match |
| Header dropdown padding | `16px 24px`; `components___dropdown.scss:100-104` | `py-4 px-6`; `src/components/ui/dropdown.tsx:86` | Match |
| Header dropdown min width | `100px`; `components___dropdown.scss:99-105` | `min-w-[100px]`; `src/components/ui/dropdown.tsx:86` | Match |
| Dropdown open motion | Legacy popup `translateY(-8px)` to 0, `200ms ease-out`; `components___notification-drawer.scss:124-141` | Popup animation `200ms ease-out`; `src/components/ui/legacy-overlays.css:150-176` | Match for entrance only |
| Dropdown closing motion | No exact universal SCSS close duration established | Details closes instantly; `src/components/ui/dropdown.tsx:51-74` | **Not proved** |
| Notification popup radius | `12px`; `components___notification-drawer.scss:113-121` | `12px`; `src/components/ui/legacy-overlays.css:135-141` | Match |
| Notification popup layered shadow | `0 4px 24px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)`; `components___notification-drawer.scss:115-117` | Same; `src/components/ui/legacy-overlays.css:141` | Match |
| Notification header padding | `16px 20px`; `components___notification-drawer.scss:153-158` | `16px 20px`; `src/components/ui/legacy-overlays.css:107-112` | Match |
| Notification heading type | `18px/1.3,600,-.02em`; `components___notification-drawer.scss:161-168` | Same; `src/components/ui/legacy-overlays.css:114-121` | Match |
| Notification desktop max geometry | `max-width:min(420px,100vw-24px)`, height `min(520px,100vh-120px)`; `components___notification-drawer.scss:113-125` | Same numerical constraints with dynamic viewport; `src/components/ui/legacy-overlays.css:135-138` | Match dimensions, WebView height difference |
| Menu minimum touch row | `44px`; `components___notification-drawer.scss:18-21` | `min-h-11`; `src/components/ui/menu.tsx:38` | Match |
| Menu hover and active fill | `rgba(0,0,0,.035)` / `.06`; `components___notification-drawer.scss:14-16, 39-45` | Same; `src/components/ui/legacy-overlays.css:90-96` | Match for these items |
| Menu disabled state | Legacy Ant variants by component | Disabled native buttons with `opacity-50`; `src/components/ui/menu.tsx:37-38`, `legacy-overlays.css:85-89` | **Disabled appearances not all matched** |
| Menu dividers and icons | Legacy varies among header, recruiter and notification popups | `6px 8px` separator style, no guarantee all nested consumer menus use shared `Menu`; `src/components/ui/legacy-overlays.css:97-103` | **Incomplete menu/icon coverage** |
| Toast stack and timing | No one canonical toast duration/error policy established in selected SCSS | Persistent errors; timed info/success `4500–15000ms`; `src/components/ui/toast.tsx:98-190` | **Legacy parity not proved** |
| Toast hover / focus pause | Requires comparative runtime/legacy proof | Timers pause during hover/focus; `src/components/ui/toast.tsx:60-70, 98-165` | **Legacy parity not proved** |
| Popover mobile behavior | Full-width mobile drawer variants; `components___notification-drawer.scss:395-493` | Recruiter/learner nonmodal anchored popovers; `src/components/hr/hr-recruiter-bell.tsx:84-105` and `src/components/shell/learner-notification-bell.tsx:71-112` | **Mismatch on phone** |
| Popup/error/empty states | Old notification loading/error/empty styles `32px 20px`; `components___notification-drawer.scss:260-319` | Per-consumer messages use `mt-3`/compact padding | **Mismatch** |

## Coverage search evidence (never equate file matches with full grep proof)

The GitHub repository code-search API was queried on the then-current `main` index, scoped to `path:src/`:

| Requested command for local/orchestrator recheck | GitHub code-search equivalent and file count | Remaining non-shared uses / exemption |
| --- | --- | --- |
| `git grep -nl 'fixed inset-0' -- src` | exact phrase `"fixed inset-0"`: **3 files** | Main-index results only; branch uses `ResponsiveFilterDrawer` backed by a single native Drawer (`src/components/ui/drawer.tsx:58-97`) and mobile navigation already uses shared Drawer (`src/components/shell/mobile-navigation.tsx:32-36`); `src/app/company-share/[token]/page.tsx` is a noninteractive confidentiality watermark, **not** a modal |
| `git grep -nl 'role="dialog"' -- src` | exact phrase `role="dialog"`: **9 files** | Includes CSS selector/observer literals; nonmodal account menu, HR, recruiter, learner popovers and mobile navigation |
| `git grep -nl 'role="alertdialog"' -- src` | exact phrase `role="alertdialog"`: **3 files** | TPO callers passing `role="alertdialog"` to the **shared Dialog**, not nested custom alertdialog markup |
| `git grep -nl '<dialog' -- src` | case-insensitive GitHub search for `<dialog`: **105 files** | This search includes capitalized JSX `<Dialog>`; **not** a native-`<dialog>` count; local case-sensitive grep still required |
| `git grep -nl 'bg-black/50' -- src` | exact phrase: **1 file** | `src/components/admin/super-admin-student-import-history.tsx`; inspect context before treating as hand-rolled backdrop |

**Limits:** the commands shown here were **not** executed locally; GitHub code search is not a guaranteed complete checkout grep, and its default-branch index can lag. The orchestrator must run the commands in a fresh checkout. Thus the STRICT TICK RULE's *zero hand-rolled overlays* condition is **not met**, regardless of the number of shared Dialog imports.

## Coverage and no-regression notes

The TPO reminder preview, announcement delete, calendar move/create, offer withdrawal, team ask/message confirmations, verification review and mentor/learner task details were migrated to shared dialogs/drawers in preceding chat-16 batches. Existing nonmodal notification popovers were deliberately not changed to `showModal()`, to avoid trapping the rest of the page. Responsive filter now uses the one-subtree `inlineDesktop` shared Drawer with a native phone dialog; mobile navigation uses `side="left"` shared Drawer. Inline-desktop closed-dialog CSS/accessibility, breakpoint transitions, and focus restoration require device/browser verification.

Source-only JSX opening/closing checks across **12 modified TSX files** in this branch comparison reported **zero counted tag mismatches**. This is not a compiler check. No CI, tests, typecheck, lint, application run or browser comparison was performed. Source evidence alone does **not** close F1 or F2.


## Work queue and 2026-10-19 branch checkpoint

- [x] Sync branch with current main using a merge commit (not a history-rewriting rebase), preserving all 25 lane-modified paths and reconciling shared controls. The branch contains the checked main commit; future main merges remain necessary as other lanes push.
- [x] Migrate the responsive filter popup from a separate `fixed inset-0` scrim and custom `role="dialog"` focus trap to native shared `Drawer` with a single mounted form subtree: `src/components/ui/drawer.tsx:58-97`; `src/components/ui/filter-bar.tsx` continues to use the same exported wrapper with its unchanged props.
- [x] Keep mobile nav on shared left `Drawer`, including the legacy 82vw/300px panel and 44px close target: `src/components/shell/mobile-navigation.tsx:32-36`, `src/components/ui/legacy-overlays.css:47-69`.
- [x] Tooltip arrow right `-2px` and close glyph 16px: `src/components/ui/tooltip.tsx:54`, `src/components/ui/overlay-close-icon.tsx:3-8` compared with `components___antddesign.scss:59-64` and `components___common.scss:1068-1075`.
- [x] Replace interactive TPO request column chooser: `src/components/placements/tpo-request-page-clipboard.tsx` now uses shared `Dropdown` / `Button`; previously duplicated `Checkbox` import removed.
- [x] Replace recruiter-lead row actions accordion-menu: `src/components/tpo/recruiter-leads-workspace.tsx` now uses shared responsive `Dropdown` with existing child controls preserved.
- [x] Convert interactive mobile row actions in `src/components/tpo/tpo-spreadsheet-grid.tsx:216-218` to shared responsive `Dropdown`, preserving row-actions subtree and leaving `More student details` as a non-menu disclosure (`:212-214`).
- [ ] Inspect nonmodal popovers and header account/context menus for legacy menu icons, separators, keyboard focus, disabled/hover/active and phone layouts; check `src/components/shell/topbar/account-menu.tsx` and `src/components/hr/hr-recruiter-bell.tsx` first.
- [ ] Establish source-backed toast timeout/persistence and global popup exit motion; selected SCSS lacks one shared source for all variants.
- [ ] Required checkout verification **NOT RUN by owner constraint**: `git grep -n 'fixed inset-0' -- src`, `git grep -n 'role="dialog"' -- src`, `git grep -n 'role="alertdialog"' -- src`, and inventory of `<details>/<summary>` used as menus. The remote default-branch code search returned legacy/indexed matches and is **not** strict zero-coverage proof.
- [ ] Required viewport verification **NOT RUN**: 375px/767px phone, 768px tablet and desktop sizes; focus trap/recovery, Escape, outside click, Back history, safe areas, exit/reduced-motion, footer alignment, scroll containment and error/disabled/loading states.

F1 and F2 stay **unticked under STRICT TICK RULE** until exact per-state value proof, complete branch-coverage proof and responsive/no-regression evidence are available. No app, CI, lint, typecheck, unit test, or browser was run in this turn.

## Follow-on F1 source comparison — phone and dialog variants

| State/property | Legacy source and exact value | vNext source and effective value | Result |
| --- | --- | --- | --- |
| Legacy mobile dialog body | `docs/design/legacy-styles/components___common.scss:1083-1091` — `padding:24px`, vertical scroll, hidden scrollbar | `src/components/ui/dialog.tsx:53` — `p-6` = 24px phone; `sm:p-[var(--lms-canvas-padding)]` desktop; ScrollCue controls scroll | Padding matches the cited modal variant; scrollbar and all modal variants still unverified |
| Legacy dialog header | `components___common.scss:1093-1103` — 16px 24px and 50px right title clearance | `src/components/ui/legacy-overlays.css:17-27` — 16px 24px, 50px clearance | Match static dimensions, pending real responsive screenshot |
| Confirmation semantic/disabled | `components___antddesign.scss:899-906` — confirmation buttons block with 21px top margin and modal content 15px 15px 5px | `src/components/ui/confirm-action-dialog.tsx:12-19` — `role="alertdialog"`, pending-disabled actions within generic footer | **Mismatch** in confirmation-specific action spacing; semantics strengthened, no F1 tick |
| Notification drawer phone header top | `components___notification-drawer.scss:408-414` — `calc(16px + env(safe-area-inset-top))`, touch minimum | `src/components/ui/legacy-overlays.css:66-73` — same top padding and minimum 44px for right drawer | Match base right-drawer mobile header; content variants not all checked |
| Legacy drawer left phone | `components___antddesign.scss:305-310,335-346` — width 82% max 300px and 44px close target | `src/components/ui/legacy-overlays.css:47-54,78-86` and `src/components/shell/mobile-navigation.tsx` — 82vw/300px and 44px | Match selected navigation variant only |
| Modal exit | Old bundled SCSS has multiple entrance rules and commented transitions `components___antddesign.scss:1-15`; no unified exit proof | `src/components/ui/use-overlay-exit.ts` plus CSS `lms-legacy-dialog-exit` / drawer exits | **Unproven** animation equivalence; no F1 tick |

These are source observations, **not** a replacement for the strict per-state/property matrix or phone/tablet browser proof.

## Follow-on F2 source comparison — menus, popovers, tooltip and toast

| State/property | Legacy source and exact value | vNext source and effective value | Result |
| --- | --- | --- | --- |
| Generic header popup surface | `docs/design/legacy-styles/components___dropdown.scss:96-104` — 6px radius, `9px 11px 28px rgba(0,0,0,.1)` shadow | `src/components/ui/popover.tsx:22`; `src/components/ui/legacy-overlays.css:181-186` — radius 6px, dropdown shadow | Match common menu variant |
| Menu hover / active | `components___notification-drawer.scss:14-16,39-45` — rgba(0,0,0,.035) / .06 | `src/components/ui/menu.tsx:38`, `src/components/ui/legacy-overlays.css:157-166` — same fills | Match specified base states; nested menu inventories open |
| Menu separator | `components___notification-drawer.scss:14-24` provides neutral color tokens, **not** a canonical separator margin/height rule | `src/components/ui/menu.tsx:42-44` — 1px neutral line, 6px vertical/8px horizontal; consumers `tpo-topbar-new-menu.tsx`, `tpo-company-memory-workspace.tsx` | Shared separator implemented; **legacy dimensions unverified**, leave F2 open |
| Mobile drawer/menu scrim | `components___antddesign.scss:143-145` — `rgba(30,54,63,.1)` | `src/components/ui/legacy-overlays.css:116-123` — same `rgba(30,54,63,.1)` on native dropdown-root pseudo-element | Match scrim color; mobile sheet geometry/behavior remains runtime-unverified |
| Tooltip arrow | `components___antddesign.scss:59-64` — 10px × 10px, right -2px, #1a1d21 | `src/components/ui/tooltip.tsx:54` and `src/components/ui/legacy-overlays.css:108-114` — same values | Match static; placement/focus/hover variants unverified |
| Toast stack max width | `components___notification-drawer.scss:113-125` — notification popup max 420px viewport minus 24px (**not** a canonical toast spec) | `src/components/ui/toast.tsx:71` — toast stack max `min(420px,100vw - 32px)` | Comparable sizing choice, **not proof of toast-specific legacy parity** |
| Toast persistence and duration | No common duration/error policy in selected legacy stylesheet | `src/components/ui/toast.tsx:139-141` — timed 4.5–15s, errors persistent | **Unknown legacy equivalence; leave F2 unticked** |
| Popup keyboard behavior | Legacy has no single documented keyboard matrix for every profile/popover variant | `src/components/ui/dropdown.tsx:86-130`, `src/components/ui/popover.tsx:18-57` handle Escape, dismissal/focus and Arrow/Home/End | Improvement; keyboard/browser equivalence unverified |

The restored clean `Dropdown` was extended with typed `mobileSheet` and `triggerClassName` props, *one* `<details>...</details>` parent and a single child popup; its phone sheet styles and scrim are in the UI component/overlay stylesheet, not duplicated markup. No CI/typecheck/browser run was performed.

- [ ] **Codemod prepared (not executed):** `scripts/codemods/chat16-overlays.cjs` uses the TypeScript JSX AST to replace only proven `open && <div className="fixed inset-0">` + dismissing backdrop + `role="dialog"/"alertdialog"` true-modal + matching literal heading patterns with a shared `<Dialog>` (both open/close wrappers removed); run `node scripts/codemods/chat16-overlays.cjs` to preview or append `--apply` to convert; current main search shows only a `pointer-events-none` confidentiality watermark and already-shared/nonmodal dialogs, so ambiguous cases are intentionally skipped for human review. 

## 2026-10-19 follow-on overlay codemod and source values

- [x] **Codemod authored, not executed:** `scripts/codemods/chat16-overlays.cjs` now recognizes literal `open &&` or `open ? overlay : null` fixed-inset scrims plus modal panel with matched backdrop `setOpen(false)` and heading, and emits one always-mounted shared `Dialog` or full-height left/right `Drawer`. It replaces the full AST conditional and both old closing tags. Run `node scripts/codemods/chat16-overlays.cjs` for a dry-run summary; the orchestrator can use `--apply` after inspecting `changes` and `skipped`. It does **not** replace `aria-modal=false` popovers, existing shared Dialog callers, dynamic handlers, or the confidentiality watermark.
- [ ] **Coverage still open:** GitHub default-branch search identified `src/app/company-share/[token]/page.tsx:62-64` as an `aria-hidden`, `pointer-events-none` watermark, not a modal. `role="dialog"` results include CSS selectors, current nonmodal `PopoverPanel`, and DOM observer string literals; `role="alertdialog"` matches already-shared Dialog call sites. Counts require a real checkout grep; the script has not been run or its conversions applied.

| F2 property | Legacy exact value / source | vNext value / source | Assessment |
| --- | --- | --- | --- |
| Tooltip table on phone (max 767px) | `docs/design/legacy-styles/components___antddesign.scss:66-79`: max-width `calc(100vw - 32px)`, overflow-x auto, touch scrolling | `src/components/ui/legacy-overlays.css` `[data-slot="info-popover"] [role="tooltip"]` 767px query: same width and scrolling, with nested table scroll constraint | Static values match; browser placement and focus verification open |
| Profile popup desktop | `docs/design/legacy-styles/components___dropdown.scss:96-113`: width up to 280px/viewport-24px, min-height 150px, radius 6px, padding 16px 24px, shadow 9px 11px 28px rgba(0,0,0,.1) | `src/components/ui/legacy-overlays.css` `#lms-topbar-account-dialog`: corresponding values | Static values match; overlay placement unverified |
| Profile popup phone (max 767px) | `components___dropdown.scss:116-126`: width `calc(100vw - 24px)`, radius 14px, padding 16px | `src/components/ui/legacy-overlays.css` `#lms-topbar-account-dialog` mobile query: same width, radius and padding | Static values match; horizontal anchoring needs browser check |
| Notification row hover/focus | `components___notification-drawer.scss:192-223`: 8px radius, neutral-50 hover, neutral-200 border, 0 1px 3px rgba(.04) shadow, .2s ease, 1px accent focus ring | `src/components/ui/legacy-overlays.css` notification-popup link selectors: comparable radius, fill, border, elevation, transition, focus offset | Matched selected values; item/row coverage incomplete |
| Toast shadow design fallback | No canonical toast shadow in selected SCSS; notification surface is `components___notification-drawer.scss:113-121` (layered elevation) | `src/components/ui/legacy-overlays.css` defines scoped `--lms-toast-shadow` for toast-stack and ToastAction with the notification elevation | Closest available visual reference, **not proof of exact toast parity** |
| Toast timeout/interaction | No universal legacy toast duration or error persistence documented | `src/components/ui/toast.tsx:139-141` uses reading-duration 4.5–15s and persistent errors | **Unverified**, F2 stays unticked |

**Strict status:** F1 and F2 remain unchecked. No codemod execution, JSX compiler, typecheck, lint, CI, app run, or responsive browser comparison was performed in this lane turn.

## Chat-16 complete-file work queue — source migration checkpoint

Each checked file was re-read for remaining hand-built popup wrappers and paired opening/closing tags. “Done” means the **source has moved to or already uses the shared primitive**, not that runtime/viewport equivalence was measured. No app, codemod, CI, lint, or typecheck was run.

### Migrated or shared components reviewed — DONE

- [x] `scripts/codemods/chat16-overlays.cjs` — AST-limited Dialog/Drawer converter, dry-run default; skips nonmodal/watermark/dynamic wrapper cases.
- [x] `src/components/ui/dropdown.tsx` — one balanced native `<details>` root, `summary` and one panel; shared dismissal, mobileSheet, inlineDesktop, Escape and Arrow/Home/End keyboard support.
- [x] `src/components/ui/tooltip.tsx` — shared InfoPopover/Tooltip, outside pointer dismissal, Escape trigger-focus recovery, legacy size/arrow via overlays CSS.
- [x] `src/components/ui/popover.tsx` — PopoverPanel and PopoverListbox; common surface and arrow navigation for links or option buttons.
- [x] `src/components/ui/searchable-select.tsx` — own option popup replaced with shared PopoverListbox; input selection logic preserved.
- [x] `src/components/shell/topbar/command-search.tsx` — command results now shared PopoverListbox; custom search key handlers retained.
- [x] `src/components/tpo/tpo-find-shortcut.tsx` — result popup now shared PopoverListbox inside existing shared Dialog.
- [x] `src/components/profile/learner-skill-catalog-input.tsx` — skill suggestion listbox now shared PopoverListbox; native list/options retained.
- [x] `src/components/placements/placement-drive-workspace.tsx` — “Drive actions” responsive inline/mobile action menu now shared Dropdown, with desktop action row and a single action subtree.
- [x] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` — row “More” popup migrated from native details/menu wrapper to shared Dropdown, both closing tags updated.
- [x] `src/app/(authenticated)/tpo/students/page.tsx` — roster “More student tools” moved to shared Dropdown; other filter/outcome disclosures left inline.
- [x] `src/components/shell/topbar/account-menu.tsx` — existing shared PopoverPanel; focus/outside/Escape handlers reviewed, no unshared modal.
- [x] `src/components/shell/topbar/organization-switcher.tsx` — existing shared PopoverPanel; workspace permissions/controls remain intact.
- [x] `src/components/shell/learner-notification-bell.tsx` — one notification-content subtree now uses desktop PopoverPanel and native mobile Drawer (kept mounted through exit), with existing InlineNotice and controls.
- [x] `src/components/tpo/tpo-bell-panel.tsx` — one notification list and action footer use legacy desktop notification PopoverPanel (12px source styling) or native mobile Drawer.
- [x] `src/components/hr/hr-recruiter-bell.tsx` — desktop PopoverPanel and now persistently mounted mobile Drawer for the exit animation.
- [x] `src/components/hr/recruiter-notification-bell.tsx` — existing shared native Drawer; no handcrafted overlay found.
- [x] `src/components/tpo/tpo-mobile-footer.tsx` — existing shared BottomSheet for mobile destinations.
- [x] `src/components/tpo/tpo-notice-undo-toast.tsx` — existing shared ToastAction, keeping the 30-second undo semantics.
- [x] `src/components/ui/toast.tsx` — existing shared ToastProvider/ToastStack/ToastAction; source inspected, durations unchanged because no canonical legacy duration is proved.
- [x] `src/components/ui/menu.tsx` — shared Menu/MenuItem/MenuSeparator handles keyboard, states and separators.
- [x] `src/components/ui/dialog.tsx` — shared native modal/alertdialog; no hand-built wrapper.
- [x] `src/components/ui/drawer.tsx` — shared native drawer including responsive inline filters.
- [x] `src/components/ui/legacy-overlays.css` — legacy source-backed modal/drawer/menu, tooltip, notification and toast styling.
- [x] `src/components/tpo/tpo-topbar-new-menu.tsx`, `src/components/tpo/tpo-company-memory-workspace.tsx`, `src/components/tpo/recruiter-leads-workspace.tsx`, `src/components/placements/report-interactive-table.tsx`, `src/components/tpo/recruiter-roster-display-controls.tsx`, `src/components/tpo/tpo-spreadsheet-grid.tsx`, `src/components/placements/tpo-drive-workspace-nav.tsx`, `src/components/shell/topbar/tpo-quick-create.tsx`, `src/components/ui/split-button.tsx` — already use shared Dropdown; no remaining hand-built action-menu wrapper found in reviewed source.

### Inspected non-overlay disclosures — intentionally keep inline

These are expand/collapse content, filters, academic details, results, or forms; converting them into a modal would change the page’s content arrangement or workflow.

- [x] `src/components/admin/college-create-form.tsx`, `src/components/courses/learner-course-list.tsx`, `src/components/projects/learner-project-mobile-filters.tsx`, `src/app/(authenticated)/admin/features/page.tsx`, `src/components/tpo/tpo-students-spreadsheet.tsx`, `src/components/projects/learner-project-board-search.tsx`.
- [x] `src/components/courses/quiz-attempt-control.tsx`, `src/app/(authenticated)/hr/conversations/page.tsx`, `src/components/placements/learner-jobs-browse.tsx`, `src/app/(authenticated)/college/contacts/page.tsx`, `src/components/courses/college-lesson-visibility-controls.tsx`, `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`, `src/components/verification/VerificationFilterPanel.tsx`.
- [x] `src/components/courses/faculty-course-home-signals.tsx`, `src/components/courses/learner-course-workspace.tsx`, `src/components/courses/faculty-course-workspace.tsx`, `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx`, `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`, `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx`, `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`.
- [x] `src/app/company-share/[token]/page.tsx` — fixed-inset confidentiality watermark is `aria-hidden` and `pointer-events-none`, not a modal.
- [x] `src/components/shell/route-announcer.tsx`, `src/components/hr/recruiter-conversation-live-refresh.tsx` — quoted `role="dialog"` strings are DOM-observer selectors, not handcrafted overlay JSX.

### Strict remaining parity gates — NOT complete

- [ ] F1/F2 viewport behavior: 375px, 767px, 768px and desktop; Escape, outside pointer, focus trap/recovery, scrolling/safe areas, reduced motion, disabled and loading variants.
- [ ] Legacy toast timing/persistence and popup close animation source equivalence: no single canonical legacy value in the examined SCSS.
- [ ] Checkout-wide command-line audit of dynamic JSX/class compositions and style precedence after the orchestrator runs the codemod; GitHub search is an index, not an exhaustive local grep.
- [ ] Review device/browser performance of `Dropdown.inlineDesktop` across the 767→768 breakpoint and its nested More action dropdown.

### Final source scan and caution

- [x] Search-index review: the only `fixed inset-0` in public source is the noninteractive, aria-hidden confidentiality watermark. Shared `Dialog` consumers own all inspected `role="alertdialog"` usages. Existing nonmodal `PopoverPanel` and DOM selector literals are not modal candidates. Hand-built search listboxes identified in command search, TPO find, learner skill suggestions and SearchableSelect were moved to shared `PopoverListbox`.
- [x] Paired JSX opening/closing tags re-read in the changed Dropdown, Tooltip, Popover, search listbox consumers, responsive drive actions, and three notification bell variants. No local execution was done; this is a source-only balance check.
- [ ] Viewport/browser parity still requires the orchestrator: especially the new mobile notification Drawer breakpoint, scroll/focus, and layered popup close timing. Keep F1/F2 unchecked until measured.

## Replacement chat-16 continuation (2026-10-19)

- [x] Synced the previous chat-16 head `5f76b8c7` with inspected main `2d3438d2` via history-preserving merge `d10a8bee`; used the main tree because upstream already contained the previously reviewed Tooltip, Dropdown and overlay CSS implementations. The prior HR list row styling in the lane was superseded by main; no old modal markup was reintroduced.
- [x] Source-backed desktop notification surface: `docs/design/legacy-styles/components___notification-drawer.scss:109-125` specifies a 360px minimum and viewport-safe 420px maximum; `src/components/ui/legacy-overlays.css` now uses `min-width:min(360px,calc(100vw - 24px))` and the existing `max-width:min(420px,calc(100vw - 24px))`. This preserves the exact desktop min at viewports 384px and wider while constraining small viewports. Runtime responsive proof is still pending.
- [x] Reviewed `src/components/tpo/tpo-bell-panel.tsx`: removed a duplicate `mobile` state, `root`/`trigger` refs, and duplicate document listeners introduced by overlapping main/lane integration; retained one media listener and the compact-desktop outside/Escape listener. Preserved `allReadRevision`, `readIds`, `latest`, and `refreshing` state declarations; re-read the closing `Drawer`/`PopoverPanel`, fragment and nested list/button tags in source.
- [x] Reviewed `src/components/hr/hr-recruiter-bell.tsx`: added missing `ShellNavGlyph` import from `src/components/shell/shell-nav-icons.tsx` while preserving one mobile Drawer and the existing desktop PopoverPanel, including both closing tags.
- [ ] F1/F2 strict tick **still not permitted**: no fresh local checkout grep or browser comparison was run; popup close timing, toast-specific legacy policy, all icon/context-menu variants and all device/disabled/loading states have not been fully proven. The SCSS fragment proves only the specified notification desktop width row, not the whole category.

**Next file for source-level follow-up:** `src/components/ui/dropdown.tsx` — reconcile the mobile sheet's 640px implementation breakpoint with the old notification drawer's 767px boundary, then assess keyboard, outside-click and exit behavior without replacing disclosure-style page content. The orchestrator must run the checkout greps and phone/tablet checks before either F1 or F2 can be ticked.


## Replacement chat-16 F2 source file completion (2026-10-19, next batch)

The following four source files were edited and re-read after the latest main reconciliation. **A file checkbox below means source editing/review completed, not whole-category strict parity.** No app, viewport simulator, tests, typecheck, lint, CI or codemod was executed.

### Exact checked values (legacy SCSS : vNext path:line)

| Property / state | Legacy exact source | vNext current source | Source verdict |
| --- | --- | --- | --- |
| Action/notification mobile cutoff | `docs/design/legacy-styles/components___notification-drawer.scss:23` — `767px` | `src/components/ui/dropdown.tsx:34,111,126` — `<=767` sheet-position logic, backdrop event and `md:` anchor switch; `src/components/ui/legacy-overlays.css:127,139,152,157` — `@media(max-width:767px)` | Match breakpoint; general action-sheet layout is **not** the notification right-drawer variant |
| Dropdown/header surface fill | `components___dropdown.scss:96-99` — `#fff` | `src/components/ui/dropdown.tsx:126` — `bg-white` | Match |
| Dropdown/header surface radius | `components___dropdown.scss:100` — `6px` | `src/components/ui/legacy-overlays.css:147-150` — `6px`, `src/components/ui/dropdown.tsx:126` — `md:rounded-[6px]` | Match for desktop |
| Dropdown/header surface shadow | `components___dropdown.scss:98` — `9px 11px 28px rgba(0,0,0,.1)` | `src/components/ui/legacy-overlays.css:147-150` — same value | Match |
| Dropdown/header minimum width | `components___dropdown.scss:102-105` — `100px` | `src/components/ui/dropdown.tsx:126` — `min-w-[100px]` | Match for non-mobile-sheet default |
| Dropdown/header inner padding | `components___dropdown.scss:101` — `16px 24px` | `src/components/ui/dropdown.tsx:126` — `py-4 px-6` for regular popup | Match regular popup, not mobile action sheet |
| Trigger hover | `components___notification-drawer.scss:42-45` — `rgba(0,0,0,.035)` | `src/components/ui/dropdown.tsx:124` — same value | Match notification-style trigger |
| Trigger active | `components___notification-drawer.scss:46-49` — `rgba(0,0,0,.06)` | `src/components/ui/dropdown.tsx:124` — same value | Match notification-style trigger |
| Trigger background transition | `components___notification-drawer.scss:41` — `background .2s ease` | `src/components/ui/dropdown.tsx:124` — background-color 200ms ease | Match |
| Mobile backdrop colour | `components___antddesign.scss:143-145` — `rgba(30,54,63,.1)` | `src/components/ui/legacy-overlays.css:131-136` — same RGBA | Match mobile sheet with Ant drawer mask, not the distinct desktop notification backdrop |
| Mobile menu edge radius and safe area | Old `components___notification-drawer.scss:22-24,395-493` — mobile cutoff/16px pad and device safe-area handling; **no generic bottom-sheet corner radius in those source lines** | `src/components/ui/dropdown.tsx:126`, `legacy-overlays.css:139-160` — 12px upper corners, bottom safe-area pad and 70dvh height | Source-backed safe area and cutoff; bottom-sheet radius/height not independently legacy-proved |
| Tooltip surface | `components___antddesign.scss:48-57` — background `#1a1d21`, radius `8px`, 12/16 type, 6px 16px padding, 27px min-height, `0 2px 8px rgba(0,0,0,.2)` | `src/components/ui/legacy-overlays.css:98-110`, `src/components/ui/tooltip.tsx:64` | Match listed static values |
| Tooltip arrow | `components___antddesign.scss:59-64` — dark, 10×10px, right -2px | `src/components/ui/legacy-overlays.css:111-115`, `tooltip.tsx:64` | Match static dimensions and offset |
| Tooltip mobile width/scroll cutoff | `components___antddesign.scss:66-79` — through 767px: `max-width:calc(100vw - 32px)`, horizontal scrolling and touch scrolling | `src/components/ui/legacy-overlays.css:116-125` — same width/scroll; `tooltip.tsx:64` — desktop 260px cap and absolute placement start at `md`, not `sm` | Match width cutoff, but actual popover placement/flow not visually checked |
| Notification menu row minimum | `components___notification-drawer.scss:21,37-45` — 44px touch target | `src/components/ui/menu.tsx:39` — `min-h-11` | Match |
| Menu row hover/active | `components___notification-drawer.scss:18-19,39-49` — `.035` / `.06` black fill | `src/components/ui/menu.tsx:39`, `legacy-overlays.css:173-178` — same fills | Match |
| Menu row transition | `components___notification-drawer.scss:202` — background, border and shadow transitions `.2s ease` | `src/components/ui/menu.tsx:39` — those properties, 200ms ease | Match selected row variant |
| Menu row disabled | Bundled notification styles do **not** define an all-menu canonical disabled opacity | `src/components/ui/menu.tsx:37-39` — native disabled, aria-disabled, opacity 50%, noninteractive | Functional guard in source; exact legacy visual disabled state **unproved** |
| Menu focus and keyboard | Bundled notification SCSS specifies visible focus styles but not an arrow-navigation algorithm | `src/components/ui/menu.tsx:10-30` — up/down/home/end/escape with now-hidden/inert exclusion; `dropdown.tsx:67-95,117-145` — outside/focus/Escape/list movement | Keyboard coverage reviewed; runtime and focus equivalence still **unproved** |

### Responsive rules — source-only breakpoint inspection

| Nominal viewport width | vNext rule or component branch | Corresponding legacy source | Source outcome |
| --- | --- | --- | --- |
| 375px phone | `Dropdown.mobileSheet`: fixed full-width, bottom aligned; pseudo-scrim; 44px trigger; safe-area pad; at most 70dvh | `components___notification-drawer.scss:22-24,395-493`; `components___antddesign.scss:143-145` | Mobile breakpoint, scrim and touch minimum match; bottom-sheet geometry is a non-identical variant |
| 640px phone/landscape | Still the same mobile sheet and scrim (previously diverged at 640px) | Legacy mobile cutoff 767px | Breakpoint regression fixed |
| 767px narrow tablet | Still mobile sheet; tooltip still uses phone width/scroll rule | `components___notification-drawer.scss:23`; `components___antddesign.scss:66-79` | Static breakpoint matches |
| 768px tablet | `md:absolute` anchored popup; sheet scrim removed, desktop width and 6px radius; inlineDesktop disclosures become inline; tooltip desktop placement/cap | Legacy `max-width:767px` rules no longer apply | Source breakpoint handoff matches; layout not device-checked |
| 1024px desktop | Anchored dropdown and keyboard/outside dismissal; no mobile scrim | `components___dropdown.scss:93-105` | Desktop surface values match selected legacy dropdown |

### Source coverage scan, not a checkout grep

A fresh GitHub **default-branch** code-search query (which can lag and is NOT checkout-wide or guaranteed complete) returned these results scoped to `src/`:

- `"fixed inset-0"`: **1 file**, `src/app/company-share/[token]/page.tsx`, the documented noninteractive `aria-hidden` watermark.
- `"role=\\"dialog\\""`: **4 files**, `src/components/ui/popover.tsx` (shared nonmodal panel), `src/components/shell/route-announcer.tsx`, `src/components/hr/recruiter-conversation-live-refresh.tsx` (quoted DOM selectors), and `src/app/globals.css` (style selector).
- `"role=\\"alertdialog\\""`: **4 files**, `src/components/ui/confirm-action-dialog.tsx` plus 3 TPO callers passing the role to the shared Dialog.
- `"<details"`: **17 src files**, primarily reviewed disclosure/form panels; a search for `data-slot="dropdown-root"` also identifies the shared Dropdown and CSS/observer references.

These do **not** satisfy the strict branch-wide zero-hand-rolled-overlay proof. Run in an actual checkout: `git grep -n 'fixed inset-0' -- src`, `git grep -n 'role="dialog"' -- src`, `git grep -n 'role="alertdialog"' -- src`, and inspect every non-shared JSX match, plus viewport/focus/animation checks.

### File-level queue (source phase only)

- [x] `src/components/ui/dropdown.tsx` — completed legacy breakpoint/trigger/source review, preserved one `<details>`, one `<summary>`, one popup `<div>` and matching `</details>`.
- [x] `src/components/ui/legacy-overlays.css` — completed sheet CSS 767px cutoff and legacy values review; 4 media blocks changed, other popup variants left unchanged.
- [x] `src/components/ui/tooltip.tsx` — completed tooltip 767px breakpoint alignment and source review, preserved `<details>`/`</details>`, `<summary>`/`</summary>`.
- [x] `src/components/ui/menu.tsx` — completed row state/motion and hidden/inert keyboard candidate review, preserved `Menu`, `MenuItem`, `MenuSeparator` exports.

**STRICT CATEGORY STATUS — F1 [ ], F2 [ ].** Cannot tick without exact legacy value proof for all variants (including toast policy/exit timing), true checkout grep, phone/tablet/browser behavior and no-regression verification. The source tables above prove only the rows labeled Match. No code/application/CI execution was performed.

**Next source file:** `src/components/ui/popover.tsx` (review listbox keyboard semantics and responsive popup geometry), followed by `src/components/ui/toast.tsx` and then the F1 confirmation-specific actions in `src/components/ui/confirm-action-dialog.tsx`.
