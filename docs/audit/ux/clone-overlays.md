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


### Popover follow-up source review — completed source file

- [x] `src/components/ui/popover.tsx` — listbox arrows/Home/End now skip editable fields and hidden/inert actions, while Escape still dismisses and returns focus to its owning trigger. The shared `PopoverPanel` remains a **nonmodal** `<section role="dialog" aria-modal={false}>` with the matching `</section>`; the listbox keeps its single `<div role="listbox">` and `</div>`. No page-level layout or content changed.

| Property/state | Old LMS source | Current vNext source | Result |
| --- | --- | --- | --- |
| Basic header popup background/radius/elevation | `docs/design/legacy-styles/components___dropdown.scss:96-100`: white, 6px radius, 9px 11px 28px rgba(0,0,0,.1) | `src/components/ui/popover.tsx:23-26`; `src/components/ui/legacy-overlays.css:190-204`: white, 6px, identical shadow | Exact static visual match on the shared nonmodal panel; consumer geometry may differ |
| Notification listbox maximum width/height | `components___notification-drawer.scss:113-126`: max min(420px, viewport - 24px), max min(520px, viewport - 120px) | `src/components/ui/legacy-overlays.css:218-220`: same constraints, dynamic viewport instead of vh | Numeric cap matches; viewport-unit enhancement documented |
| Popup links / touch target | `components___notification-drawer.scss:21,39-49`: min 44px, hover rgba(0,0,0,.035), active .06 | `src/components/ui/legacy-overlays.css:221-226`: same numeric values | Match selected link states |
| Option focus, disabled, keyboard | Legacy bundled SCSS gives focus appearance but no canonical algorithm | `src/components/ui/popover.tsx:34-62`: Escape, ArrowUp/Down, Home/End, visible options only, preserve editable caret | Source functionality reviewed; keyboard/browser equivalence unknown |
| Popover phone/tablet width | `components___notification-drawer.scss:23,113-126,395-493`: 767px mobile drawer, notification desktop 420px max | Generic shared popup is nonmodal; phone bell consumers use native Drawer and desktop uses PopoverPanel; `popover.tsx` itself defines no breakpoint | Source-specific consumer paths are documented, but no runtime/viewport proof |

**Next file to resolve:** `src/components/ui/toast.tsx`; look for an actual legacy toast/message-specific duration and presentation reference before changing its persistence/timeout semantics. Following that, audit `src/components/ui/confirm-action-dialog.tsx` against `components___antddesign.scss:899-906`. F1/F2 remain unticked.


## Chat-16 next batch: Toast + Confirm — source completion (2026-10-19)

**Lane sync:** merged `origin/main` at `0744985a` into `chatgpt/chat-16-b` via history-preserving commit `7ed131e0`; main tree plus previously reviewed lane-owned overlay blobs and a de-duplicated TPO bell. Never pushed `main`. No app, TypeScript typecheck, lint, tests, CI or runtime viewport comparison performed.

### Checked value-by-value table

| Element / state | Old-LMS authoritative source | Current vNext source | Result and limitation |
| --- | --- | --- | --- |
| Confirm content padding | `docs/design/legacy-styles/components___antddesign.scss:899-906`: `15px 15px 5px 15px` | `src/components/ui/confirm-action-dialog.tsx:14` attaches confirm-scoped class; `src/components/ui/legacy-overlays.css:394-396` sets `padding:15px 15px 5px` on confirm content wrapper | Numeric match on confirm variant; shared dialog untouched |
| Confirm footer gap after body | `components___antddesign.scss:902-905`: `margin-top:21px` | `legacy-overlays.css:401-405`: `margin-top:21px`, footer border/padding removed only on confirm | Numeric match |
| Mobile modal horizontal cap | `components___antddesign.scss:1038-1041`: viewport minus 32px | `src/components/ui/dialog.tsx:43-45`: `w-[calc(100%_-_2rem)]`; `max-w-[36rem]` desktop guard | Width cap match on phone; exact default max width not legacy-proved |
| Mobile modal content height | `components___antddesign.scss:1057-1061`: viewport minus 48px | `src/components/ui/dialog.tsx:43-45`: `max-h-[calc(var(--lms-visual-height)_-_3rem)]` | Numeric 48px match, with dynamic keyboard/viewport aware CSS variable |
| Mobile modal radius | `components___antddesign.scss:1057-1061`: `12px` | `src/components/ui/dialog.tsx:43-45`: token `var(--lms-canvas-radius)` | Token equality requires resolved browser/computed-style check; **not claimed matched** |
| Mobile confirm action gap | `components___antddesign.scss:1064-1072`: `gap:8px` | `legacy-overlays.css:407-410`: `gap:8px` | Numeric match |
| Mobile confirm touch minimum | `components___antddesign.scss:1064-1072`: min button height 44px | `legacy-overlays.css:411-413`: `min-height:44px` | Numeric match |
| Confirm accessible semantics | Old legacy SCSS supplies styles, not keyboard/focus procedure | `confirm-action-dialog.tsx:12-20`: shared native `Dialog` `role="alertdialog"`; cancel auto-focus; dismiss disabled while pending, action disabled/loading during pending | Source behavior covered, parity unproven in browser |
| Toast stack panel elevation | Closest related legacy notification `components___notification-drawer.scss:113-121`: `0 4px 24px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)` | `legacy-overlays.css:233-243`: `--lms-toast-shadow` same value; white surface, 12px corners | Matches closest notification surface, **not an exact old toast design** |
| Toast stack maximum width | Closest notification `components___notification-drawer.scss:114-121`: `max-width: min(420px,100vw - 24px)` | `toast.tsx:71`, `legacy-overlays.css:235-238`: fixed explicit width and cap of `min(420px,100vw - 32px)` | 420px maximum matches; mobile gutters deliberately differ by 8px total; **not exact toast parity** |
| Toast close button target | `components___notification-drawer.scss:21,27-49`: 44px minimum touch | `toast.tsx:80-82` + `legacy-overlays.css:244-247`: 44px minimum and icon label with focus ring | Source numeric match |
| Toast close hover/active | `components___notification-drawer.scss:18-19,39-49`: black at .035/.06 opacity | `legacy-overlays.css:244-245` | Numeric match for the related neutral action |
| Toast description body font | No canonical legacy toast body type found in bundled SCSS | `toast.tsx:77-78`: 13px, line-height 20px | Existing vNext styling preserved; no parity claim |
| Toast success/info lifetime | **No legacy `ant-message` / `ant-notification` or branded toast duration identified in supplied SCSS** | `toast.tsx:137-143`: clamp(2500+70ms per char, 4500ms, 15000ms) | **Unproven**; retain vNext policy rather than invent old timing |
| Toast error persistence | No canonical legacy toast policy identified | `toast.tsx:17-21,137-143`: error toasts not in limited timed queue, no auto-expiry | Source functionality preserved; legacy behavior unknown |
| Toast pause while reading | No explicit old SCSS timing behavior | `toast.tsx:63-69,107-129,146-159`: hover/focus/hidden pause, resume on visibility | Source functionality preserved; browser interaction not run |
| Toast scrollbar/keyboard clearance | Related legacy notifications support mobile safe areas; no identical toast scroll rule | `toast.tsx:54-60,71`: actual visual viewport, bottom safe area, bounded height, overscroll and focus cue | Source behavior reviewed; requires runtime small-screen proof |

### Responsive and state matrix — source inspection only

| Width / mode | Confirm variant | Toast stack | Verified level |
| --- | --- | --- | --- |
| 375px mobile | `Dialog` viewport-32 width cap (nominal 343px), 48px viewport-height clearance, confirm inner 15/15/5, footer 8px gap and min44 actions | Nominal 343px width, inset16px each side, 44px dismiss, visual-viewport bottom+safe area | Static expression checks only, not physical screenshot |
| 640px narrow tablet | Confirm still within `max-width:767px` gap/touch controls | `sm:` right-aligned stack with max420px; distinct from notification drawer's 767px cutoff | Static responsive boundary, not legacy toast breakpoint equivalence |
| 767px | Confirm still mobile 8px/44px footer, browser top-layer dialog | 420px right-aligned cap, viewport insets and scrolling | Source checks only |
| 768px | Confirmation no longer receives mobile-only footer size override (shared desktop button styles); width still max36rem | Same 420px max, desktop right-aligned | Source checks only |
| 1024px desktop | Native modal/focus and nonpending close; 21px confirm footer spacing remains scoped | Right-edge stack, timed statuses and persistent error feedback | Source checks only |
| Reduced motion | Shared Dialog closes immediately when `matchMedia(prefers-reduced-motion: reduce)` is true (`src/components/ui/use-overlay-exit.ts:25-36`) | Existing CSS suppresses entrance animations (`legacy-overlays.css:376-384`); content still dismissible | Code-path inspected; not tested in a browser |
| Pending/disabled | Confirm disables cancel, confirm and backdrop/Escape dismissal by passing `dismissible={!pending}` | Error toasts remain dismissible independent of timed status stack | Source branch inspected; runtime not executed |

### Search / grep provenance

- **GitHub indexed default-branch search only**: `"fixed inset-0"` returned one `src/` file (`src/app/company-share/[token]/page.tsx`, previously confirmed as noninteractive watermark); `"role=\\"alertdialog\\""` returned the shared confirm and three TPO Dialog consumers; `"role=\\"dialog\\""` returned shared Popover and selector literals/CSS. `"<dialog"` returned **88** `src/` matches including imports and strings, so this last result cannot distinguish JSX from imports or prove zero raw dialogs.
- **Branch HEAD direct file-content checks**: fetched `src/components/ui/toast.tsx`, `src/components/ui/confirm-action-dialog.tsx`, `src/components/ui/legacy-overlays.css` after edits. Verified `<Dialog>` / `</Dialog>`, both `Button` closures, `ToastContext.Provider` pair, toast `<section>` closures, and scoped CSS selectors by inspection. All edited TSX shares a complete return tree.
- **Still required checkout grep**: `git grep -n 'fixed inset-0' -- src`, `git grep -n '<dialog' -- src`, `git grep -n 'role="alertdialog"' -- src`, `git grep -n 'data-slot="toast-stack"' -- src` and follow up every actual raw JSX match, including dynamic class compositions. Indexed GitHub search is not equivalent.
- **Still required actual device proof**: 375/640/767/768/1024px, long toast strings, multiple persistent errors, focus recovery, keyboard overlay while resizing visualViewport, pending confirm, 44px targets and reduced-motion close. The supplied legacy files do not provide a canonical toast duration/exit policy.

### File-level completion for this batch (source stage)

- [x] `src/components/ui/toast.tsx` — responsive fixed-width cap, persistence/read-time/keyboard/safe-area source sweep; native JSX closures re-read; legacy timing **still unproven**.
- [x] `src/components/ui/confirm-action-dialog.tsx` — confirmation-only legacy geometry hook, pending and role/focus source sweep; paired JSX re-read.
- [x] `src/components/ui/legacy-overlays.css` — exact confirm 15/15/5 + 21px + mobile 8px/44px, no changes to unrelated dialogs or sheets.

**CATEGORY GATES remain: F1 [ ], F2 [ ].** A source-edited file is not full parity unless all values, real viewport behavior, and checkout grep pass the STRICT TICK RULE.

**Next source file:** `src/components/ui/overlay-close-icon.tsx` and `src/components/ui/use-overlay-exit.ts` (confirm/drawer glyph, reduced-motion exit), then continue F1 consumer audit for raw native modal declarations.


## Chat-16 F1 primitive completion — current batch (2026-10-19)

Reconciled latest `main` at `68d52934` into the lane before editing. No application, test, CI, lint, screenshot or computed-style runner executed.

### Legacy exact-value and state comparisons

| Element/state | Old LMS SCSS value, source | vNext value, source | Verdict |
| --- | --- | --- | --- |
| Mobile drawer cutoff | `components___notification-drawer.scss:23-24,399-406`: mobile through **767px**, right drawer **100%** width | `src/components/ui/drawer.tsx:42`: `md:` side-panel layout only from **768px**; full `w-full` below | Match for non-inline right Drawer |
| Mobile drawer shadow | `components___notification-drawer.scss:401-406`: `-4px 0 24px rgba(0,0,0,.12)` | `src/components/ui/drawer.tsx:42`: same value | Match for right variant; left-nav shadow is separate |
| Mobile drawer header safe area | `components___notification-drawer.scss:407-413`: `padding-top:16px + env(safe-area-inset-top)` | `src/components/ui/legacy-overlays.css:62-69`: same header top padding on right drawer | Match top only; remaining horizontal padding varies by consumer |
| Mobile drawer close minimum | `components___notification-drawer.scss:421-431`: **44px** both axes | `src/components/ui/drawer.tsx:48`: `min-h-11 min-w-11` = **44px** | Match |
| Left-nav drawer width | `components___antddesign.scss:305-308`: **82%**, max **300px** | `src/components/ui/legacy-overlays.css:48-54`: `min(82vw,300px)` | Match |
| Mobile drawer scroll/safe area | `components___antddesign.scss:349-360`: bottom `24px+safe area`, scrolling; notification body separate `components___notification-drawer.scss:431-473` | `src/components/ui/drawer.tsx:50`, `legacy-overlays.css:74-87`: ScrollCue with overscroll, bottom safe area on left variant | Reviewed; consumer-specific scroll padding remains unproved |
| Modal width on phone | `components___antddesign.scss:1038-1041`: `calc(100vw - 32px)` | `src/components/ui/dialog.tsx:44`: `w-[calc(100%_-_2rem)]` | Match for viewport-wide host |
| Modal max height | `components___antddesign.scss:1057-1061`: `calc(100dvh - 48px)` | `dialog.tsx:44-45`: visualViewport height minus **3rem** = **48px** | Numeric match; visual-viewport enhancement |
| Modal border radius | `components___antddesign.scss:1059-1062`: **12px** | `dialog.tsx:44` -> `var(--lms-canvas-radius)` -> `src/app/globals.css:345` **12px** | Source token resolution match; runtime cascade not checked |
| Close glyph canvas | `components___common.scss:1068-1072`: close glyph area **16px** | `src/components/ui/overlay-close-icon.tsx:3-8`: stable `16×16` SVG, block/shrink-0, `aria-hidden` | Match canvas; visual stroke/path not SCSS-proved |
| Modal close desktop diameter | `components___common.scss:1048-1055`: **40×40px**, radius **20px** | `dialog.tsx:51`: `md:min-h-10 md:min-w-10 rounded-full`, **40px** at **768px+** | Match desktop size |
| Mobile close target | Notification mobile `components___notification-drawer.scss:421-431`: **44px** | `dialog.tsx:51` / `drawer.tsx:48`: `min-h-11 min-w-11` through 767px | Match source minimum |
| Modal close placement / shadow | `components___common.scss:1048-1058`: **top16/right16**, shadow `0 2px 8px rgba(0,0,0,.1)` | `src/components/ui/legacy-overlays.css:28-36`, `dialog.tsx:51` | Match specified values |
| Modal title right clearance | `components___common.scss:1100-1103`: **50px** | `legacy-overlays.css:24-27` | Match |
| Modal header | `components___common.scss:1093-1098`: **16px 24px**, 1px bottom rule | `legacy-overlays.css:17-22` | Match stated padding; colour token needs cascade check |
| Confirm content padding | `components___antddesign.scss:899-906`: **15px 15px 5px** | `legacy-overlays.css:394-405`; `src/components/ui/confirm-dialog.tsx:15-16` and `confirm-action-dialog.tsx:13-15` | Match both shared confirm wrappers |
| Confirm footer top margin | `components___antddesign.scss:902-906`: **21px** | `legacy-overlays.css:401-405` | Match |
| Confirm phone button gap / min height | `components___antddesign.scss:1064-1072`: **8px**, **44px** | `legacy-overlays.css:407-414` | Match mobile overrides |
| Confirm disabled/pending | Old visual state is not specified in these SCSS fragments | `src/components/ui/confirm-dialog.tsx:15-20`: native `role=alertdialog`, cancel `autoFocus`, confirm disabled/loading, `dismissible={!pending}` | Source behavior maintained; exact legacy pending visuals not proved |
| Entry animation | Notification panel `components___notification-drawer.scss:113-139`: **200ms ease-out** `translateY(-8px)` | `legacy-overlays.css:348-370`: **200ms ease-out** popup translateY(-8px) | Match notification-style nonmodal entry |
| Dialog/drawer exit durations | No definitive Ant dialog/drawer exit duration in bundled SCSS | `src/components/ui/dialog.tsx:37` **180ms**, `drawer.tsx:36` **200ms**, `bottom-sheet.tsx:28` **180ms**; `use-overlay-exit.ts:16-58` | Implemented, **not claimed identical** |
| Reduced-motion mid-exit | Legacy SCSS does not define native preference-change behavior | `use-overlay-exit.ts:20-57`: immediate close when preferred before or during exit; cleanup/connected opener-focus guard | Defensive behavior complete in source; needs browser test |
| Inline filter drawer handoff | Old notification mobile cutoff **767px** does not govern inline form bars | `drawer.tsx:73-94`: existing **640px** handoff preserved for `inlineDesktop`; no false callbacks when already closed | Explicit separate product variant; not misrepresented as notification parity |

### Responsive proof — source branch table, not browser screenshot

| Width/state | Shared Dialog | Non-inline right Drawer | BottomSheet | Inline filter Drawer |
| --- | --- | --- | --- | --- |
| 375px | viewport-32 width, height-48, 44px close | full-width, 44px close, safe-area header | anchored to bottom, safe-area footer | modal |
| 640px | still 44px close and mobile spacing | still full-width mobile | still bottom-anchored | existing `sm:` inline mode |
| 767px | mobile 44px close and 8px footer gap | still full-width mobile, body paddings not all matched | still bottom-anchored | inline, intentionally distinct |
| 768px | 40px close, desktop padding | bounded right side, up to 600px wide | centered with visualViewport-aware centre and 36rem max width | inline |
| 1024px | bounded 36rem default, escape/backdrop handled by native dialog | max600px right panel | centered max36rem | inline |
| prefers-reduced-motion | `useOverlayExit` closes without delay | same | same | same hook; custom inline layout |
| pending=false / pending=true | confirms allow dismissal / block dismissal while pending | caller controls `dismissible` | caller controls `dismissible` | caller controls `open` |

### Coverage proof from a *bounded indexed-candidate scan*

Using GitHub code search for literal `<dialog` (indexed **default branch**, top 100) yielded **87 distinct TSX candidates** under `src/`. Each candidate was independently fetched **at lane branch HEAD** and inspected for regex `/<dialog(?=[\\s/>])/g`. Result: **87 files inspected, three containing literal native `<dialog>` JSX**: `src/components/ui/dialog.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/bottom-sheet.tsx`. The other **84** use the shared Dialog or mention it as a component/import. This is substantially stronger than trusting excerpts but **does not establish exhaustive checkout grep**: an unindexed file/dynamic construction could be missed. Supplemental default-branch index search for literal `fixed inset-0` returned one `src/` confidentiality watermark, previously exempted.

**Required checkout commands still not executed:**
```sh
git grep -nE '<dialog([[:space:]>])|fixed inset-0|role="dialog"|role="alertdialog"' -- 'src/**/*.tsx'
git grep -nE 'aria-modal|data-closing|prefers-reduced-motion' -- src/components/ui src/components/shell
```

### Whole-file source work completed in this batch

- [x] `src/components/ui/overlay-close-icon.tsx` — 16×16 non-scaling box, hidden SVG, balanced `<svg>`/`</svg>` and native buttons remain labelled.
- [x] `src/components/ui/use-overlay-exit.ts` — close/reopen, reduced motion change, timer cancel, detached opener checks; no JSX.
- [x] `src/components/ui/dialog.tsx` — 767px desktop breakpoint handoff, 44→40px close hit area, named refs, balanced `<dialog>`/`</dialog>`.
- [x] `src/components/ui/drawer.tsx` — right-drawer 767px mobile handoff, scoped 640px inlineDesktop remains, no false closed-state callbacks, paired `<dialog>` and `<Drawer>`.
- [x] `src/components/ui/bottom-sheet.tsx` — 767px mobile sheet cutoff, visualViewport-centred desktop mode, paired `<dialog>`/`</dialog>`.
- [x] `src/components/ui/confirm-dialog.tsx` — shared semantic alertdialog, pending guards and scoped confirm style; paired `<Dialog>`/`</Dialog>`.
- [x] `src/components/ui/use-overlay-webview.ts` — reviewed rather than changed: marker-specific back ownership, cleanup, visualViewport resize/fallback; no local runtime proof.

**F1 [ ], F2 [ ] still unticked**: index-source proof is not a checkout grep, no real phone/tablet focus and animation verification, no full variant/style audit for all consumers, no canonical legacy toast timing or modal exit animation equivalence. Do not promote source-file checkboxes to category completion.

**Next:** `src/components/ui/searchable-select.tsx` and `src/components/ui/disclosure.tsx`, followed by shared `src/components/ui/dropdown.tsx` focus/exit corner cases in nested menus.


## Chat-16 F2 continuation — form popup and keyboard state (2026-10-19)

### Source values and state proofs

| Element/state | Legacy SCSS file:line & exact value | vNext file:line & value | Source result |
| --- | --- | --- | --- |
| Search dropdown top | `docs/design/legacy-styles/components___form.scss:64-69`, `top:calc(100% + 5px)` | `src/components/ui/searchable-select.tsx:141-143`, same | Match |
| Search dropdown width | `components___form.scss:64-68`, `width:100%` | `searchable-select.tsx:143` width full, `legacy-overlays.css:419-420` max width 100% scoped to form, excluding generic 420px cap | Match |
| Search dropdown min/max height | `components___form.scss:70-71`, `120px` / `200px` | `searchable-select.tsx:143` and `legacy-overlays.css:421-422` same | Match |
| Search dropdown shadow | `components___form.scss:74`, `0 14px 16px rgba(0,0,0,.04)` | `legacy-overlays.css:423`, same scoped only to searchable form | Match |
| Search dropdown radius | `components___form.scss:76`, `12px` | `src/components/ui/popover.tsx:62`, scoped `legacy-overlays.css:219`, 12px | Match |
| Search dropdown top padding | `components___form.scss:75`, `5px` | `searchable-select.tsx:143` `pt-[5px]` | Match |
| Search dropdown scrollbar | `components___form.scss:77-79`, Firefox/IE hidden scrollbar and WebKit hidden | `legacy-overlays.css:424-429`, same | Match |
| Search option min height / insets | `components___form.scss:82-86`: 44px, 5px 10px | `searchable-select.tsx:149` `min-h-11`, `py-[5px]`, `px-[10px]` | Match |
| Search option hover/active background | `components___form.scss:88-91`: hover `#d1f1f1` (no independent active styling in source) | `searchable-select.tsx:149`: hover and highlighted active `#d1f1f1` | Hover matches; highlighted active is an extension |
| Search option transition | `components___form.scss:82`: background 200ms ease-in-out | `legacy-overlays.css:430-433`: 200ms ease-in-out | Match |
| Search dropdown z-index | `components___form.scss:69`: 9 | `searchable-select.tsx:143` `var(--lms-z-dropdown)` `src/app/globals.css:837`: 100 | **Intentional layered-overlay difference; exact legacy parity unproved** |
| Search unavailable option | Legacy SCSS lacks canonical disabled option paint | `searchable-select.tsx:45-46,119-123,134,149`: disabled option excluded from keyboard/Enter/ARIA descendant, actual button disabled/opacity | Functional source safety verified; visual parity unproved |
| Tooltip box and arrow | `components___antddesign.scss:48-64`: `#1a1d21`, 8px radius, 27px min, 6/16 padding, 12/16 text, 10px arrow right -2px | `legacy-overlays.css:98-115`, `tooltip.tsx:67` | Static values match, glyph still needs device screenshot |
| Tooltip keyboard toggle | Old details/Ant behavior not documented as a keyboard algorithm in bundled SCSS | `tooltip.tsx:47-64`: keyboard and assistive click `detail=0` toggles, touch/pen toggles from pointerdown, mouse hover/focus persists, Escape restores summary | Source behavior reviewed; live focus verification missing |
| Dropdown hidden menu selection | Old SCSS describes hover/size not the algorithm | `dropdown.tsx:117-145`: Arrow/Home/End skip hidden/inert/disabled entries, Escape restores summary, outside pointer/focus dismisses | Source functionality reviewed; requires browser |
| Modal route focus cleanup | Legacy focus path unspecified | `dialog.tsx:41`, `drawer.tsx:39`, `bottom-sheet.tsx:30`: detached opener not focused; `use-overlay-exit.ts:21-30` shares guard | Source path reviewed; route-navigation test pending |

### Static breakpoint expressions

| Width | SearchableSelect | Tooltip | Dropdown.mobileSheet |
| --- | --- | --- | --- |
| 375px | 100% of parent with max-height200, min-height120, 44px option target; no `sm` handoff on search popup | viewport minus32, flow positioning, keyboard/touch trigger min44 | bottom full width/safe area, scrim, max70dvh |
| 640px | same option geometry; menu scroll bounded | phone width and flow, not yet absolute | still sheet (fix retained across 640–767) |
| 767px | same option geometry | viewport minus32; SCSS `max-width:767px` rule still active | still sheet and scrim |
| 768px | same form list geometry | `md:` absolute anchored popup max260px | `md:` anchored action popup, scrim removed |
| 1024px | listbox follows input parent width, max height200; keyboard/Enter guarded | desktop anchored tip, hover/focus/keyboard | desktop anchored 6px-radius popup |

### File-level source work

- [x] `src/components/ui/searchable-select.tsx` — old form dropdown height/row source values, controlled-state active-option validation, no Enter on disabled/replaced option, paired PopoverListbox/Input/Button markup; source proof only.
- [x] `src/components/ui/legacy-overlays.css` — scoped searchable-listbox override for width, shadow, scrollbar and row transitions; other notifications untouched.
- [x] `src/components/ui/tooltip.tsx` — keyboard/assistive click toggles while hover/pen behaviors remain distinct; balanced native `<details>`/summary/tooltip.
- [x] `src/components/ui/dropdown.tsx` — both option scans exclude hidden/inert nodes; retained mobile/desktop media handoff and paired details/summary/menu.

**F1 [ ], F2 [ ] remain unticked.** GitHub-indexed candidate checks are bounded, not a checkout grep. Exact legacy dropdown z-index, popover exit timing, toast timeout policy, all consumer responsive/hover/disabled states and actual browser behavior are still open.

**Next file for F2:** `src/components/ui/popover.tsx` — finish disabled/listbox keyboard interaction audit; then `src/components/ui/menu.tsx` and `src/components/ui/toast.tsx` for row/notification state completeness.


### Final F2 keyboard-inert-option follow-up (same turn)

- [x] `src/components/ui/popover.tsx`: `PopoverListbox` now filters `[aria-disabled="true"]` ancestry as well as hidden/inert, zero-geometry elements before arrow/home/end focus; keeps editable caret handling, Escape dismissal and the same closing `</div>` and `</section>` tags.
- [x] `src/components/ui/menu.tsx`: all roving `MenuItem` candidates exclude disabled ancestry in addition to local disabled and hidden/inert; menu entry height `44px` and 200ms hover/active values retain their prior source matching.
- [x] `src/components/ui/dropdown.tsx`: both summary-first and open-menu traversal use matching filter, so nested disabled/hidden descendants cannot gain programmatic focus; the mobile 767px cutoff, summary closure, Escape, outside-pointer and desktop inline exceptions remain unchanged.

| State | Legacy reference | vNext result | Gate |
| --- | --- | --- | --- |
| Menu touch minimum | `components___notification-drawer.scss:21,37-49`: 44px | `src/components/ui/menu.tsx:39`: `min-h-11` | Numeric match |
| Menu hover / active | `components___notification-drawer.scss:18-19`: `.035`/`.06` neutral black | `menu.tsx:39`, `legacy-overlays.css:173-178` | Numeric match |
| Menu keyboard disabled ancestry | No canonical behavior in old SCSS | `menu.tsx:15-16`, `popover.tsx:47-55`, `dropdown.tsx:122,132`: excludes aria-disabled ancestry | Source functionality complete; browser unverified |

**Strict category status: F1 [ ], F2 [ ].** Even the 87-file indexed JSX scan is not a checkout-wide grep; the viewport comparison tables above prove source breakpoints only. No application, CI or screenshot execution.


## Chat-16 continuation: toast lifetime and notification consumer states (2026-10-19)

Source-only review after fast-forwarding `chatgpt/chat-16-b` to the latest `main`. No application or CI execution; the table is a property-level audit, not a claim of full screenshot parity.

| Property / state | Old LMS file:line + exact reference | vNext file:line + present value | Result |
| --- | --- | --- | --- |
| Toast surface shadow | Closest comparable notification panel `docs/design/legacy-styles/components___notification-drawer.scss:113-121`: `0 4px 24px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)` | `src/components/ui/legacy-overlays.css:233-242` same toast shadow token | Closest notification match; **not a canonical legacy toast** |
| Toast maximum desktop width | Notification panel `components___notification-drawer.scss:113-126`: max 420px | `src/components/ui/toast.tsx:71`: max 420px and 16px right inset from 640px | 420px cap matches; anchoring is toast-specific |
| Toast phone gutters | No toast-specific gutter rule in bundled legacy SCSS (notification panel uses viewport-24 maximum) | `toast.tsx:71`: 16px each side, max width `100vw-32px` | Source value reviewed, **not old toast value proven** |
| Dismiss button minimum | Notification trigger `components___notification-drawer.scss:21,27-49`: 44px | `toast.tsx:80-82`, `legacy-overlays.css:244-247`: 44px | Match touch target |
| Dismiss hover / active | Notification trigger `components___notification-drawer.scss:18-19,41-49`: `rgba(0,0,0,.035)` / `.06` | `legacy-overlays.css:244-245` same states | Match related neutral action |
| Toast entry animation | Notification popup `components___notification-drawer.scss:124-139`: 200ms ease-out, translateY(-8px) | `legacy-overlays.css:343-369`: `lms-legacy-popup-enter` 200ms ease-out, -8px | Match comparable popup entry |
| Toast status vs error semantics | SCSS does not prescribe live-region accessibility | `toast.tsx:72`: role=status for informational; role=alert for errors. `ToastAction` also now uses role=alert for actionable errors | Source semantics checked, no visual equivalence asserted |
| Toast informational timeout | No canonical branded toast lifetime found in the provided old-LMS SCSS | `toast.tsx:156-164`: 4.5–15s proportional reading time; no automatic timeout for error | **Legacy timing unknown; preserve established vNext rule** |
| Toast pause/resume | Legacy styles cannot specify background-tab elapsed timing | `toast.tsx:92-182`: remaining time decremented by real elapsed interval when hover, focus or visibility hides timers; resumes **remaining** time; clears on eviction/dismiss | Source behavior corrected; needs hover/visibility integration test |
| Toast scroll and visual viewport | Related legacy notification mobile safe-area handling `components___notification-drawer.scss:399-490` | `toast.tsx:54-72,184-201`: actual visual viewport, safe-area top/bottom, scrollable stack | Source verified; exact legacy toast responsive variant not found |
| HR bell phone touch | Legacy `components___notification-drawer.scss:21`: 44px target | `src/components/hr/hr-recruiter-bell.tsx:110-118`: 44px through 767px, then 36px topbar icon | Mobile numeric match; desktop icon intentionally distinct |
| TPO bell phone touch | Same 44px trigger target | `src/components/tpo/tpo-bell-panel.tsx:136-139`: compact 44px through 767px, desktop 36px | Mobile numeric match; desktop icon intentionally distinct |
| Header account popup desktop | `docs/design/legacy-styles/components___dropdown.scss:96-112`: white, 6px, shadow `9px 11px 28px rgba(0,0,0,.1)`, padding 16/24, min-height 150px, profile width280px | `src/components/shell/topbar/topbar.module.css:51-55`: same dimensions and shadow | Match checked style values; header-owned file not modified |
| Header account popup phone | `components___dropdown.scss:117-128`: width viewport-24px, 12px side insets, 14px radius, padding16px at max767px | `topbar.module.css:141-142` same | Static breakpoint match; browser overlay placement pending |
| Header menu loading/error/separator | Legacy profile visual SCSS does not give complete menu-state rules | `src/components/shell/topbar/account-menu.tsx:44-134`: keyboard navigation, disabled/loading signout, 1px divider, error role=alert, outside click/Escape | Source coverage inspected; full old state equivalence **not claimed** |
| Date/time picker popup dismissal | Old LMS `components___form.scss:63-95` defines the analogous searchable popup geometry, not a date calendar keyboard algorithm | `src/components/ui/date-input.tsx:148-257`: Escape from trigger/popup and focus leaving its root now dismiss; existing date/time/month options untouched | Source keyboard semantics checked; no unsupported date-geometry equivalence |
| Nested action menu keyboard | No legacy SCSS native event algorithm | `src/components/ui/dropdown.tsx:127-147`: do not handle already-consumed Arrow/Home/End key from nested Menu/Listbox | Source regression fix; verify with browser keyboard |
| TPO undo action | No old LMS toast action timing source | `src/components/tpo/tpo-notice-undo-toast.tsx`: uses existing 30-second inline actionable info notice and 44px phone button | Existing consumer reviewed; different from timed status stack |

### Responsive source matrix (not browser screenshots)

| Width / state | Toast | Header bell and account menu | Date/time/month popup |
| --- | --- | --- | --- |
| 375px | 16px side insets, width343px, 44px close, safe-area bounded scroll | HR/TPO bells min44; header profile menu viewport-24 and 14px radius | 44px phone calendar trigger, 19rem/viewport-32 max panel, Escape/blur close |
| 640px | right aligned 420px cap | HR/TPO min44 to 767; mobile Drawer still selected by JS breakpoint | 44px trigger, calendar grid scroll and outside pointer closure |
| 767px | right aligned 420px cap | HR/TPO 44px, full-width mobile notification Drawer | 44px trigger; popup width bounded by viewport |
| 768px | right aligned 420px cap | compact bell 36px, desktop notification PopoverPanel and 280px account dropdown | desktop 36px date trigger; same PopoverPanel keyboard close |
| 1024px | max420px, right16px | compact bell36px, account width280px, notifications PopoverPanel max420px | anchored popover, keyboard/focus dismissal |
| Hover/focus/doc hidden | Timed toast remaining countdown is paused; errors stay until dismissal | Hover/active and focus selectors already exist in topbar styles | Focus leaving popup or Escape dismisses |
| Error/empty/loading | Error toast role=alert, persistent; informational role=status | Recruiter bell: ErrorState, EmptyState, Skeleton; TPO: role=alert/status for error/loading | Invalid/disabled input disables panel; selections remain caller-owned |

### Coverage provenance — not a checkout grep

GitHub default-branch index searches made this turn: `"ToastAction"` yielded **2** `src/` files (shared `toast.tsx` and `tpo-notice-undo-toast.tsx`); `"ToastStack"` **1**; `"showToast"` **79** source paths (call-site surface, not exhaustive API count); `"notification-popover"` **3** source paths; `"fixed inset-0"` **1** source path (`src/app/company-share/[token]/page.tsx`, watermark exemption); `role="dialog"` **5** source paths (shared Popover, CSS/observer strings); `role="alertdialog"` **4** source paths (TPO shared caller/CSS). Counts are bounded GitHub search results, not local or guaranteed-complete grep.

**Local commands required before strict checkbox completion:** `git grep -nE 'fixed inset-0|<dialog|role="dialog"|role="alertdialog"' -- src` plus browser checks at 375/640/767/768/1024px and runtime hover/focus/document-hidden transitions. No code, typecheck, lint or CI was executed in this lane.

### Completed files in this continuation (source work)

- [x] `src/components/ui/toast.tsx` — real remaining-time pause/resume, persistent error handling, error/action role; JSX pairs reviewed.
- [x] `src/components/ui/date-input.tsx` — popover Escape/blur closure from input or trigger, preserving month/time/date content and paired tags.
- [x] `src/components/hr/hr-recruiter-bell.tsx` — 44px notification trigger through 767px and existing shared Drawer/PopoverPanel intact.
- [x] `src/components/tpo/tpo-bell-panel.tsx` — compact bell phone minimum44px, shared Drawer/PopoverPanel untouched.
- [x] `src/components/ui/dropdown.tsx` — respects nested `defaultPrevented` keyboard event.
- [x] `src/components/shell/topbar/account-menu.tsx` — **reviewed only**, not modified; header ownership retained.

**STRICT CHECKPOINT: F1 [ ], F2 [ ].** Complete numerical overlap on selected rows is not full parity. Legacy toast-specific lifetime and exit policy, exhaustive checkout grep, all consumer states and physical responsive/focus results remain unavailable.

**Next:** `src/components/ui/menu.tsx` and `src/components/ui/popover.tsx` — remaining contextual menu divider/icon states and popover exit-path verification; then client-side browser proof by orchestrator.


### Nested contextual Escape proof (same continuation)

| Path / state | Old LMS reference | Current source behavior | Review |
| --- | --- | --- | --- |
| Escape from menu search input | Legacy dropdown SCSS `components___dropdown.scss:96-105` defines surface, not key handlers | `src/components/ui/menu.tsx:10-30`: preserves input Arrow/Home/End caret, but Escape can close enclosing `<details>` and restore `<summary>` focus | Source keyboard behavior complete; browser comparison outstanding |
| Escape from listbox inside dialog | No equivalent interaction contract in bundled old modal SCSS | `src/components/ui/popover.tsx:34-64`: handled Escape prevents default **and stops propagation** to avoid closing underlying modal/parent menu; existing caller onDismiss + focus restored | Source behavior reviewed; nested integration needs manual verification |
| Escape from nonmodal PopoverPanel | Old menu stylesheet gives no bubbling contract | `src/components/ui/popover.tsx:18-28`: where a panel has an onDismiss callback, own Escape handles and stops event propagation | Source behavior reviewed; caller-specific global Escape also remains |

**File-level source checkpoint:** `src/components/ui/menu.tsx` and `src/components/ui/popover.tsx` reviewed/updated, JSX pairing unchanged. F1/F2 remain unticked until local grep, complete old states and responsive actual device proof.


### Generic action trigger and split-menu state checkpoint

| Property/state | Old LMS source | vNext source | Scope verdict |
| --- | --- | --- | --- |
| Notification/action touch target on phone | `components___notification-drawer.scss:21,27-39`: 44px minimum square interactive trigger | `src/components/ui/dropdown.tsx:124`: generic summary now 44px through 767px, default desktop 36px | Mobile minimum matches comparable legacy notification action; generic header's desktop trigger size not specified in dropdown SCSS |
| Action-sheet trigger desktop distinction | Legacy mobile boundary `components___notification-drawer.scss:23-24`: 767px | `src/components/ui/dropdown.tsx:124`: mobileSheet summary retains 44px at 768px+ via explicit desktop override, preserving prior caller behavior | Responsive branch preserved |
| SplitButton active/disabled menu touch | Comparable touch target `components___notification-drawer.scss:21`: 44px | `src/components/ui/split-button.tsx:28-36`: active Dropdown and disabled menu button both 44px through 767px; desktop min36px | Mobile minimum matches; disabled appearance remains Button-owned and is not old-SCSS-proven |
| SplitButton accessible states | Legacy dropdown CSS does not define React loading/disabled semantics | `split-button.tsx:20-37`: primary/loading/disabled, proper labelled active summary, disabled companion button and no false open menu | Source behavior reviewed, runtime pending |
| Toast timer handle release | Legacy SCSS does not define JavaScript timer IDs | `src/components/ui/toast.tsx:32-41,101-119`: clear `0`-valued and nonzero timeout handles on eviction/dismiss/reschedule | Source correctness; no legacy visual parity claim |

**Responsive static handoff:** 375/640/767px: Dropdown trigger and both SplitButton menu variants min44px; 768/1024px: generic summary and active/disabled SplitButton menu 36px, mobileSheet variant still 44px. Only CSS/JS expressions inspected; no screenshots or computed-style check.

**Source-completed files:** `src/components/ui/split-button.tsx`, and additional final review of `src/components/ui/dropdown.tsx` / `src/components/ui/toast.tsx`. F1/F2 remain unticked because the legacy desktop action trigger is not universally 36px in SCSS, all consumer states are not exact matches, and local grep and runtime verification are absent.


## Chat-16 topbar contextual menu and bell follow-up — 2026-10-20

**Scope:** header account/workspace menus, the three role-specific notification dropdowns, and learner course-search popup. Per-file source audit; not computed-style, rendered screenshot, CI, or exhaustive local grep proof. The topbar CSS file is jointly owned by the shell lane and was read, **not modified**.

### Old-LMS value/state table

| Surface or state | Legacy source + numeric value | Current vNext source + numeric value | Result / exception |
| --- | --- | --- | --- |
| Profile menu panel base | `docs/design/legacy-styles/components___dropdown.scss:96-105`: white, shadow `9px 11px 28px rgba(0,0,0,.1)`, radius **6px**, padding **16px 24px**, minheight **150px**, minwidth **100px** | `src/components/shell/topbar/topbar.module.css:51`: same white, shadow, radius 6, padding 16/24, minheight 150; width 280px, exceeds minimum 100 | Exact listed properties matched; explicit old min-width only implied by 280px |
| Profile width desktop | `components___dropdown.scss:107-113`: width `min(280px,100vw - 24px)` | `topbar.module.css:51`: same | Match |
| Profile phone side offsets / width | `components___dropdown.scss:116-122`: 12px left+right and width `100vw-24px`, for max767px | `topbar.module.css:138-142`: fixed 12px sides, same width until 767px | Match numeric geometry |
| Profile phone radius/padding | `components___dropdown.scss:122-127`: radius **14px**, padding **16px** | `topbar.module.css:141`: same | Match |
| Profile avatar visual diameter | `components___dropdown.scss:135-138`: legacy Ant avatar **44px** | `topbar.module.css:48-49,86-87`: inner avatar 38px desktop/36px phone | **Mismatch remains**: header-shell visual glyph ownership, not silently ticked |
| Profile trigger hit area | Related old notification trigger `components___notification-drawer.scss:21,27-34`: **44px** min | `src/components/shell/topbar/account-menu.tsx:112` `!min-h-11 !min-w-11`: 44px desktop/phone | Match comparable touch minimum, visual inner circle differs |
| Profile action rows | Notification action `components___notification-drawer.scss:21` 44px mobile minimum; dropdown source has no universal row-padding rule | `topbar.module.css:52`: 44px, 8px vertical/11px horizontal, radius7, 13px/600 text | Touch min match, remaining values **unproved** |
| Profile item hover/focus | Old `components___dropdown.scss` lacks canonical profile row color and outline | `topbar.module.css:53-54`: subtle brand hover, 2px focus outline | Source state present; no exact legacy equivalence claim |
| Profile divider | Old `components___dropdown.scss:96-128` no row divider selector | `topbar.module.css:55`: neutral 1px border and 8px vertical margin | Source reviewed, **unproved legacy** |
| Profile pending/error | Old SCSS cannot define signout async/error behavior | `account-menu.tsx:130-137`: pending button disabled+loading, error `role=alert`; Escape/outside/click close and focus restoration | Behavior reviewed; no exact old loading/error visuals |
| Profile keyboard focus | Old dropdown SCSS has no keyboard algorithm | `account-menu.tsx:41-80`: first enabled control or panel fallback, Escape only when event belongs to root, Arrow/Home/End skip editable/disabled/hidden, correct ArrowUp from outside actions | Source reviewed, browser proof pending |
| Workspace popup desktop skin | `components___dropdown.scss:96-113`: white, 6px radius, `9px 11px 28px rgba(0,0,0,.1)`, 280px profile width | `topbar.module.css:378-385`: width `min(280px,100vw-24px)`, white, shadow and radius6, padding16 (different from profile padding24) | Shared surface match, padding difference **unproved** |
| Workspace popup phone availability | `components___dropdown.scss:116-127`: mobile width viewport-24 | `topbar.module.css:393-396`: `.orgSwitcher` intentionally hidden on phone; workspace selection remains in account popover | Different composition; **not claiming matching mobile org popup** |
| Workspace keyboard dismissal | Old SCSS does not specify Escape ownership | `organization-switcher.tsx:29-48,66-72`: active input/select/button focus fallback, trigger focus on shared Escape, and outside pointer/blur closes | Functional source coverage |
| Bell trigger minimum | `components___notification-drawer.scss:21-24,27-34`: min44px, mobile through767px | `hr-recruiter-bell.tsx:110-116`: 44px until767; `tpo-bell-panel.tsx:137-140`: compact min44 until767; `learner-notification-bell.tsx:133-137`: 44px | Numeric mobile match |
| Bell hover/active | `components___notification-drawer.scss:18-19,41-49`: black alpha `.035`/`.06`; 200ms ease | All three trigger files now use exact alpha states and 200ms background transition | Match trigger hover/pressed numeric values |
| Bell desktop icon size | `components___notification-drawer.scss:21`: 44px minimum also documented for desktop | HR/TPO compact topbar remain 36px from 768px; learner 44px | **Known mismatch** on HR/TPO desktop; shell density decision not overridden |
| Bell responsive panel | `components___notification-drawer.scss:3-4,23-24,104-120,399-430`: full-width mobile Drawer through 767px, desktop popup max420px | HR/TPO/learner JSX mobile state uses max-width767 query and shared `Drawer`, desktop `PopoverPanel`; popup limits in `topbar.module.css`, `legacy-overlays.css` | Source breakpoint/width equivalent where noted; consumer variants still browser-unverified |
| Bell panel Escape/outside | Old styles don't define event code; backdrop click-to-close `components___notification-drawer.scss:83-91` | All role bells use common nonmodal `PopoverPanel.onDismiss`; document listeners scoped to owning root and `defaultPrevented`; TPO full (not just compact) popup now closes on outside click | Functional source review; no browser proof |
| TPO bell panel target ID | No old SCSS ARIA contract | `tpo-bell-panel.tsx:137-160`: trigger `aria-controls` selects actual mobile Drawer or desktop Popover id | Accessible state verified in source |
| Learner course popup option hover | Closest old LMS searchable dropdown `components___form.scss:81-91`: min44px, hover `#d1f1f1` | `learner-topbar-tools.tsx:103-106`: same min44 and hover color | Numeric match for comparable result row |
| Learner course popup keyboard/pointer | Legacy form SCSS does not define ARIA events | `learner-topbar-tools.tsx:38-95`: pointerdown outside (touch+mouse), focus-out closure, combobox expanded/controls, Escape, result focus | Source reviewed; exact focus/UI layout not proven |

### Responsive and disabled/loading/empty matrix — **source branches**, not executed viewports

| Width or state | Account menu | Workspace switcher | HR / TPO / Learner bells | Learner search popup |
| --- | --- | --- | --- | --- |
| 375px | fixed topbar-anchored panel, 12px gutters, radius14, padding16, 44px avatar target | header switcher hidden by CSS, account menu still offers switching | full-width native Drawer and 44px bell | search field hidden below 640px in current design; not an old-layout equivalence claim |
| 640px | same mobile profile geometry | header switcher still hidden | Drawer; bell minimum44 | popup opens above existing search input, result actions min44, ARIA combobox |
| 767px | same mobile profile geometry | hidden | Drawer through 767; touch min44 | same search popup and touch results |
| 768px | absolute dropdown width max280px, radius6, padding16/24 | header popover max280, radius6, focusable controls | desktop nonmodal notification popovers, TPO/HR compact bell 36px (old 44px unresolved) | bounded anchored listbox with Arrow/Escape keys |
| 1024px | same desktop style and overflow handling | accessible header switcher | desktop notification panel max420px | navigable results and outside focus/pointer dismiss |
| Hover/active | menu row brand hover (legacy unproved) | neutral hover, active neutral .035 (legacy unavailable) | exact .035/.06/200ms comparable trigger colors | old-form `#d1f1f1` result hover matched |
| Disabled/pending | signout disabled+loading, error live alert | disabled membership/scope controls preserved | TPO pending trigger disabled; HR loading and error states; role-specific empty states kept | live error/empty message, no-results state; no option loss |
| Focus/Escape | first enabled action or panel fallback; Escape restores avatar only from own menu | first control/fallback, Escape restores workspace trigger | panel-local Escape restores trigger, outside pointer closes; native Drawer handles mobile Back/Escape | Escape and blur close, Arrow moves to option links |

### Candidate scan / grep boundary

Executed GitHub indexed **default-branch search** (not checkout grep): literal `<PopoverPanel` returned **5** `src/` files (account, organization, HR bell, TPO bell, learner bell); `role="dialog"` **6** source matches (nonmodal shared Popover plus CSS/DOM-selector strings); `role="alertdialog"` **6** matches (shared confirmation uses and CSS); `fixed inset-0` **1** source match (the pre-existing noninteractive confidentiality watermark). Literal `<dialog` returns many case-insensitive JSX imports, **not a count of raw native <dialog> tags**. This scan is indexed, limited, not equivalent to a branch-wide `git grep`. Previously checked raw native dialog candidates are separately documented above.

Required checkout commands still **not run**:
```sh
git grep -nE 'fixed inset-0|<dialog([[:space:]>])|role="dialog"|role="alertdialog"' -- src
git grep -nE '<PopoverPanel|<PopoverListbox|<Dropdown' -- 'src/**/*.tsx'
```
Required physical viewport/interaction test: 375, 640, 767, 768, 1024px; outside pointer, nested Escape, tab/Shift+Tab, route-remounted focus, reduced motion, error/loading/empty actions and safe-area viewport.

### Completed source-file batch (not a category tick)

- [x] `src/components/shell/topbar/account-menu.tsx`: focused only enabled actions, fixed ArrowUp start, skips nested editables/inert actions; shared Escape restore; 44px avatar hit box; JSX paired.
- [x] `src/components/shell/topbar/organization-switcher.tsx`: initial control fallback, scoped Escape, shared onDismiss and trigger recovery; JSX paired.
- [x] `src/components/hr/hr-recruiter-bell.tsx`: header popup owns Escape; 44px mobile target, 200ms/.035/.06 trigger; Drawer/Popover pairing.
- [x] `src/components/shell/learner-notification-bell.tsx`: scoped document Escape, shared Escape restoration and old trigger neutral states; Drawer/Popover pairing.
- [x] `src/components/tpo/tpo-bell-panel.tsx`: both compact/full desktop outside click close, popup/drawer id+aria-controls, owned Escape, trigger states; JSX pairing.
- [x] `src/components/shell/learner-topbar-tools.tsx`: pointerdown closure, focus escape, ARIA combobox/listbox target and 44px old-form hover result rows.
- [x] Read-only checks: `topbar.module.css`, shared `PopoverPanel`, `tpo-quick-create.tsx`; no unowned stylesheet rewriting.

**F1 [ ], F2 [ ] remain unchecked.** Visual avatar diameter, desktop compact bell hit area, some icon/row/divider states, popup exit timing, canonical toast lifetime, and exhaustive greps are **not** proven identical. Do not report pixel parity.

**Next:** `src/components/shell/topbar/command-search.tsx` — embedded command listbox close/keyboard and mobile popup modes; then `src/components/shell/topbar/tpo-quick-create.tsx` menu item/divider/source states.


## Chat-16 global command listbox and quick-create — 2026-10-20

### Source comparison and states

| Surface/property | Legacy exact value and path | Current vNext source and value | Match status |
| --- | --- | --- | --- |
| Legacy global searchable popup opening offset | `docs/design/legacy-styles/components___form.scss:63-70`: `top:calc(100% + 5px)`, left0, width100% | `src/components/shell/topbar/topbar.module.css:35`: top +8px, width `min(390px,100vw-24px)` | **Known differing top and width** — shell owner CSS left unchanged |
| Legacy global searchable popup size | `components___form.scss:70-76`: min120px, max200px, 12px radius, shadow `0 14px 16px rgba(0,0,0,.04)` | `topbar.module.css:35`: max `min(65vh,430px)`, radius `var(--lms-canvas-radius)`=12px, different shadow | Radius matches, max-height/shadow unproved exact |
| Legacy search option hover/touch | `components___form.scss:82-91`: 44px min, `#d1f1f1` hover, 5px 10px padding, 200ms easing | Command menu `topbar.module.css:36-39`: 44px min, rgba black `.035/.06` hover/active, padding12px/16px | Touch min matches; **colors/insets differ** and not ticked as search dropdown parity |
| Command listbox Escape ownership | Legacy SCSS gives no keyboard algorithm | `src/components/shell/topbar/command-search.tsx:64-96,124-174`: global Escape only from its own open root, inner editable event/default prevention respected, listbox onDismiss restores input | Source behavior validated, no browser claim |
| Composition-safe typing | Old design SCSS no IME semantics | `command-search.tsx:130-178`: React `event.nativeEvent.isComposing` guards input and nested listbox, editable descendants retain caret/Backspace | Functionality safety check, browser pending |
| Command menu loading/error/empty | No canonical old state typography in form SCSS | `command-search.tsx:177-216`: role=status during learner loading and empty; result links, TPO live suggestions, error status | State inventory complete, visual equality not proven |
| Command menu breakpoint | Old dropdown SCSS defines viewport-aware profile overlay at 767px; global-search keyboard popover lacks specific source cutoff | `topbar.module.css:70-80,138-142`: collapsed 36px icon to 767px, expanded input on mobile open, full-width dropdown | Static source branches; no exact old global search equivalence |
| TPO create primary trigger | Old `components___dropdown.scss:96-105` defines generic head dropdown, not a +New button | `tpo-quick-create.tsx:28-40`, `topbar.module.css:40-41,81-82`: desktop 82x36px, phone icon38px nominal + shared Dropdown 44px mobile hit area | Generic menu semantics retained; no unsupported claim of primary trigger pixel match |
| TPO action-menu surface | Old `components___dropdown.scss:96-105`: radius6px, white, shadow `9px 11px 28px rgba(0,0,0,.1)`, minwidth100px | Shared `src/components/ui/dropdown.tsx:125-145`, `legacy-overlays.css:161-173`: 6px, white, exact shadow, min100px | Match basic menu geometry, not every nested action state |
| TPO create long-company bounds | Old profile overlay `components___dropdown.scss:107-128`: viewport minus24px cap, max767 phone | `tpo-quick-create.tsx:28-40`: minwidth min(240px,100vw-80px), wrap long company words; shared popup max width viewport-24px | No horizontal overflow by source arithmetic at 280/375px; old label content not supplied |
| TPO create menu navigation | Old `components___dropdown.scss` has no single React routing contract | `tpo-quick-create.tsx:28-41`: shared Dropdown, native nav/link targets, divider, inline follow-up modal preserved | Source functionality, runtime open/close not exercised |

### Static responsive proof for these specific files (not browser-rendered)

| Width | Command search | TPO quick-create |
| --- | --- | --- |
| 280px phone | search icon 36px; expanded search spans mobile header minus20px, listbox max width viewport-24px | menu inner minwidth min(240px,280-80)=**200px**; with 48px horizontal popup padding + border remains at most250px under viewport-24=256px |
| 375px phone | icon36px until767; full-width expanded input, Search results within viewport | inner minwidth **240px**, plus 48px padding/2px border gives290px below viewport-24=351px; long unbroken company names wrap |
| 640px and 767px | mobile collapsed mode remains (max767) | mobile +New icon38px visual, shared trigger min44px; anchored menu is **not** an old-LMS-proven sheet |
| 768px and 1024px | desktop input 291px by default, bound widths at tablet; dropdown width up to390px | +New text button82x36px; anchored shared 6px dropdown, 240px inner minwidth |
| Keyboard/error | Ctrl/Meta+K opens; Escape from own root closes; editable/listbox composition and Backspace safeguarded; loading/error/empty statuses present | native summary activation / Arrow entry, link keyboard focus and modal follow-up; no disabled links invented |

### Indexed candidate inventory

GitHub **default-branch index search**, not checkout grep: `<PopoverListbox` yielded **5** `src/` files (TPO find, learner topbar, shared SearchableSelect, learner skill catalogue, global command search); `<Dropdown` yielded **12** source paths (shared split, TPO create, placement table/actions and other clients); `fixed inset-0` yielded the single noninteractive company-share watermark; `role="dialog"` yielded **6** source paths including shared Popover and CSS/observer literals. This does **not** prove branch-wide zero hand-rolled overlays.

File-level source-completed:
- [x] `src/components/shell/topbar/command-search.tsx`: own-root Escape; no nested editable/IME interception; JSX `PopoverListbox` pair.
- [x] `src/components/shell/topbar/tpo-quick-create.tsx`: responsive width bounds and long company labels; `Dropdown` opening/closing and existing nav/follow-up subtree preserved.
- [x] Read-only `src/components/shell/topbar/tpo-find-suggestions.tsx`: keyboard-focusable 44px option buttons, async loading/error/empty, no local overlay.
- [x] Read-only `src/components/shell/topbar/topbar.module.css`: numerical difference rows preserved for shell owner rather than overriding elsewhere.

**F1 [ ], F2 [ ] still not eligible for ticking.** Legacy search popup offsets/heights/shadow, compact bell desktop hit target, profile visual avatar diameter, full context icon/divider variants and actual device/code-grep proof remain unmatched or unverified.

**Next file:** `src/components/ui/searchable-select.tsx` and `src/components/profile/learner-skill-catalog-input.tsx` — check keyboard selected/disabled states under the shared listbox and find any further missing F2 consumer variants.


## Chat-16 skill-search overlay and shared combobox — 2026-10-20

| Searchable listbox property/state | Legacy old LMS `docs/design/legacy-styles/components___form.scss` | vNext source at this lane HEAD | Result |
| --- | --- | --- | --- |
| Anchoring | `63-70`: absolute, top calc(100%+5px), left0, width100% | `src/components/profile/learner-skill-catalog-input.tsx:44,72-73`; `src/components/ui/searchable-select.tsx:137,151-153`: same relative parent / absolute listbox geometry | Numeric/source match |
| Panel vertical bounds | `70-72`: min120px, max200px | Both listboxes `min-h-[120px] max-h-[200px]`; `src/components/ui/legacy-overlays.css:419-422` | Match |
| Popup shadow and white background | `73-76`: `#fff`, `0 14px 16px rgba(0,0,0,.04)`, radius12px | Shared PopoverListbox white/radius12; both inside `[data-slot=searchable-select]` so scoped CSS `legacy-overlays.css:419-429` applies exact shadow | Match sourced values |
| Popup top padding and scrollbar | `75-79`: top5px, Firefox hidden, WebKit hidden | Both panels `pt-[5px]`; CSS scoped `scrollbar-width:none` and `::-webkit-scrollbar display:none` | Match |
| Option padding/minheight | `82-87`: 5px vertical, 10px horizontal, min44px | Skill `learner-skill-catalog-input.tsx:75-77`: li/button min44 and 5/10; shared `searchable-select.tsx:156-161`: same | Match |
| Option hover/motion | `82,88-91`: `#d1f1f1`, background transition 200ms ease-in-out | Skill button `learner-skill-catalog-input.tsx:76`: important 200ms ease-in-out and hover `#d1f1f1`; shared options inherited 200ms scoped selector with same hover | Match declared properties (needs computed-style cascade proof) |
| Suggestion list empty/disabled | No disabled/empty form option styles beyond `__No-results` 10px padding in `94-105` | Shared select offers `No results`, disabled nonfocusable options; skill list loading/empty/unavailable text kept outside popup | Functionality inventoried; old complete state styling **unproved** |
| Skill listbox Escape/focus | Legacy SCSS no keyboard algorithm | `learner-skill-catalog-input.tsx:35-63`: pointer/focus outside closes; Escape only when open stops propagation so native parent dialog stays; active option IDs only while valid; popup can reopen on input focus | Source regression covered, actual interaction untested |
| Shared select Escape/focus | Legacy SCSS no nested modal Escape procedure | `searchable-select.tsx:108-118`: Escape consumes only own visible popup; when closed, allows parent modal Escape; keeps standard Arrow/Enter/Tab validity | Source regression covered, runtime untested |
| Input and list roles | Legacy Ant input behavior defined by widget, not SCSS | Both `role=combobox`, `aria-haspopup=listbox`, `aria-expanded`, controlled `aria-controls` and valid `aria-activedescendant`; shared `PopoverListbox role=listbox` | Valid source semantics; browser/a11y tree not inspected |
| Z-index | `components___form.scss:69`: 9 | both `var(--lms-z-dropdown)` = 100 `src/app/globals.css:837` | **Known mismatch** retained to preserve shared layering |

**Responsive source comparison:** 280px/375px phone, 640px and 767px: both suggestion popups cover 100% of their respective form fields, maintain 120–200px panel vertical bounds, 44px item targets, overflow scrolling and pointer/blur dismissal. At 768px/1024px, listbox items remain 44px even when host inputs use 36px; popup width is still 100% of parent. This is **static source proof**, not screenshots, computed styles, real device scrolling or rendered overflow measurement.

**Coverage:** GitHub default-branch index found **5** `src/` `<PopoverListbox` consumers (topbar command search, learner topbar course search, shared SearchableSelect, learner skill catalogue, TPO find shortcut). The previous five are reviewed in this audit, but the index is not exhaustive and cannot substantiate local checkout `git grep`. Required:
```sh
git grep -nE '<PopoverListbox|<dialog([[:space:]>])|role="dialog"|fixed inset-0' -- 'src/**/*.tsx'
```

- [x] `src/components/profile/learner-skill-catalog-input.tsx` source complete: old popup geometry, hover/motion, pointer/focus/Escape visibility, ARIA reference guards; balanced listbox, ul, li and button JSX.
- [x] `src/components/ui/searchable-select.tsx` source complete: consume Escape only when own popup open; other keyboard/option/validity behavior retained; balanced listbox JSX.
- [x] Checked existing scope `src/components/ui/legacy-overlays.css:419-433`: source selectors now apply to both searchable-select roots and do not apply to unrelated notification menus.

**F1 [ ], F2 [ ] still not tickable:** a real checkout grep, computed CSS and keyboard/touch viewport behavior remain unrun. Header compact actions, nonmodal popup closing animation, and old toast timing still have unresolved parity rows.

**Next source file:** `src/components/tpo/tpo-find-shortcut.tsx` to reconcile nested search results' listbox Escape with its parent native Dialog; then F2 checkpoint and remaining context menu consumer inventory.


## Chat-16 remaining TPO action-menu consumers — 2026-10-20

Per-file **F2 source** passes for action menus. Evidence uses old-LMS SCSS values where that variant is actually defined; broad menu similarity is not a substitute for state-by-state equality.

| Element / state | Legacy value and source | New UI source and value | Result |
| --- | --- | --- | --- |
| Generic head menu skin | `docs/design/legacy-styles/components___dropdown.scss:96-105`: white, radius **6px**, shadow `9px 11px 28px rgba(0,0,0,.1)`, minwidth **100px**, padding **16px 24px** | Shared `src/components/ui/dropdown.tsx:125-147`, `legacy-overlays.css:159-173`: white, 6px, same shadow and min100, `px-6 py-4` desktop generic | Match specified values; alternate sheet padding differs on purpose |
| Related hover and pressed | `components___notification-drawer.scss:18-19,41-49`: `rgba(0,0,0,.035)`, `.06`, 200ms ease | New menu action rows in `src/components/tpo/tpo-topbar-new-menu.tsx:13-26`, `recruiter-roster-display-controls.tsx:27-35`, `report-interactive-table.tsx:105-113`, `tpo-drive-workspace-nav.tsx:36-42`, `placement-drive-workspace.tsx:303-315` | Same analogous notification action colors/motion; old generic *dropdown row* specific hover rule not found |
| Mobile minimum action height | Related `components___notification-drawer.scss:21-24`: **44px** and breakpoint **767px** | Alternative +New menu row, recruiter column labels, report chooser labels, drive More links all min44 even when desktop; source files listed above | Match 44px numeric, not exact every original menu variant |
| Narrow company action menu | `components___dropdown.scss:107-128`: viewport-24px maximum; mobile 12px sides, max767 | `tpo-topbar-new-menu.tsx:21-29`: inner minwidth `min(240px,100vw-80px)`, anywhere-wrap company suffix; shared popup caps viewport-24px | Fits by source arithmetic at 280/375px; not an identical mobile profile menu placement |
| Narrow column chooser | Same 24px viewport-safe maximum only for legacy profile | `recruiter-roster-display-controls.tsx:27-37`: `min(208px,100vw-80px)`; scroll max-height72=288px, no horizontal overflow by source width | Source geometry safe, no legacy roster-specific width proof |
| Disabled fixed Contact column | No legacy disabled table-column paint in referenced SCSS | `recruiter-roster-display-controls.tsx:29-35`: disabled checkbox, row opacity .5, not-allowed cursor and no hover affordance | Complete vNext disabled state, old visual parity unproved |
| Last-visible report column | No old report chooser disabled-state rule in listed SCSS | `report-interactive-table.tsx:95-114`: checkbox disabled when last visible column; 44px label, opacity .5 and no hover while locked | Functional guard unchanged and disabled visuals source-reviewed |
| Report sheet scroll/closing | Old drawer mobile max767 and safe area `components___notification-drawer.scss:399-473` | `report-interactive-table.tsx:78-115`: two shared `Dropdown mobileSheet` consumers; shared styles `legacy-overlays.css:129-163` give 767 breakpoint, max70dvh, bottom safe area; explicit Close buttons focus summaries | Mobile behavior is source-specified; no actual device scroll check |
| Drive section mobile handoff | Old LMS mobile overlay/tabs styles commonly max767 in `components___antddesign.scss:305-309,1035-1041` | `tpo-drive-workspace-nav.tsx:21-29`: mobile Select through767, desktop Tabs + More from768 | Breakpoint match to cited mobile components, not proof of exact tab style |
| Drive sections submenu | Old menu above: radius6, shadow, white; related 44px touch min | `tpo-drive-workspace-nav.tsx:34-44`: shared Dropdown, each More link 44px, .035/.06 hover/pressed, 200ms | Source state coverage; content and route href unchanged |
| Placement nested More menu | Old menu width max viewport-24px `components___dropdown.scss:107-113`; notification rows min44 `components___notification-drawer.scss:21` | `placement-drive-workspace.tsx:269-317`: parent `inlineDesktop mobileSheet`, nested More anchored menu bounded `min(224px,100vw-80px)`; links 44px with .035/.06 states | Source responsive/keyboard structure reviewed, no browser proof |
| TPO find Escape inside listbox | Old SCSS has no native-dialog keyboard algorithm | `tpo-find-shortcut.tsx:74-104`: input labelled combobox and valid active descendant; Escape from inner listbox now closes **own parent Dialog** (not just moving focus to input); native Dialog restores opener | Source behavior corrected, no actual keyboard run |
| Empty/loading/no-results | No canonical universal old menu states in supplied SCSS | Report: no-filter/locked; roster: disabled Contact; TPO find: searching/error/no-result role=status or alert; placement: status-controlled conditional links | Consumer states inventoried; old visual equivalence unproven |

### Static responsive matrix (source comparisons, not screenshots)

| Width/state | +New / roster menu | Report sheet | Drive sections / nested More |
| --- | --- | --- | --- |
| 280px | min menu inner **200px** + generic 48px padding/2px border = **250px** under viewport-24px cap **256px**; links wrap | fixed bottom sheet width viewport, max70dvh, close 44px, scroll contained | mobile Select, More actions in parent mobile sheet; nested menu min200+50=250px if displayed |
| 375px | +New 240px and roster208px inner; all fit viewport-24px **351px** outer cap | width375px mobile sheet, bottom safe-area pad; report check rows44px | mobile Select and 44px primary actions |
| 640px and 767px | menu trigger 44px, column rows44, scroll min and max as above | still mobile sheet to767; no premature 640px desktop pivot | mobile Select to767; shared parent drive-action sheet |
| 768px | +New desktop anchored dropdown, 44px row min; roster normal anchored menu | desktop positioned popup; column options remain44px | desktop Tabs + More, parent drive actions inline, nested More still anchored |
| 1024px | same desktop anchored menus and status displays | desktop filtering/column popup actions | desktop drive Links/More with source-appended disabled/hover states |
| Keyboard/disabled | native Dropdown summary/Arrow/Home/End/Escape; Contact checkbox disabled | focusable Close+results, last-column disabled and visibly muted | native Dropdown nested Escape guards, role-based links and existing status-controlled actions |

**Indexed coverage (not git grep):** GitHub default-branch `<Dropdown` query surfaced **12** `src/` candidate files including all three relevant controls; earlier `<PopoverListbox` query surfaced **5** `src/` consumers including TPO find. Existing review of `src/components/tpo/tpo-spreadsheet-grid.tsx`, `recruiter-leads-workspace.tsx`, and `report-interactive-table.tsx` confirmed usage of shared `mobileSheet`. Exact raw modal grep and dynamic-class coverage remain unexecuted.

- [x] `src/components/tpo/tpo-find-shortcut.tsx` — nested listbox ARIA and one-Escape parent Dialog close, paired JSX.
- [x] `src/components/tpo/tpo-topbar-new-menu.tsx` — analogous old item hover states, 44px targets, bounded long-company width, shared Dropdown JSX.
- [x] `src/components/tpo/recruiter-roster-display-controls.tsx` — touch-safe columns, disabled Contact row, bounded menu width.
- [x] `src/components/placements/tpo-drive-workspace-nav.tsx` — 767px handoff and 44px dropdown item rows.
- [x] `src/components/placements/report-interactive-table.tsx` — row touch targets/locked state under both shared mobile sheets; no table contents changed.
- [x] `src/components/placements/placement-drive-workspace.tsx` — nested More-action menu viewport bounds and row states only; other workstreams unchanged.
- [x] Reviewed shared Dropdown consumers without changes: `src/components/tpo/tpo-spreadsheet-grid.tsx`, `src/components/tpo/recruiter-leads-workspace.tsx` (both `mobileSheet`), and `src/components/tpo/tpo-company-memory-workspace.tsx`.

**F1 [ ], F2 [ ] still strictly open.** Missing: runtime screenshot/keyboard/resize proof at 280/375/640/767/768/1024, source-specific exact menu row variants for all consumers, complete local `git grep`, toast legacy lifetime and popup exit-motion equivalence. These file-level checks mean source edits, not category-level pixel parity.

**Next source file:** `src/components/tpo/tpo-company-memory-workspace.tsx` (+ New menu responsive/actions) then `src/components/placements/placement-drive-workspace.tsx` remaining secondary menu contexts if source checklist continues.


### Final company-memory action popup follow-up

| Property/state | Old LMS source | `src/components/tpo/tpo-company-memory-workspace.tsx:208-219` | Source result |
| --- | --- | --- | --- |
| Popup maximum safe viewport width | `docs/design/legacy-styles/components___dropdown.scss:107-128`: profile overlays limited to viewport-24px | Shared Dropdown max viewport-24px; inner menu `min(240px,100vw-80px)` so 280px phone gets inner200 + 48px popup horizontal padding + 2px border = **250px**, under256px cap | Comparable geometry match; this is a company menu not a profile popup |
| Menu action touch target | `components___notification-drawer.scss:21`: 44px | All three `+ New` action links min44px | Analogous touch minimum match |
| Related hover/active/motion | `components___notification-drawer.scss:18-19,41-49`: `rgba(0,0,0,.035)`, `.06`, 200ms ease | All three links use corresponding neutral hover/active, 200ms; links wrap long unbroken company names | Comparable numeric match; not canonical company menu style |
| Divider and navigation | Old `components___dropdown.scss:96-128` has no generic divider dimensions or new-work hrefs | Shared `MenuSeparator` and native Link navigation still present; no content changes | State preserved; exact divider parity unproved |

**Responsive source branch:** At 280/375/640/767px the company menu content is bounded by `min(240px,100vw-80px)` and shared 12px viewport side clearance, not a full mobile sheet; at 768/1024px the content floor is 240px inside a 6px-radius anchored popup. Every route action remains 44px and keyboard-focusable. These are static source calculations, **not** viewport screenshots or actual overflow validation.

- [x] `src/components/tpo/tpo-company-memory-workspace.tsx` F2 source pass: viewport-safe action popup, three neutral hover/press rows, preserved three Link targets and shared Dropdown markup.
- [ ] F1/F2 category completion still blocked on local checkout grep, real focus/scroll/animation test, complete exact legacy source variants and computed style cascade.

**Exact next file:** `src/components/tpo/recruiter-leads-workspace.tsx` — mobile stage/action dropdown's nested controls and dismissal semantics, then remaining indexed DropDown consumers.


### Cross-lane main reconciliation checkpoint

While preparing the current main integration, reviewed actual branch-vs-main source diffs instead of blindly copying lane blobs. Preserved a newer main-only `FilterChip` import/usage and `sortDirection` metadata in `src/components/placements/report-interactive-table.tsx` while reapplying only the 44px disabled column-chooser rows. Preserved a newer main-only `Mark all read` button size class in `src/components/hr/hr-recruiter-bell.tsx` while reapplying dismissal and hover states. Confirmed other lane paths' main-only changed lines were the superseded styling/handling under this lane, not newly introduced content. **No TypeScript/build/runtime commands were executed.** F1/F2 remain [ ] for the outstanding checkout grep and responsive browser checks.


## Chat-16 responsive recruiter and spreadsheet action sheets — 2026-10-20

### Value-by-value table (this turn; F2 source stage, not visual approval)

| Surface/property/state | Old LMS value/source | vNext value/source | Comparison |
| --- | --- | --- | --- |
| Mobile menu breakpoint | `docs/design/legacy-styles/components___notification-drawer.scss:23-24`: max **767px** for mobile drawer | `src/components/ui/dropdown.tsx:31-41,125-127`, `legacy-overlays.css:127-161`: `mobileSheet` fixed-bottom through **767px**, anchored menu ≥768 | Breakpoint matches related old overlay |
| Mobile full-width drawer/sheet | `components___notification-drawer.scss:399-405`: panel width **100%** and negative horizontal shadow | `legacy-overlays.css:139-145`: fixed mobile sheet width **100%**, radius top12px; uses generic dropdown shadow instead of old drawer shadow | Full-width match; **shadow not exact drawer variant** |
| Backdrop overlay | `components___antddesign.scss:143-145`: `rgba(30,54,63,.1)` | `legacy-overlays.css:131-137`: same on mobileSheet pseudo-scrim | Numeric match |
| Backdrop and scroll limit | Related old notification scroll body `components___notification-drawer.scss:428-473`: flex scroll with safe bottom inset; height of the entire panel | `dropdown.tsx:125-127`: `max-height:70dvh` / safe-bottom; mobile row-action sheets scroll | Source safety present; **70dvh legacy equivalence not found** |
| Mobile close hit area | `components___notification-drawer.scss:21-22,421-431`: minimum **44×44px** | `src/components/tpo/recruiter-leads-workspace.tsx:1102-1109`, `tpo-spreadsheet-grid.tsx:219-232`: explicit Close actions `min-h-11` and summary focus on close | 44px numeric match; close wording is vNext |
| Action trigger hover | `components___notification-drawer.scss:18-19,41-49`: `rgba(0,0,0,.035)`, active `.06`, **200ms ease** | `src/components/tpo/recruiter-inline-stage.tsx:30-36`, `recruiter-inline-owner.tsx:46-51`: `min-h-11`, neutral hover/active, 200ms ease; busy/async state disabled | Numeric match with related old trigger; no recruiter-specific old row stylesheet located |
| Editable stage/owner touch target | Old notification minimum **44px**, `notification-drawer.scss:21-22` | Stage and Owner editor buttons `min-h-11`, expanded select and action buttons retain pre-existing min44 at phone widths | Mobile numeric match, desktop selectors remain unchanged |
| Action sheet nesting | Old mobile notification drawer uses labeled content and separate body/footer `notification-drawer.scss:145-173,317-340` | Recruiter card `role=group` named per lead, sheet content scrolls, Close actions focus summary; spreadsheet named per row | Group labels and close behaviour verified statically, **no exact container composition parity** |
| Disabled/busy | Old SCSS has no recruiter stage/owner POST pending color contract | Stage button disabled while `busy`; Owner button disabled while `loading`; existing error role=alert and loading role=status preserved | Functional state reviewed, exact visual parity open |
| Focus ring | `notification-drawer.scss:201-205`: 1px accent, offset1 for notification item | Buttons use shared `Button` focus-visible styling; Close restores summary focus; actual ring thickness differs by variant | **Not exact old notification row focus value** |
| Expanded row label overflow | Legacy mobile `notification-drawer.scss:399-475`: 16px gutters, row content flex-min0, overflow scroll | New recruiter sheet group `min-w-0 break-words [overflow-wrap:anywhere]`; grid row actions same; long lead names not forced outside popup | Source containment, runtime unverified |

### Source-responsive matrix (not screenshots)

| Viewport | Recruiter lead action | Spreadsheet row action | Stage/owner editing |
| --- | --- | --- | --- |
| 280px/375px | `Dropdown mobileSheet` occupies full width, max70dvh; 44px Close; word wrapping and accessible lead-specific group label | Same bottom sheet, label names actual row, 44px Close and focus restored to summary | Buttons minimum44, expanded form controls min44 |
| 640px/767px | Still mobile fixed bottom (not prematurely anchored at640), safe-area bottom | Same; rows render in card view at `md:hidden` | Mobile touch sizes unchanged |
| 768px/1024px | Anchored popup, max72 (288px) by shared `md:` branch; trigger 44px for mobileSheet | Card rows disappear in favour of desktop table; no new duplicate row action button | Editor button remains44, expanded select/action controls desktop36 where explicitly set |
| Keyboard/focus | Native summary opens; Escape closes own menu; Close actions restores summary focus; nested search/Select retains input arrows | Same, row-specific accessible label | Busy loading prevents extra stage/owner toggle, status/error remain available |
| Empty/error | Not now requires reason; inline error role=alert, owner lookup failures kept | No row actions renders without supplied `rowActions`; no fake empty state | Original async errors untouched, source check only |

### Coverage check — bounded connector source, **not checkout-wide git grep**

Direct GitHub branch fetch inspected all of `src/components/tpo/recruiter-leads-workspace.tsx` (1212 lines before/after action edits), `recruiter-inline-stage.tsx`, `recruiter-inline-owner.tsx` and `tpo-spreadsheet-grid.tsx`; verified the shared Dropdown imports and paired opening/closing tags. Earlier GitHub indexed `<Dropdown` query enumerated 12 default-branch candidates, including recruiter and spreadsheet screens. This is **not** an exhaustive live checkout search, so `git grep -nE 'fixed inset-0|role="dialog"|<dialog([[:space:]>])' -- src` and broad overlay search remain required.

- [x] `src/components/tpo/recruiter-leads-workspace.tsx` — separate stage/owner actions have a named group, wrapped text, and explicit close with focus restore; action content/route unchanged.
- [x] `src/components/tpo/recruiter-inline-stage.tsx` — 44px edit trigger, disabled busy, hover/pressed transition; named expanded editor.
- [x] `src/components/tpo/recruiter-inline-owner.tsx` — 44px edit trigger, disabled loading, hover/pressed transition; named expanded editor.
- [x] `src/components/tpo/tpo-spreadsheet-grid.tsx` — mobile row action sheet now labeled by row and explicitly closes with focus restore; desktop table is unchanged.

**F1 [ ], F2 [ ] remain unticked** under STRICT TICK RULE. Numeric source evidence does not replace actual responsive interaction/scroll snapshots; old sheet exit/timing and full page consumer inventory still unresolved.

**Next file:** `src/components/placements/placement-drive-workspace.tsx` — remaining nested More dropdown behaviour on desktop/mobile (then verify other indexed consumers).
