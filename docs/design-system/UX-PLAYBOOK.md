# LMS UX Playbook — v1.0 (lane chat-17)

> **Single source of truth for authenticated and public LMS UI, including native-app WebViews.** Adopt after three audits. This does not change legacy wording, route structure, roles, permissions, or the palette. Source: `src/app/globals.css`, `docs/design-system/lms-color-parity.md`, `docs/parity/*`, and `docs/orchestrator/ui-ux/pages-*.md`. A component's legacy label always wins over example copy here.

## 1. Principles (do / do not)

1. **Preserve identity.** Do use `bg-primary` and `bg-surface` backed by `--lms-*`; don't introduce sky/indigo buttons.
2. **Preserve words and IA.** Do render the route's legacy `PageHeader.title` and tab order; don't rename “Placement Operations”, “Recruiter Leads” or action labels for polish.
3. **Phone first.** Do design at 320px with `min-w-0`, `grid-cols-1`, then `sm:`; don't ship a desktop table wider than the viewport without a card alternative.
4. **One primary action.** Do use one `Button variant="primary"` per page header or footer; don't create five visually equal CTAs.
5. **Reliable work.** Do keep form values on failed requests and block duplicate submissions; don't clear inputs on an error.
6. **Truthful state.** Do show a `Skeleton` and bounded slow-load state; don't show a permanent spinner or “no records” while loading.
7. **Accessibility by construction.** Do use `label/htmlFor`, `aria-describedby` and focus-visible rings; don't rely on colour or placeholder alone.
8. **Explicit authority.** Do disable actions with a visible reason or show read-only content; don't hide important status or attempt client-only permission enforcement.
9. **Predictable navigation.** Do use same-tab links and route-safe back links; don't rely on hover, `window.open` or `window.history.back()` as the only escape.
10. **Fast enough for real networks.** Do load the highest-priority content first and paginate lists over 100 records; don't serialize unrelated requests or block the whole page for optional metrics.

## 2. Design tokens and implementation contract

### Colours — canonical LMS palette, never arbitrary Tailwind brand colours

| Semantic role | CSS source / exact legacy value | Tailwind use and contrast-safe rule |
|---|---|---|
| Brand fill | `--lms-primary: #26bac7` | `bg-primary text-foreground` (7.19:1); **not** white text (2.35:1) |
| Brand pressed | `--lms-primary-hover: #1e9aa8` | `hover:bg-primary-hover hover:text-foreground` |
| Brand text decorative | `--lms-primary-text: #1a95a1` | `text-primary-text` only for 18px bold+ or decorative icons; on white 3.59:1, fails normal text |
| Accessible brand link | `--lms-teal-deep: #0e7c87` | `text-[var(--lms-teal-deep)] underline` on white (4.94:1) |
| Subtle tint | `--lms-primary-subtle: #eff8fa` | `bg-primary-subtle text-foreground` |
| Dark branded panel | `--lms-brand-dark: #1e363f` | `bg-[var(--lms-brand-dark)] text-white` |
| Page / surface | `--lms-neutral-100: #f1f4f9`, `--lms-white: #ffffff` | `bg-background`, `bg-surface` |
| Raised secondary | `--lms-neutral-50: #fafbfc` | `bg-secondary` |
| Heading | `--lms-neutral-900: #1a1d21` | `text-foreground` |
| Body | `--lms-neutral-700: #54505d` | `text-body` (7.83:1 on white) |
| Supporting | `--lms-neutral-500: #6b7280` | `text-muted-foreground` (4.83:1 on white) |
| Disabled/placeholder | `--lms-neutral-400: #a9a7ae` | only disabled/placeholders, never instructional text |
| Separator | `--lms-neutral-200: #e5e9f0` | `border-border` (not a 3:1 control indicator); add dark outline/focus for interactive edges |
| Success | `--lms-success: #059669` | `bg-[var(--lms-success-subtle)] text-foreground`; small text must not use green alone (3.77:1) |
| Warning | `--lms-warning: #d97706` | `bg-[var(--lms-warning-subtle)] text-foreground`; orange alone 3.19:1 |
| Error | `--lms-error: #ef4444` | `bg-[var(--lms-error-subtle)] text-foreground`; red alone 3.76:1 |
| Info | `--lms-info: #26bac7` | `bg-[var(--lms-info-subtle)] text-foreground` |
| Focus | `--lms-focus-ring: rgba(38,186,199,.2)` | this glow is **supplemental**; use `outline-2 outline-offset-2 outline-[var(--lms-teal-deep)]` for 3:1 focus |
| Sidebar | `--lms-sidebar-border: #f1f4f9`, `--lms-sidebar-active: rgba(38,186,199,.15)` | white surface, active tinted row + left 3px `--lms-primary` and aria-current |
| Elevated scope only | `--lms-ink-900: #0b1220`, `--lms-gold-accent: #a16207` | only module sections already using scoped premium treatments |

**Audit ratios** above use WCAG relative luminance, not perceptual guesses. Non-text controls require 3:1 *against neighbouring backgrounds*: `border-border` on white is only 1.22:1, so interactive controls need labels, distinct fill, and a `focus-visible:outline-2` with `--lms-teal-deep` (4.94:1). Keep the legacy border on passive cards. Do not silently darken existing tokens; where semantic status words require readable foreground use `text-foreground` and icon + explicit status text.

### Type / geometry

| Element | Phone exact classes | Desktop adjustment |
|---|---|---|
| Page title (h1) | `text-2xl leading-8 font-semibold tracking-tight` (24/32) | `sm:text-3xl sm:leading-9` (30/36) |
| Section title (h2) | `text-lg leading-7 font-semibold` (18/28) | same |
| Subsection (h3) | `text-base leading-6 font-semibold` (16/24) | same |
| Body / input | `text-base leading-6 font-normal` (16/24) | `sm:text-sm sm:leading-6` (14/24) for dense non-input body only |
| Table cells | `text-sm leading-5` (14/20) | same |
| Captions, badges | `text-xs leading-5` (12/20) only with high-contrast text | same |
| KPI value / numbers | `text-2xl leading-8 font-semibold tabular-nums` | `lg:text-3xl lg:leading-9` |
| Spacing | `gap-1/2/3/4/5/6/8` = 4/8/12/16/20/24/32px | no bespoke gaps |
| Radii | `rounded-md` 6px controls, `rounded-lg` 8px small tiles, `rounded-xl` 12px cards/sheets, `rounded-full` avatars/badges | same |
| Elevation | `shadow-none` default; `shadow-sm` lifted card; `shadow-lg` sheet/dialog; `shadow-xl` critical overlay only | same |
| Border | `border border-border` 1px; active adds 2px outline | same |
| Layers | 0 page; 10 sticky header; 20 sticky action; 30 drawer backdrop; 40 dialog; 50 toast | `z-10/20/30/40/50` |
| Motion | 120ms hover, 180ms sheet/focus, 240ms page-enter; `ease-out` entrance, `ease-in-out` state | `motion-safe:transition-colors motion-safe:duration-[120ms] motion-reduce:transition-none` |

Use `prefers-reduced-motion` via `motion-reduce:animate-none motion-reduce:transition-none`. No motion conveys essential information. **Breakpoints:** baseline 320/360/390px; `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`; phone = under 640, tablet 640–1023, desktop ≥1024. Never define a new media breakpoint without an audit note.

## 3. Layout patterns

**Shell desktop:** existing sidebar remains white/teal with existing label/order; fixed-width ~256px as currently implemented; the top bar holds app context and user actions. Page is `min-w-0 flex-1 overflow-x-clip`; content `mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8`. Never nest `<main>` when the shell already provides it.

**Shell phone / native app:** preserve current navigation destinations, show one menu trigger with accessible name, no hover-only flyouts, scrollable list with 44px rows. Header and safe area use `pt-[env(safe-area-inset-top)]`, bottom actions `pb-[max(1rem,env(safe-area-inset-bottom))]`; use `min-h-dvh` not `h-screen`. On 320/360/390px: one column, content gutters 16px, cards 16px padding, actions stack if total widths exceed available space; at 640px use 24px gutters, desktop 32px. Do not disable user zoom.

**Page header:** `<PageHeader eyebrow title description? actions?>` with exactly one h1; actions flow below title on phone, right at `sm:`; avoid invented descriptions. Section anatomy: `<section aria-labelledby=... className="space-y-4"> h2 + <Card>...`; card anatomy: `rounded-xl border border-border bg-surface p-4 sm:p-6` with title then body, then footer border on actions. Two columns: `grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]`. Details use stacked definition rows on phone, `sm:grid-cols-[10rem_1fr]` on tablet. Use sticky table headers only inside scroll region and sticky action footer as `sticky bottom-0 z-20 bg-surface/95`; never permanently obscure last row—pad content bottom by action height + safe inset.

## 4. Archetypes (wireframes + exact composition)

Each wireframe is ordered top → bottom at **320, 360 and 390px** (same one-column shape with 16px gutters, internal `min-w-0`); at tablet optional 2 columns, desktop patterns as shown. For *every* archetype, loading = same-shape `Skeleton` with `role=status`; empty = `EmptyState` with a legal next action; error = `ErrorState` with retry; partial = `InlineNotice` plus successful content; denied = read-only or `ErrorState` without retry; stale = visible banner + refresh and preserve inputs. Never treat loading as empty.

| Archetype | 320/360/390 phone ASCII | ≥1024 desktop | Exact composition |
|---|---|---|---|
| Dashboard | `[Header]\n[Stat][Stat stacked]\n[Needs action]\n[Recent]` | 2–4 KPI columns + needs/recent two-column | `PageHeader > grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 > StatTile* > Card* > Pagination?` |
| Directory | `[Header]\n[Search][Filters]\n[Card row]*\n[Pages]` | filter row + DataTable | `PageHeader > FilterBar > DataTable(columns.mobileLabel, mobilePriority) > Pagination` |
| Detail + tabs | `[Back][Title]\n[Tabs scroll]\n[Summary]\n[Action]` | summary left + secondary right | `Breadcrumbs > PageHeader > Tabs > Card/StatusBadge > related Card` |
| Form / editor | `[Back][Title]\n[Field]*\n[Sticky Save]` | form max-w-3xl + secondary preview | `PageHeader > form > Card > label/Input/Select/Textarea > sticky Button` |
| Wizard | `[Step x/y]\n[Fields]\n[Back][Next]` | centered max-w-3xl | `PageHeader > Card(step title, fields, progress text) > Button back/next`; persist draft |
| Calendar | `[Period][Filters]\n[Agenda date cards]` | calendar grid with agenda switch | `PageHeader > FilterBar > Card (agenda) / accessible grid > Pagination` |
| Report | `[Period]\n[KPI]*\n[Chart summary]\n[Table cards]` | chart+table two-column | `PageHeader > FilterBar > StatTile* > Card(chart + text equivalent) > DataTable` |
| Settings | `[Title]\n[Setting group]\n[Save]` | max-w-3xl sections | `PageHeader > Card per group > Switch/Select > sticky Button` |
| Inbox/thread | `[Inbox]\n[Thread row]*` → `[Back][Thread][Composer]` | thread list + conversation | `PageHeader > DataTable/links > Card(messages) > Textarea > Button`; thread route on phone |
| Public/auth | `[Logo]\n[Title]\n[Inputs]\n[Submit]` | centered max-w-md | `main > Card > h1 > form > Input/Button > inline ErrorState`; preserve existing auth strings |
| Error/empty | `[Title]\n[Reason]\n[Retry/back]` | same centered max-w-2xl | `PageHeader? > ErrorState / EmptyState`, preserve shell and back route |

**Breakpoints and states per archetype** are not permission to invent records. At phone 320, every panel `w-full min-w-0`; 360 gains whitespace only, 390 may show two compact 44px icon actions if room; never switch to a multi-column content grid below `sm`. On dashboard and reports, skeleton KPI rectangles `h-28`; directory rows `h-24`; detail summary `h-40`; forms label `h-4` + field `h-11`; wizard `h-48`; calendar 5 agenda placeholders `h-20`; settings `h-24`; inbox list rows `h-16`; auth `h-11` fields. Skeletons always reserve their final approximate dimensions.

## 5. Shared-component catalogue and contract

This table is normative. Native inputs and Next.js links remain valid; prefer the named component. Shared **states** below always mean enabled idle, pointer hover (not sole affordance), `:focus-visible` (outline), pressed/selected, disabled, pending/loading, and invalid/error; for noninteractive components those states are **not applicable** and their surrounding actionable control supplies focus, active, disabled, pending and error feedback. `sm` interactive variants are **still ≥44px high**.

| Component → file | Anatomy, props, variants and sizes | All states, phone and accessibility |
|---|---|---|
| Button → `button.tsx` | `variant=primary/secondary/ghost/danger`, `size=sm/md`, native button props, optional `loading`; icon/label | Idle teal/neutral, hover 120ms, focus deep-teal 2px, active pressed, disabled opacity plus reason, loading aria-busy & disabled, form error external; 44px min, never icon-only without aria-label |
| Input → `input.tsx` | native `ComponentPropsWithRef<"input">`, optional `error`; label via parent | idle border; hover border; focus 2px deep-teal; active caret; disabled gray; loading parent; error aria-invalid + describedby; 16px phone text prevents iOS zoom |
| Select → `select.tsx` | native select props, children; sm/md implicit 44px | same as Input; native keyboard Arrow/Space/Enter; error via aria-invalid; never placeholder-only label; phone uses native picker |
| Textarea → `textarea.tsx` | native textarea props, optional error; min-height 112px | same; browser resize vertical, preserve typed content, input 16px |
| Checkbox / Radio / Switch → `selection-controls.tsx` | native checked/onChange/name/disabled, label; switch `role=switch` | thumb targets 44px, checked mark + text, Space toggles, focus outline, error text is external; never fake a form state |
| DatePicker usage → `input.tsx` | `<Input type="date" inputMode="none" />` native; external label and time zone hint | picker is OS native; use en-IN display summary separately; validation inline; never assume UTC date |
| Dialog → `dialog.tsx` | `open/onOpenChange/title/description?/children/footer?`; native `<dialog>` | focus trapped by showModal, Escape, close/backdrop, restore opener; phone full screen 100dvh with safe-area footer, desktop max-w-xl |
| Drawer / BottomSheet → `drawer.tsx`, `bottom-sheet.tsx` | `open/onOpenChange/title/description?/children/footer?`; panel | phone bottom/full-height, desktop right drawer; Escape/back, focus trap & restore, scroll inside, safe area, no hover |
| ConfirmDialog → `confirm-dialog.tsx`; `confirm-action-dialog.tsx` | title, consequence, confirm/cancel, pending | default focus cancel, pending no dismissal, destructive consequence, avoid browser `confirm()` |
| Toast → `toast.tsx` | `ToastProvider/useToast().showToast({title,description?,tone})` | role=status polite success/info, alert error, 44px dismiss, 4500ms or user-dismiss, safe-area, never only success feedback for a lost draft |
| Tabs → `tabs.tsx` | `items:{value,label,content?,disabled?,href?}[]`, `value`, `onValueChange?`, `ariaLabel`, `renderPanel?` | controlled `renderPanel=true` exposes selected underline + aria-selected, arrows/Home/End, focus 2px and disabled options; `renderPanel=false` uses same-tab `href` links + aria-current, not tabs or a no-op callback; overflow scroll on phone |
| DataTable → `data-table.tsx` | `columns:{key,header,cell,className?,mobileLabel?,mobilePriority?}`, `rows/getRowKey/empty?` | table desktop, card rows phone with primary=first priority + first 3 secondaries + `More details` for remaining fields; caption, th scope, no field silently lost |
| Card → `card.tsx` | semantic `as=div/section/article`, `title?`, `description?`, `footer?`, children | static surface no hover-only controls; state feedback through contents; 16/24px padding phone/desktop |
| Badge/StatusBadge → `status-badge.tsx` | tone neutral/info/success/warning/error; children/className | explicit text + tone; no color-only, foreground high contrast; no focus if static, embed real link for action |
| EmptyState → `empty-state.tsx` | title/description/action; optional decoration | meaningful reason and authorized action, never fabricated copy, single column |
| ErrorState → `error-state.tsx` | title/description/action | `role=alert`, friendly recoverable copy, keep entered form data, no raw codes |
| Skeleton/Loading → `skeleton.tsx`, `loading-state.tsx` | `variant=line/card/kpi/row/form`, count? label? | `role=status aria-live=polite`, shapes reserve space, `motion-reduce:animate-none`; >12s fallback |
| Pagination → `pagination.tsx` | page/pageCount/hrefForPage, label? | same-tab links, Prev/Next with disabled states, `aria-current=page`, 44px targets, announce page |
| FilterBar → `filter-bar.tsx` | title, children, activeCount, action? | desktop inline, phone `BottomSheet`, form values survive; reset only by explicit control |
| PageHeader → `page-header.tsx` | eyebrow/title/description/actions | one h1, wrap not overflow, phone actions below |
| Breadcrumbs → `breadcrumbs.tsx` | items:{label,href?}[] | `nav aria-label=Breadcrumb`, last `aria-current=page`, truncate visually not for SR |
| Tooltip/InfoPopover → `tooltip.tsx` | content, children / summary | info reachable via focus + click; tooltip never hides essential explanation; avoid hover dependency on phone |
| FileUpload → `file-upload.tsx` | label/name/accept/maxBytes?/onFiles/disabled | native file picker, size/type message, loading progress parent, error text, WebView browser fallback; no fake upload complete |
| Avatar → `avatar.tsx` | name, src?, size sm/md | 32/44px image with fallback initials, explicit alt or decorative; protect private image URLs |
| Stat/KPI tile → `stat-tile.tsx` | label/value/detail?/href? | value tabular-nums, text equivalent always; clickable tile full 44px and keyboard link |
| Utility notice → `inline-notice.tsx` | existing tone props and children | partial/read-only/stale reason visible; never raw stack text |

### 5.1. State implementation matrix (per shared component)

Read each column as a required **visual plus semantic** rule, not optional mood. `N/A` means the component is passive and its interactive child owns that state. `D` default; `H` hover; `F` focus; `A` pressed/selected; `X` disabled; `L` loading; `E` error.

| Control | D / H / F / A | X | L | E |
|---|---|---|---|---|
| Button | canonical fill / 120ms darker fill / 2px deep-teal outline / pressed style | native disabled, 50% opacity; reason adjacent | `loading` disables + `aria-busy`; parent announces outcome | form summary near fields, never silently fail |
| Input | white with border / contrast outline / deep-teal 2px outline / caret | native disabled + muted | enclosing form preserves text | `error` or `aria-invalid` and connected error paragraph |
| Select | native white / border / 2px outline / native option selected | native disabled | dependent options show separate status | native invalid + connected text |
| Textarea | white / border / 2px outline / caret+resize | native disabled | never discard draft | `aria-invalid`, own error description |
| Checkbox | unchecked / pointer cursor / deep-teal outline / native checked | native disabled | parent pending disables | external invalid reason |
| Radio | unchecked / pointer cursor / deep-teal outline / radio-group checked | native disabled | parent pending disables | fieldset error with association |
| Switch | muted track / cursor / 2px outline / checked teal+knob | native disabled | parent pending disables | persistent notice on mutation rejection, revert server state |
| DatePicker (Input) | native picker / border / deep-teal outline / chosen date | native disabled | inherited form loading | date range and timezone error below control |
| Dialog | white panel / N/A / focus trapped in native modal / action button | nondismissible if pending | pending footer buttons disabled | alert inside sheet, preserve content |
| Drawer | white panel / N/A / focus trapped / selected item | nondismissible if pending | child skeleton | child ErrorState |
| BottomSheet | white panel / N/A / focus trapped / Apply link/button | nondismissible if pending | retain original filter draft | no data loss on failed apply |
| ConfirmDialog | Cancel/Confirm / button hover / Cancel autoFocus / confirm pressed | `confirmDisabled` and reason | `pending` prevents close/duplicate | parent ErrorState retains confirmation context |
| Toast | white anchored panel / dismiss hover / focus dismiss / dismiss clicked | N/A | N/A | `role=alert` for error, `role=status` otherwise |
| Tabs | line-tabs or links / tinted on hover / 2px outline / aria-selected or aria-current | `disabled` in tablist mode | selected panel skeleton | selected panel ErrorState |
| DataTable | row border / optional row tint / link focus outline / selected row action | disabled child explains why | `Skeleton variant=row` | ErrorState above remaining rows |
| Card | white static surface / N/A / focus owned by child / N/A | child disabled | `Skeleton variant=card` | ErrorState in place |
| Badge/StatusBadge | explicit semantic text / N/A / N/A / N/A | N/A | unknown state is text, never false green | error tone text on tint |
| EmptyState | title + guidance / action hover / action focus / action clicked | action disabled with reason | N/A | use ErrorState instead of empty when read failed |
| ErrorState | alert + recovery / action hover / action focus / Retry clicked | retry disabled while pending | retry Button busy | persistent reason; never raw code |
| Skeleton/Loading | quiet placeholder / N/A / N/A / N/A | N/A | shape matches final page; 12s recovery | timed fallback to visible Retry |
| Pagination | links + current page / tint / 2px outline / aria-current | first/last disabled as noninteractive text | route skeleton, maintain selected params | list-level ErrorState; preserve URL |
| FilterBar | inline desktop, sheet phone / action hover / button focus / sheet open | Apply disabled while pending | keep filter draft | inline filter validation; don't reset on server failure |
| PageHeader | semantic h1 / action hover / action focus / action pressed | action disabled with reason | title remains while body loads | independent error region below |
| Breadcrumbs | links + terminal text / underline / link outline / aria-current | N/A | keep known parent links | unavailable child link omitted, never broken link |
| Tooltip/InfoPopover | labelled disclosure / cursor / outline / open panel | omit trigger only with reason | N/A | always visible reason in accessible content |
| FileUpload | native chooser / native pointer / deep-teal outline / selected file | native disabled | server upload pending outside chooser | size/type error next to control |
| Avatar | image / N/A / N/A / N/A | N/A | initials fallback while image loads | failed image must fall back to initials (verify in browser) |
| StatTile | label/value/optional link / border tint / link outline / link activated | no href for denied KPI | skeleton kpi | value `—`, visible explanation, not `0` |

**Contrast spot checks by WCAG algorithm:** foreground `--lms-neutral-900` on `--lms-primary` = 7.19:1; on `--lms-primary-hover` = 5.03:1; on `--lms-error` = **4.49:1 (fails 4.5)**. Thus `Button variant="danger"` uses the exact existing `--lms-error-subtle` tint with dark text and `border-error`, not a red solid fill. Body on white 7.83:1; supporting text on white 4.83:1; deep-teal on white 4.94:1. Exclude placeholder/disabled labels from required information; never rely solely on low-contrast `--lms-border` to identify controls.

**Compatibility:** Never rename or remove pre-existing props. Add optional props; existing call sites must render unchanged unless specified above for accessibility. “Loading” isn't a substitute for `disabled` or `aria-busy`. No catalogue component may fetch tenant data by itself.

## 6. Mobile + native-app WebView

1. **Table-to-card algorithm:** at <640px render first `mobilePriority="primary"` as card heading, up to three `secondary` properties as labelled definition rows, put any additional non-hidden properties in an explicit **More details** disclosure, and preserve actions inside cells; omit `hidden` *only when redundant*. When a detail URL exists, pass `rowHref`; never drop data silently. PII never appears in a mobile card if absent from desktop or unauthorized. Desktop `DataTable` remains a semantic table. Columns with no priority default to first as heading and remaining as labelled rows; audit dense 25+ column grids explicitly.
2. **Filters:** `FilterBar` displays query and “Filters (N)” on phone, opens `BottomSheet` containing original form children; apply via normal GET/searchParams to keep URL filters/shareability; back/Escape dismisses without applying draft. Desktop inline filters.
3. **Dialogs:** <640px use full-screen `100dvh` panel with internal scroll and sticky footer `pb-[max(1rem,env(safe-area-inset-bottom))]`; no nested fixed keyboard toolbar. Use `visualViewport` only where absolutely necessary, otherwise browser-resizing layout.
4. **Primary action:** at phone `sticky bottom-0 z-20 border-t border-border bg-surface/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]`; add `pb-24` to form content. Hide sticky positioning if browser keyboard overlap is observed; keep submit reachable by scrolling.
5. **44px:** all pointer/keyboard targets `min-h-11 min-w-11`, gap ≥8px; icon-only must have `aria-label`, never rely on swipe or long-press for actions.
6. **Inputs:** `type=email` for email, `type=tel` for phone, `inputMode=decimal/numeric` for numbers, `type=date` for calendar-day entries; 16px input text on iOS. Never use `type=number` for IDs/roll numbers.
7. **Text:** use `min-w-0 break-words`; truncate in a single line only if full text available through detail/accessible name, never truncate validation, amount, status or action.
8. **Dates / money:** `Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"})`; add `timeStyle:"short"` for instants. Calendar-day fields stored/rendered without timezone conversion. `Intl.NumberFormat("en-IN")`, currency `new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"})`. Mark IST once per section.
9. **Long lists:** route pagination by default, 25 rows/page; after 100 rows pagination or virtualization mandatory. Infinite scroll only if bookmarks, screen reader announcement, focus, load-more control and back-scroll restoration all work. Pull-to-refresh only when host offers it; always offer visible Refresh/Retry.
10. **Offline/slow:** no unconditional optimistic mutations; on offline mark data “last loaded” with refresh, block unsafe writes but preserve draft. At 12s loading show “taking longer” fallback and retry. Render completed sections when auxiliary reads fail; don't show zero as missing.
11. **WebView:** use same-tab `next/link` for internal navigation. External links should remain an `<a href>` with in-context fallback; never `window.open`. Native share/download optional, always expose a normal accessible URL or instructions. File picker may be unavailable—offer paste-link alternative where domain permits. Back goes to a known parent route; dialogs close on Escape/native back interception by browser history where supported and return focus; never trap the user. Do not suppress text selection, long-press or pinch zoom. Use safe-area env insets; no `height:100vh`.

## 7. Forms and destructive operations

- Every field has visible `<label htmlFor={id}>`, required marker `*<span className="sr-only">required</span>`, optional helper `id="${id}-hint"`, invalid `id="${id}-error"` immediately under input, and `aria-invalid` + `aria-describedby` linking both. Don't substitute placeholder.
- Validate after blur or first submit; then revalidate while changing invalid fields. On submit, prevent default, validate all, focus `[aria-invalid="true"]` first, scroll it into view, do not clear values. On server validation, map safe field messages, not raw errors.
- Guard double submit with synchronous in-flight `useRef` plus `pending` state; disable submit and expose `aria-busy`. Success keeps official legacy copy. Failure preserves draft, retryable errors do not assume write failed if acknowledgment is lost.
- Autosave only for idempotent drafts that have version/ETag; debounce ≥800ms after last input and show Saved/Saving/Failed text. Otherwise explicit Save. Editing route changes need unsaved guard (`beforeunload` + in-app navigation interception as supported); drafts persist locally only after product privacy review.
- Group related inputs in `<fieldset><legend className="text-lg ...">`; separate groups by `space-y-6`. Destruction uses `ConfirmDialog` with object, irreversible consequence, pending state, and cancel default-focus; never `window.confirm`.

```tsx
<label htmlFor="phone" className="block text-sm font-medium text-foreground">Phone</label>
<Input id="phone" name="phone" type="tel" inputMode="tel"
  aria-invalid={Boolean(error)}
  aria-describedby={error ? "phone-error" : "phone-hint"} />
<p id="phone-hint" className="text-xs text-muted-foreground">Use the registered number.</p>
{error ? <p id="phone-error" role="alert" className="text-sm text-foreground">{error}</p> : null}
```

## 8. State matrix / graceful operation

| Archetype | Loading shape | Empty | Recoverable error | Partial / denied / stale |
|---|---|---|---|---|
| Dashboard / report | KPI `Skeleton variant=kpi` ×4 and `card` | `EmptyState` inside metrics region | `ErrorState` and Retry | show available tiles; unavailable tile label “—”, reason; denied hide sensitive measures; stale timestamp banner |
| List / inbox / calendar | `row` ×5 matching density | `EmptyState` with query-clear or authorized create | preserve filters and `ErrorState` | show rows that loaded, independent error notice; denied read-only; stale refresh banner |
| Detail / wizard | `card` header + `row` ×3 | missing ID = typed not-found state | `ErrorState` keeping known context | preserve successful tabs, denied tab content absent with explanation, stale version conflict warning |
| Form / settings / auth | `form` ×3 only before initial data; never replace typed form | N/A: render form | field errors + retry retaining draft | readonly controls and reason, pending state, unsaved guard, stale version prompts reload without automatic discard |
| Public / error page | `card` only if asynchronous | explicit signed-out/no access copy from legacy | Retry/Back link; no stack trace | no blank viewport, no endless spinner |

A permission response is **not** a transient network error. An unverified mutation acknowledgment must say the result cannot be confirmed; offer Refresh before retrying. A status banner uses `role=status` for changes, `role=alert` for urgent errors. Do not use HTTP status numerals in user-visible text.

## 9. Accessibility / WCAG 2.2 AA acceptance

- One `<main>` landmark from shell or public layout, single `h1`, `h2` sections, no heading skips without structural reason; nav names unique. Skip link reaches main; browser Tab order matches visual order.
- Every interactive element keyboard accessible: Tab/Shift+Tab all controls; Enter/Space button/checkbox; arrow/Home/End tabs; Escape closes nonpending modal; dialog native focus trap and focus return. Menus/sheets must not lose trigger focus.
- Visible focus outline `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]`, not glow alone. Hover not the only reveal. Tap targets ≥44×44px (WCAG 2.2 minimum 24px is insufficient for LMS mobile standard).
- Normal text contrast ≥4.5:1, large text ≥3:1, UI state/active indicator ≥3:1; status colour always paired with text/icon. Bright primary fill needs dark foreground; white on primary fails (2.35:1). Likewise small teal text `--lms-primary-text` on white fails (3.59:1).
- Icon-only button has nonempty `aria-label`; form invalid has `aria-invalid` and described error; async field status `aria-live="polite"`; errors `role="alert"`; toasts announced without moving focus; page changes communicate title/focus.
- Skeleton decorative blocks `aria-hidden=true` with one status label; reduced-motion animate-none. Screen-reader page updates include “Page X of Y” and never use symbol-only feedback.
- Do not disable zoom, copy/selection or OS accessibility features. Run keyboard+VoiceOver/TalkBack checks on each reference page at 320, 360, 390, 768 and 1280 widths.

## 10. Content and legacy wording

Preserve visible legacy nouns, labels, route/sidebar order, empty/error message text when defined in `docs/audit/legacy-copy-A.md`, `legacy-copy-B.md`, and account parity specs; the copy in this document is **anatomy illustration**, not authorized replacements. Use sentence case only for *new* supplementary accessibility text. No emojis as primary status, all dates local IST, grouping en-IN (1,00,000), `₹` as INR, percent `NN%` only where calculated (never missing=0%). Truncate only when full name is elsewhere accessible. Private learner contact stays masked unless explicitly authorized. Never show raw codes, stack traces, internal actor IDs or unapproved diagnostic text.

## 11. Per-role top jobs and preferred patterns

| Role | Five concrete jobs → pattern |
|---|---|
| Learner | find courses (directory), resume lesson (detail tabs), submit assignments (form), attempt quiz (wizard), review placement applications (detail + timeline) |
| Faculty | find teaching deliveries (directory), prepare assignment/quiz (editor), mark attendance (table/form), review submissions (detail/list), inspect gradebook (report) |
| Mentor | scan teams (dashboard), triage tasks (directory/board), review deliveries (detail tabs), write feedback (form), plan team meetings (calendar) |
| TPO | scan action queue (dashboard), filter students (directory/card), manage drive steps (detail tabs/wizard), confirm round result (destructive confirmation), track interviews (calendar) |
| College Admin | manage people directory (directory), organize academics (detail tabs), create batches (form/wizard), review approvals (inbox), oversee placements (report) |
| Recruiter | see hiring home (dashboard), inspect drives (directory), edit rounds (wizard), schedule interviews (calendar), answer messages (inbox/thread) |
| Super Admin | inspect tenants (directory), configure college (settings), manage modules (settings), audit activity (report), handle delegated access (detail/read-only states) |

## 12. Representative page-to-pattern map (audit these 25)

Every row is an existing `docs/orchestrator/ui-ux/pages-*.md` route. “Apply” inherits responsive/state matrix in §4/8 and component APIs in §5.

| Page | Archetype → key components |
|---|---|
| `/learn` | **Alias only**: redirects to `/learn/courses`; audit that directory, not a fictitious learner dashboard |
| `/learn/courses` | directory → FilterBar DataTable-as-cards Pagination |
| `/learn/courses/[deliveryId]` | **Alias only**: redirects to `/learn/courses/[deliveryId]/home`; actual leaf: `[deliveryId]/[...courseTab]/page.tsx` → detail / workspace tabs and lesson composition |
| `/learn/allAssignments/[assignmentId]` | form/detail → Card FileUpload ConfirmDialog |
| `/teacher/courses` | directory → DataTable Pagination |
| `/teacher/courses/[deliveryId]/gradebook` | report → StatTile DataTable |
| `/teacher/profile/details` | editor → PageHeader Card Input Textarea |
| `/mentor/projects` | directory → FilterBar DataTable |
| `/mentor/projects/[projectId]` | detail → Tabs Card StatusBadge |
| `/mentor/calendar` | calendar → FilterBar Card |
| `/tpo/students` | dense directory → FilterBar BottomSheet DataTable mobile cards Pagination |
| `/tpo/placements/jobs/[jobId]` | drive workspace detail → Tabs Card ConfirmDialog |
| `/tpo/messages` | inbox → DataTable Card |
| `/tpo/calendar` | calendar → FilterBar Card |
| `/college/people` | **Alias only**: redirects to `/college/contacts`; audit the real Contacts directory/filters, not the alias |
| `/college/contacts` | directory → FilterBar DataTable mobile cards |
| `/college/branding` | settings/editor → Card Input FileUpload |
| `/recruiter/drives` | directory → FilterBar DataTable |
| `/recruiter/drives/[jobId]` | detail → Tabs Card |
| `/recruiter/home` | dashboard → StatTile Card |
| `/admin/colleges` | super admin directory → FilterBar DataTable |
| `/admin/module-access` | super admin settings → Switch Card ConfirmDialog |
| `/admin/audit` | report/directory → FilterBar DataTable |
| `/login` | auth → Card Input Button |
| `/quiz` | wizard → Card Radio Button |

## 13. Anti-patterns / anti-drift protections

| Failure | Required fix / CI or reviewer check |
|---|---|
| New blue brand action | `--lms-*` token only; reject `bg-blue-*` in product components |
| White text on bright teal | `text-foreground` on primary; compute contrast |
| One-off pixel padding | use §2 spacing; lint review `p-[Npx]` |
| Desktop table shrunk on phone | DataTable mobile priorities and cards |
| Tooltip-only information | persistent helper line / InfoPopover click |
| Toast-only failure | inline field or ErrorState as well |
| Native JS confirm | ConfirmDialog with explicit consequence |
| Missing loading terminal | 12s fallback with retry, no perpetual spinner |
| Hard-coded date timezone | `en-IN`, `Asia/Kolkata` shared formatter |
| Wording drift across lanes | compare `legacy-copy-A/B`, do not rename |
| Role-specific fork of Button | reuse `src/components/ui/button.tsx` |
| Invisible disabled CTA | adjacent reason text or accessible title |
| Hidden action on hover | action always keyboard/touch reachable |
| Unsafe optimistic write | version token / server receipt before success |
| Long word breaks the layout | `min-w-0 break-words` at card text |

## 14. Definition of excellent — reproducible 100-point per-page audit

Award whole points only on witnessed evidence; no credit for untested claims. A page with missing tenant permission, lost draft or inaccessible primary action **fails regardless of score**. Two auditors should score within 5 points using the checks below.

| Category (points) | Exact subchecks, score 0 or full listed points for each |
|---|---|
| Brand and copy **15** | tokens/parity 5; correct legacy words/nav 5; contrast pairs measured 5 |
| Mobile/native **20** | 320/360/390 no horizontal scroll 6; tap 44px 4; safe area/keyboard 4; tables/filter/modal behaviour 4; webview back/upload 2 |
| States and resilience **15** | skeleton sized 3; empty/error/retry 4; partial/denied/stale 4; preserves typed data/offline 4 |
| Forms/transactions **10** | label/validation/focus 4; loading/double-submit 3; unsaved/confirm 3 (if no form award when states apply to actions) |
| Accessibility **20** | landmarks/headings 3; keyboard/focus/trap 6; aria names/live/error association 5; noncolour meaning 3; reduced motion 3 |
| Hierarchy and components **10** | header/one primary 3; geometry/typography 3; shared components/no forks 4 |
| Performance and evidence **10** | no layout shift/pagination >100 4; bounded loading/safe fetch 3; real browser+typecheck+test evidence 3 |
| **Total 100** | ≥90 candidate for sign-off only if no BLOCKER/MAJOR findings; 80–89 fixes required; <80 blocked |

**“Copy these” references, once implemented and audited:**
- Directory: `src/app/(authenticated)/college/contacts/page.tsx` (College Admin): existing GET filters in phone `FilterBar` sheet, URL pagination, masked records.
- Form: `src/app/(authenticated)/teacher/profile/details/page.tsx` (Faculty).
- Detail with tabs: `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` (Mentor): shared route-link `Tabs` through `MentorProjectTabs`, preserve original query tab names.
- Dashboard: `src/app/(authenticated)/tpo/home/page.tsx` (TPO): StatTiles with existing legacy row titles, real metrics and next-up queue.

Do not tick other lanes' UX checklists until a browser audit actually passes. These four pages are patterns, not fixtures; keep their original permission/data integrations and exact legacy wording.

## 15. Audit-1 precise mobile exceptions for complex pages

These override the generic archetype *only in composition*, not brand, text or permissions. Use the **same authorized data** at every viewport. The full column set in TPO roster is specified by `src/components/tpo/tpo-students-spreadsheet.tsx`; the grid is `tpo-spreadsheet-grid.tsx`, not the **Branch intelligence** aggregation table in the route. Both are now phone cards.

### 15.1. TPO Students (source `/tpo/students`, `TpoStudentsSpreadsheet`)

| Priority | 320/360/390 fields and actions | Tablet/desktop and permission |
|---|---|---|
| Primary/always visible | Student (click to open panel), student number, Stage, Profile verification, Needs attention, Offers waiting | `mobilePrimaryKeys={["student","number","stage","profile","attention","offersAwaiting"]}`; keep spreadsheet table at ≥768px |
| Action/always visible | Open student panel; Outcome; **After college** editor; Placement history; Change participation | Render actual actions **outside** More details; disable unauthorized mutations but retain authorized read-only status |
| Details/disclosure | Branch, Batch, gender, year, masked phone, degree, CGPA, 10th/12th/diploma/UG, backlogs, eligibility reason/level/date, registration, applications, all remaining visible configured columns | Accessible disclosure preserves every permitted column; only `exportOnly` email never goes on card |
| Selection | Select student row and Select all filtered students, 44×44 target including label | Bulk selection rights depend on server-scoped authorized membership IDs; never select invisible college data |
| Aggregates | Branch intelligence phone card: Branch link, Learners, Registered, Applying, Rate; disclosure: Placed in pool and overall | Desktop `min-w-[52rem]` table is **hidden** on phone; aggregation not a student roster |
| States | denied: no unpermitted bulk actions; read-only: status and history remain; unknown verification: “Verification unavailable”, not “Verified”; stale: receipt/reload before mutation | No assumption that absent CGPA, phone, joining outcome, or readiness equals zero |

```text
320px / 360px / 390px (16px gutter, no sideways page scroll):
[Students roster][results 25/page]
[Search......................][Filters (N)]
[Student + student number]     ← tap opens authorized quick panel
[Stage] [Verification]
[Needs attention] [Offers waiting]
[Select][Open panel][After college][History][Participation] ← wrap 44px actions
[More student details ▾]      ← every nonexport field recoverable
[Previous] [Next]
```

### 15.2. Recruiter/HR job detail (`/hr/placements/jobs/[jobId]` and `/recruiter/drives/[jobId]` re-export)

| Order | Phone behaviour | Permission/state |
|---|---|---|
| 1 | PageHeader: actual job title, status, parent Drives link | No access → existing permission redirect/denied, no stale recruiter identifiers |
| 2 | Tabs in *existing legacy order*: Overview, Applicants, Rounds, Offers, Requests, Discussion when authorized | Tabs are same-tab routes; disabled/unavailable tabs inert, no opening external popups |
| 3 | Applicants: name, stage, application status; actions Review applicant and next/previous (44px); advanced criteria under labelled details | Only recruiter-scoped applicants; unavailable stage count “—”, not zero |
| 4 | Rounds: round name, kind, date, interview slot, result-entry action; collision indicator+affected candidate names | Interviews must keep timezone IST and show conflicting room/person before saving |
| 5 | Offers: candidate, offer state, acceptance deadline; full stage history under disclosure | Selection mutations require server permissions and explicit confirmation |
| 6 | External portfolio/GitHub/project links: same-tab `http(s)` anchor plus selectable URL option when host blocks | Never `target=_blank` or `window.open`, never paste untrusted scheme as link |

```text
320/360/390px:
[← Drives][Job title + status]
[Overview Applicants Rounds ... →]  (scrollable, 44px links)
[Applicants | filtered total]
[Candidate][Stage][Status]
[Review applicant] [Next/Previous]
[More criteria ▾]
[Round title][IST start/end][Room conflict ⚠ + textual description]
[Edit / Enter results (only if allowed)]
```

### 15.3. Placement calendar (`placement-calendar-workspace.tsx`)

| Phone priority | Exact behaviour |
|---|---|
| P0 | Active week/day label with Previous/Today/Next 44px controls; `en-IN` / `Asia/Kolkata` labels |
| P1 | Chronological agenda cards: meeting/round name, start–end IST, company, room, participants, status |
| P2 | Collision and unavailable resources shown as explicit alert-text + role-appropriate action; do not hide overlap |
| P3 | Filter categories/dates in BottomSheet; retain draft and URL until Apply; no 320px timetable grid |
| P4 | Desktop weekly grid at ≥1024px; tablet 640–1023 shows agenda by default with opt-in weekly grid in scroll region |
| Permission | TPO may act on scoped drives, college admin sees college scope, super admin must use acting-college scope; read-only agenda keeps accessible details |

```text
320/360/390px:
[Calendar / period]
[< Previous][Today][Next] [Filters (N)]
[Date heading]
[09:30–10:30 IST] [Meeting type]
[Company • Room • Attendees]
[Conflict: ...] [View/reschedule (if permitted)]
[Date heading]
[Next agenda item]
```

### 15.4. Native host/back/keyboard capability contract

| Capability | Browser | Android WebView | iOS WKWebView | Required fallback |
|---|---|---|---|---|
| Back with modal open | same-URL modal history marker; first Back dismisses | Host **must** dispatch cancelable `lms:native-back` before native navigation, obey `dispatchEvent() === false` | Same host event when toolbar swipe/back occurs | If host cannot dispatch, same-URL history marker handles conventional webview back; never `router.back()` to exit quiz |
| On-screen keyboard | `visualViewport.resize`/scroll updates `--lms-visual-height` | Resize, scroll active input, keep footer in overlay scrolling container | Same plus bottom safe area | Full-screen dialog scrollable; no fixed save bar outside panel |
| Native file picker | `input[type=file]` | Host enables input chooser and grants temporary read permission | WKWebView file chooser if allowed | `FileUpload fallback` parent-supplied URL/path control where domain supports it; never pretend file saved |
| Download/share | same-tab URL and normal anchor | Host may intercept safe URL | Host may intercept safe URL | Visible selectable URL and return path; no popup-only action |
| Safe area | `env(safe-area-inset-*)` | edge-to-edge insets from host | notch/home indicator | `pb-[max(1rem,env(safe-area-inset-bottom))]` on footer |
| Zoom/selection | leave default | don't intercept pinch/text selection | don't intercept long press | input font ≥16px; touch targets ≥44px |

**Host Back integration:**
```js
const backEvent = new Event("lms:native-back", { cancelable: true });
const handled = !window.dispatchEvent(backEvent);
if (!handled) nativeNavigateBack();
```
Do not send a second Back while `pending`; treat a prevented non-dismissible modal as handled without dismissing. On phone keyboard `visualViewport.height` is applied to the overlay's CSS custom height; footer stays *inside* the scrolling modal. If an embedded host lacks `visualViewport`, use `window.innerHeight`. A sticky nonmodal action bar must not remain fixed when an input is focused and viewport height is less than 480px—move actions into normal document flow with `focus-within:static` (or put them in the scrollable form). Do not persist unsaved personal forms locally unless the permission/privacy owner approves: use **in-memory draft only**, `beforeunload` plus explicit app-route guard, no autosave and no silent clear.

**Exact shell:** sidebar is `w-64=256px` at `lg:1024px` and up, phone/tablet menu below `lg`; shell content `lg:pl-64`. Container `px-4` until 640px, `sm:px-6` at ≥640, `lg:px-8` at ≥1024. Two columns only at ≥1024. 768px remains one-column content with full-width navigation trigger.

### 15.5. Guarded form with focus-to-first-error (use with FormField)

```tsx
"use client";
import { useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ProfileForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!value.trim()) {
      setError("Required"); // Replace with exact legacy field error if available
      requestAnimationFrame(() => document.getElementById("profile-name")?.focus());
      return;
    }
    inFlight.current = true;
    setPending(true);
    try {
      // await authorized version-aware server mutation; preserve value on failure
    } finally { inFlight.current = false; setPending(false); }
  }
  return <form onSubmit={save} className="space-y-6" aria-busy={pending}>
    <FormField id="profile-name" label="Name" required error={error}>
      {field => <Input {...field} value={value} onChange={e => {
        setValue(e.target.value);
        if (error) setError("");
      }} onBlur={() => setError(value.trim() ? "" : "Required")} />}
    </FormField>
    <Button type="submit" loading={pending}>Save</Button>
  </form>;
}
```

### 15.6. Component API/action examples (no guessed props)

Every entry supplies a concrete caller obligation **in addition to** §5 and §5.1. Props not listed are the native element props if the component wraps a native element. “Loading” on passive components is an enclosing Skeleton state, not a dead prop.

| Implementation | Typed call/example | Don't / invalid or disabled and phone test |
|---|---|---|
| `button.tsx` | `<Button variant="primary" size="md" loading={pending} type="submit">Save</Button>` | no white-on-teal; disabled native, no duplicate submit, ≥44px |
| `input.tsx` | `<FormField id="email" label="Email" error={error}>{p=><Input {...p} type="email" inputMode="email" />}</FormField>` | don't use placeholder alone; `aria-describedby` owned by FormField, 16px on phone |
| `select.tsx` | `<FormField id="stage" label="Stage">{p=><Select {...p}><option value="all">All</option></Select>}</FormField>` | never select silently on disabled, keyboard native |
| `textarea.tsx` | `<FormField id="note" label="Note">{p=><Textarea {...p} rows={4} />}</FormField>` | keep typed work after server error |
| `selection-controls.tsx` | `<Checkbox name="selected" label="Select student" checked={yes} onChange={e=>setYes(e.target.checked)} />`; `Radio name="scope" value="college" label="College" />`; `<Switch label="Enabled" checked={yes} onChange={...}/>` | native checked; never use a fake toggle; 44px label |
| DatePicker via `input.tsx` | `<Input id="date" type="date" />` | no UTC conversion of bare date; parent FormField and validation |
| `dialog.tsx` | `<Dialog open={open} onOpenChange={setOpen} title={title} footer={<Button>Save</Button>}>...</Dialog>` | no dismiss when pending; `dismissible={false}` prevents Back |
| `drawer.tsx` | `<Drawer open={open} onOpenChange={setOpen} title={title}>...</Drawer>` | tablet side; phone full screen; scroll inside |
| `bottom-sheet.tsx` | `<BottomSheet open={open} onOpenChange={setOpen} title="Filters">...</BottomSheet>` | don't remount uncontrolled form on resize |
| `confirm-dialog.tsx` | `<ConfirmDialog open={open} onOpenChange={setOpen} title={title} description={consequence} onConfirm={confirm} pending={pending}/>` | no window.confirm; cancel focus; pending locks |
| `confirm-action-dialog.tsx` | `<ConfirmActionDialog open={open} onCancel={close} onConfirm={confirm} title={title} consequence={detail}/>` | inherited legacy prop names work |
| `toast.tsx` | `useToast().showToast({title:"Saved",tone:"success"})` in Provider | don't use toast as only validation; 44px dismiss |
| `tabs.tsx` | panel: `<Tabs items={items} value={value} onValueChange={setValue} ariaLabel="Sections"/>`; route: `<Tabs renderPanel={false} items={links} value={value} ariaLabel="Sections"/>` | disabled links render `aria-disabled` text; panels without callback noninteractive |
| `data-table.tsx` | `<DataTable rows={rows} columns={columns} getRowKey={r=>r.id} rowHref={r=>"/detail/"+r.id}/>` | specify primary, secondary, action priority; `hidden` needs explicit reason plus detail route; don't bury actions |
| `card.tsx` | `<Card as="section" title={legacyTitle} footer={actions}>...</Card>` | no hover-only controls; semantic h2 follows h1 |
| `status-badge.tsx` | `<StatusBadge tone="warning">Awaiting</StatusBadge>` | keep literal status text; don't rely on colour |
| `empty-state.tsx` | `<EmptyState title={legacyEmpty} description={legacyHint} action={authorizedLink}/>` | never show if fetch failed; no invented copy |
| `error-state.tsx` | `<ErrorState description={safeMessage} action={<Button onClick={retry}>Retry</Button>}/>` | no stack/status code, preserve draft |
| `skeleton.tsx` | `<Skeleton variant="row" count={5} label="Loading students" />` | one live status, no duplicate labels |
| `loading-state.tsx` | `<LoadingState label="Loading workspace…"/>` | loading not zero/empty |
| `page-loading.tsx` | `<PageLoading label="Loading…" variant="card" count={3}/>` | 12s visible retry, no perpetual spinner |
| `pagination.tsx` | `<Pagination page={page} pageCount={pages} hrefForPage={n=>makeHref(n)}/>` | preserve URL filters; route announcer re-focuses main |
| `filter-bar.tsx` | `<FilterBar search={searchControl} filters={getForm} activeCount={n}/>` | one mounted subtree; always-visible Search, sheet below 640px |
| `page-header.tsx` | `<PageHeader title={legacyTitle} actions={actions}/>` | exactly one page h1; actions wrap on 320px |
| `breadcrumbs.tsx` | `<Breadcrumbs items={[{label:"Projects",href:"/mentor/projects"},{label:"Overview"}]}/>` | last crumb current, never use browser back alone |
| `tooltip.tsx` | `<InfoPopover content={help}><span aria-label="More information">ⓘ</span></InfoPopover>` | not hover-only; include essential help permanently |
| `file-upload.tsx` | `<FileUpload label="Resume" accept=".pdf,application/pdf" maxBytes={5_000_000} onFiles={setFiles} fallback={urlControl} />` | accept is hint; client checks size/type and clears stale parent on error; server revalidates |
| `avatar.tsx` | `<Avatar name={personName} src={approvedUrl} size="md"/>` | fall back to initials on image error |
| `stat-tile.tsx` | `<StatTile label="Students" value={count ?? "—"} href="/tpo/students" />` | en-IN grouping; unavailable != zero |
| `inline-notice.tsx` | `<InlineNotice tone="info" message={legacyMessage}/>` | message may be persistent; no raw server error |
| `third-party-link.tsx` | `<ThirdPartyLink href={approvedHttpsUrl} label="Join meeting"/>` | same tab + selectable URL; no popup-only behaviour |
| `form-field.tsx` | `<FormField id="name" label="Name" helper={hint} error={error}>{p=><Input {...p}/>}</FormField>` | owns label, `aria-invalid`, `aria-describedby` and adjacent alert |

### 15.7. Eight-state specimens for every archetype

Use existing copy from `docs/audit/legacy-copy-A.md`, `legacy-copy-B.md`, or the account `docs/parity/*.md` for the text. Bracketed labels below are **state metadata**, not new user-facing strings. Every denied action is absent or inert by central permission, never “Retry”.

| Archetype | READY | LOADING | EMPTY | ERROR | PARTIAL | DENIED | READ-ONLY | STALE |
|---|---|---|---|---|---|---|---|---|
| Dashboard | real scoped KPIs + next | KPI×4 skeleton | EmptyState authorized setup | ErrorState retry main fetch | remaining KPIs, `—` auxiliary | ErrorState no retry | numbers without mutate | timestamp banner/Refresh |
| Directory | filtered rows/page | row×5 skeleton | matching zero + clear | ErrorState retains query | rows plus notice | no unauthorized row | links to detail only | refresh without reset |
| Detail | tab summary | card+rows skeleton | missing record not-found | ErrorState parent link | good tabs render, failed tab notice | no sensitive tab | status and history remain | version conflict + Refresh |
| Editor | editable FormField | form skeleton before mount | blank first-time form | inline errors, preserve | some sections fail, draft kept | no Save | disabled with reason | safe reload confirmation |
| Wizard | current step/save draft | step card skeleton | first step ready | inline retry | completed steps remain | block transition | preview only | version token refresh |
| Calendar | agenda dates/links | agenda×5 skeleton | empty day with next date | ErrorState retains date | some event sources unavailable notice | no restricted events | only View action | calendar refresh |
| Report | chart text+table | kpi×4 skeleton | no period data | ErrorState retry | other metrics + unavailable label | no sensitive report | exports restricted | timestamp data stale |
| Settings | named groups | form skeleton | default group from server | inline and summary error | unrelated groups continue | no mutation | disabled controls, reason | version conflict |
| Inbox | thread rows | row×5 skeleton | no messages | retry keeps draft | one thread fails notice | no private thread | archived transcript | refresh unread |
| Public/auth | login field group | form skeleton | login always renders | inline service problem | only optional org info missing | no access state with parent link | form disabled if service closed | expired code banner |
| Error/empty | readable heading/recovery | bounded skeleton if retry | EmptyState | ErrorState + Retry | render available portion | no Retry for 403 | safe read-only content | Retry/Refresh after stale |

**Per-role state-route contract:** Learner `/learn/courses` (directory), `/quiz` (wizard), `/learn/allAssignments/[assignmentId]` (form); Faculty `/teacher/profile/details` (editor), `/teacher/courses/[deliveryId]/gradebook` (report), `/teacher/calendar` (calendar); Mentor `/mentor/projects/[projectId]` (detail), `/mentor/reviews` (directory), `/mentor/calendar` (calendar); TPO `/tpo/home` (dashboard), `/tpo/students` (dense directory), `/tpo/calendar` (calendar), `/tpo/messages` (inbox); College Admin `/college/contacts` (directory), `/college/branding` (settings), `/college/batch-promotion` (wizard); Recruiter `/recruiter/home` (dashboard), `/recruiter/drives/[jobId]` (detail), `/recruiter/messages` (inbox); Super Admin `/admin/colleges` (directory), `/admin/module-access` (settings), `/admin/audit` (report). The authority for disabled/denied is the central permission/context service, not a role guessed from the route.

## 16. Atomic 100-point scoring ledger — supersedes subjective §14 interpretation

**Each atom scores 0 or full points with objective evidence.** A check that has no active form, table, or modal still has a testable “not applicable” counterpart: inspect whether any control or route triggers it; award full points only if the page has no such operation. No discretionary redistribution or guessed credit. Record source commit, viewport, test URL, screenshot hash, axe run and keyboard/manual transcript per atom. Any unexecuted required check scores zero. A BLOCKER/MAJOR prohibits PASS independently of score.

| ID | Points | Exactly when awarded |
|---|---:|---|
| BR1 | 5 | No raw off-palette interactive colour; tokens match globals/parity |
| BR2 | 5 | All visible role copy/nav labels match canonical legacy text |
| BR3 | 5 | All sampled text ≥4.5:1 (large ≥3:1), controls ≥3:1; automated pair report attached |
| MO1 | 6 | Screenshots at 320/360/390 show zero document horizontal scroll and no clipped primary content |
| MO2 | 4 | All actionable bounds measured ≥44×44, adjacent touch spacing ≥8px |
| MO3 | 4 | Keyboard open+notch/home bar at phone widths leaves Save and Back usable |
| MO4 | 4 | All table/filter/modal phone compositions match §4/15 |
| MO5 | 2 | Native Back and upload/download alternatives exercised or absence of these capabilities evidenced |
| ST1 | 3 | Loading skeleton reserves same approximate height as ready view |
| ST2 | 4 | Empty, error and retry screens exercised with authorized action |
| ST3 | 4 | Partial, denied, read-only, stale injected with correct data scoping |
| ST4 | 4 | Offline/write error preserves unsent data, no false success |
| FO1 | 4 | Every field visible label, blur+submit error, focus first invalid field |
| FO2 | 3 | Concurrent submits suppressed, pending feedback announced |
| FO3 | 3 | Destructive guard and unsaved draft/route guard tested (or none exists and evidenced) |
| AX1 | 3 | Exactly one main + one h1, landmarks and heading levels in order |
| AX2 | 6 | Keyboard Tab/Space/Enter/Escape/arrows, modal focus trap/return tested |
| AX3 | 5 | Correct accessible name, described error and async announcements tested |
| AX4 | 3 | All statuses accompanied by text; colour-independent meaning |
| AX5 | 3 | reduced-motion system setting produces no essential animation |
| HI1 | 3 | One primary action and PageHeader as §3, exact legacy label |
| HI2 | 3 | Spacing/radius/type values all from §2 (no unreviewed one-offs) |
| HI3 | 4 | Uses shared patterns, no duplicate role-specific primitives |
| PE1 | 4 | ≤100 rows without pagination OR page/virtualization beyond 100; no major layout shift |
| PE2 | 3 | Delayed/faulting auxiliary data bounded, page remains useful |
| PE3 | 3 | Linked passing typecheck, tests, Playwright and WebView/AT evidence on same commit |
| **Total** | **100** | 15+20+15+10+20+10+10 |

**Benchmark scorecards (example evidence, not claimed test runs):** A 320px TPO student page with horizontal table, 40px actions and no error recovery scores BR=10, MO=0, ST=7, FO=7, AX=10, HI=6, PE=4 → **44/100 BLOCKED**. A Faculty profile editor with correct labels but no saved draft on disconnect scores 15+18+8+7+15+10+6 = **79/100 BLOCKED**. A fully verified modern directory meeting every test atom, with 25-row pagination and all eight fixture states, scores **100/100 candidate PASS** only after the three audits; this is a hypothetical benchmark, not a claim that a current route earned 100.



### 16.1. Atomic point checklist (no subjective 3–6-point lump scores)

Each semicolon-delimited subcheck is exactly **one point**. Award 1 only for linked observable evidence on the specific source revision and role/viewport; otherwise 0. If an interaction cannot occur on this route, award the point only with a screenshot or DOM scan **proving the trigger is absent**, plus a negative test confirming that no reachable modal, form, table or mutation route has been overlooked. **No N/A point redistribution** and no “looks good” partial credit. A reviewer must record the 25 row subtotals and each atomic result; two reviewers are within five points when both use the same evidence ledger.

| ID | Atomic 1-point checks (number of semicolon-separated checks = row maximum) |
|---|---|
| BR1 (5) | primary fill computed exactly `#26bac7`; no unreviewed blue class in active controls; no invented neutral on page; exact sidebar selected fill; dark theme scoped tokens remain canonical |
| BR2 (5) | h1 exact legacy string; navigation items exact labels; navigation order matches role manifest; primary CTA string matches legacy; status/empty/error public text matches parity source |
| BR3 (5) | every sampled normal text pair measured ≥4.5; large text ≥3; active control boundaries/focus ≥3; primary text contrast both light and tracker-dark; status chips text contrast ≥4.5 |
| MO1 (6) | 320 no document horizontal scroll; 360 no scroll; 390 no scroll; 320 header not clipped; 360 primary action not clipped; 390 full row action reachable |
| MO2 (4) | all primary taps ≥44×44; all secondary taps ≥44×44; icon-only target ≥44×44; neighbouring controls have ≥8px separation or nonoverlapping hit areas |
| MO3 (4) | top safe-area notch clearance; home indicator/footer clearance; keyboard shows focused field; keyboard leaves Save and Back reachable |
| MO4 (4) | desktop table to mobile cards/disclosure per explicit priority; filters from stable subtree; modal/sheet full screen with correct focus; sticky action and secondary actions usable |
| MO5 (2) | modal closes before native Back navigation; file picker/external URL has accessible fallback (or no such affordance exists, proved by source+DOM) |
| ST1 (3) | loading displays skeleton not empty; skeleton width/height reserves final content within 20%; 12s slow fallback interactive |
| ST2 (4) | true empty mode has next authorized action; error displays safe message; error has working Retry/Back; filters/draft persist after Retry |
| ST3 (4) | partial data never hides healthy data; denied view has no unauthorized retry; read-only has visible reason; stale conflict banner identifies authoritative refresh |
| ST4 (4) | offline injection visibly marked; unsent data survives failed request; uncertain receipt not reported success; retry cannot duplicate a mutation |
| FO1 (4) | all visible labels associated; blur validation near field; submit validation near field; first invalid field receives focus |
| FO2 (3) | one synchronous write lock; pending button visibly disabled; screen reader hears save success/failure without focus theft |
| FO3 (3) | irreversible writes have consequence dialog; unsafe route navigation prompts about unsaved work; cancel/discard keeps or intentionally discards correct draft |
| AX1 (3) | exactly one main; exactly one h1; headings/landmark order follows DOM |
| AX2 (6) | Tab and Shift+Tab traverse all actions; Enter/Space activations work; Escape closes overlay; Arrow/Home/End tabs work; focus trapped inside dialog; trigger regains focus on close |
| AX3 (5) | icon buttons named; `aria-describedby` ties errors; status live region announces update; page change announces route; pagination current page announced |
| AX4 (3) | statuses have textual meaning; error states don't rely on red; active/selected controls use visible shape/label in addition to colour |
| AX5 (3) | reduced-motion disables shimmer; overlay motion has no essential information; no auto-scrolling or autoplay violation |
| HI1 (3) | one primary CTA at entry; PageHeader h1/actions anatomy correct; real legacy CTA/title strings retained |
| HI2 (3) | type classes from §2 scale; spacing matches 4px base scale; card/control radius from scale |
| HI3 (4) | button from shared component; form field from shared component; overlay from shared component; table or phone card from shared renderer |
| PE1 (4) | server page size ≤100; rows beyond 100 use pagination/virtualization; no double cell formatter execution; no visible layout shift ≥0.1 CLS in measured transition |
| PE2 (3) | optional reads fail independently; bounded loading shows retry at 12s; healthy content interactive during auxiliary error |
| PE3 (3) | passing typecheck+lint linked to commit; passing unit + Playwright linked; manual native WebView + VoiceOver/TalkBack report linked |

For FO3 on a purely read-only directory, for example, earn the three points only if an audited DOM interaction sweep shows no destructive action, no edit route from that page, and no unsaved entry. For MO5 on a public error page, earn two points only when DOM/source prove no dialogs and no uploads/external links; if any appears after an async change, re-test. Record source hash and a zero on missing evidence; do not transfer points to unrelated rows.

**Annotated benchmark rows, not executed findings:** 
- TPO student directory with an 832px side-scrolling phone table: MO1=0/6 (all widths/content failed), MO4=0/4 (table rule broken), MO2=0/4 if raw 40px targets; even correct 15/15 brand cannot override the BLOCKER.
- Faculty editor with labels correctly associated but unsaved edits discarded after offline error: FO1=4/4, ST4≤1/4 (only offline detected), FO3≤1/3 (only consequence dialog); accessibility may score separately but page remains BLOCKED on data loss.
- Directory with full synthetic eight states, 320–1280 screenshots, passing typecheck and mobile AT evidence: may score 100/100 only if all 100 atomic checks linked; absence of native host report must score MO5=0, AX3 may partially score, PE3≤2, not a PASS.

## 17. Anti-drift enforcement and reference screenshots

The repository `scripts/check-ux-anti-drift.mjs` and `npm run ux:guard` are normative for changed shared UI and audited critical routes. Forbidden native confirm/popup and 40px interaction classes must be resolved or enter an explicit expiring waiver recorded in `docs/design-system/UX-GUARD-WAIVERS.md`. Every page PR must attach `320/360/390/768/1280` screenshots, state/permissions fixtures, en-IN/IST and legacy-copy diff, and confirm the per-page §16 ledger. Raw screenshot baselines require an actual Playwright/browser runner and manual approval; **no screenshot hash is invented by documentation**. Golden fixtures are stored at `tests/fixtures/ux-reference-states.json`, with role scope and never real student data. The approval owner is the UX orchestrator after audits 1, 2 and 3.

