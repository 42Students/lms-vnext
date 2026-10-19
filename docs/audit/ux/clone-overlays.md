# Checkpoint F1 / F2 — old LMS overlay parity audit

Owner: chat-16. Date: 2026-10-19. Reference: `docs/design/ui-clone-checklist.md`, **STRICT TICK RULE**. This is a **source-level** comparison, not a screenshot or CI approval. Source refs below are repository-relative `path:line`. “Match” denotes the stated property/state only, not whole-item parity.

## Strict results

- [ ] **F1 — Modals, dialogs, drawers, popconfirm** (missing: full visual and exit-state proof; 2 live responsive hand-rolled modal/drawer implementations remain, mobile navigation and FilterBar; all responsive/hover/focus/closing variants have not been verified)
- [ ] **F2 — Toasts, tooltips, popovers, dropdown/context menus** (missing: legacy toast-specific state and duration source, tooltip arrow placement, context-menu complete icon/divider inventory, zero nonmodal popup coverage proof, and closing-animation parity)

No item is ticked: both value and coverage proof are incomplete even though many individual values match.

## F1: property-by-property source evidence

| Property and state | Old LMS exact value and source | vNext effective value and source | Result |
| --- | --- | --- | --- |
| Drawer scrim default | `rgba(30,54,63,.1)`; `docs/design/legacy-styles/components___antddesign.scss:143-145` | `rgba(30,54,63,.1)`; `src/components/ui/legacy-overlays.css:12-15` | Match, drawer type |
| Desktop/right notification drawer shadow | `-4px 0 24px rgba(0,0,0,.12)`; `components___notification-drawer.scss:402-405` | `-4px 0 24px rgba(0,0,0,.12)`; `src/components/ui/drawer.tsx:40` | Match, right drawer |
| Generic side-drawer mobile/nav width | `82%` with `max-width:300px`; `components___antddesign.scss:305-310, 414-417` | Generic Drawer `width:100%` on mobile, `600px` max desktop; `src/components/ui/drawer.tsx:40`. Specialized mobile nav retains separate panel | **Mismatch / variant not cloned** |
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
| Close glyph | Old Ant close icon `16px`; `components___common.scss:1068-1075` | SVG canvas `18px`; `src/components/ui/overlay-close-icon.tsx:3-8` | **Mismatch (18 versus 16)** |
| Drawer close mobile touch target | `44px`; `components___antddesign.scss:335-346` | `min-h-11 min-w-11`; `src/components/ui/drawer.tsx:45` | Match |
| Drawer mobile body scroll | `scrollbar-width:none`, WebKit scrollbar hidden; `components___antddesign.scss:349-360` | `ScrollCue` plus scrollbar suppression; `src/components/ui/drawer.tsx:47`, `src/app/globals.css` overlay scrollbar rules | Partially proved |
| Modal opening animation | Various Ant modal variants / pageSlideIn 180ms; `components___antddesign.scss:1-15, 960-1065` | `lms-legacy-dialog-enter 180ms ease-out`; `src/components/ui/legacy-overlays.css:150-165` | **Not proved as same keyframes** |
| Modal exit/close animation | Native Ant close motion not exhaustively represented in bundled SCSS | Native `dialog.close()` immediately; `src/components/ui/dialog.tsx:35-43` | **Missing closing animation equivalence** |
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
| Tooltip arrow alignment | Legacy arrow right `-2px`; `components___antddesign.scss:60-64` | Left-aligned arrow (`left-4`); `src/components/ui/tooltip.tsx:54` | **Mismatch / placement-dependent behavior not proved** |
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
| `git grep -nl 'fixed inset-0' -- src` | exact phrase `"fixed inset-0"`: **3 files** | `src/components/ui/filter-bar.tsx` (hand-built mobile filter overlay); `src/components/shell/mobile-navigation.tsx` (hand-built left navigation drawer); `src/app/company-share/[token]/page.tsx` (noninteractive confidentiality watermark, **not** an overlay) |
| `git grep -nl 'role="dialog"' -- src` | exact phrase `role="dialog"`: **9 files** | Includes CSS selector/observer literals; nonmodal account menu, HR, recruiter, learner popovers and mobile navigation |
| `git grep -nl 'role="alertdialog"' -- src` | exact phrase `role="alertdialog"`: **3 files** | TPO callers passing `role="alertdialog"` to the **shared Dialog**, not nested custom alertdialog markup |
| `git grep -nl '<dialog' -- src` | case-insensitive GitHub search for `<dialog`: **105 files** | This search includes capitalized JSX `<Dialog>`; **not** a native-`<dialog>` count; local case-sensitive grep still required |
| `git grep -nl 'bg-black/50' -- src` | exact phrase: **1 file** | `src/components/admin/super-admin-student-import-history.tsx`; inspect context before treating as hand-rolled backdrop |

**Limits:** the commands shown here were **not** executed locally; GitHub code search is not a guaranteed complete checkout grep, and its default-branch index can lag. The orchestrator must run the commands in a fresh checkout. Thus the STRICT TICK RULE's *zero hand-rolled overlays* condition is **not met**, regardless of the number of shared Dialog imports.

## Coverage and no-regression notes

The TPO reminder preview, announcement delete, calendar move/create, offer withdrawal, team ask/message confirmations, verification review and mentor/learner task details were migrated to shared dialogs/drawers in preceding chat-16 batches. Existing nonmodal notification popovers were deliberately not changed to `showModal()`, to avoid trapping the rest of the page. Responsive filter and left-navigation overlays still need a dedicated same-subtree / left-side shared Drawer adaptation; blindly converting either would change navigation and form behavior.

Source-only JSX opening/closing checks across **12 modified TSX files** in this branch comparison reported **zero counted tag mismatches**. This is not a compiler check. No CI, tests, typecheck, lint, application run or browser comparison was performed. Source evidence alone does **not** close F1 or F2.
