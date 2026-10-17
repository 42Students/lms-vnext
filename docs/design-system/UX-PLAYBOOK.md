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
| Tabs → `tabs.tsx` | `items:{value,label,content?}[]`, `value`, `onValueChange`, `ariaLabel` | selected underline + aria-selected, arrows/Home/End, focus 2px, disabled optional; horizontal swipe scroll phone, active no hover requirement |
| DataTable → `data-table.tsx` | `columns:{key,header,cell,className?,mobileLabel?,mobilePriority?}`, `rows/getRowKey/empty?` | table desktop, card rows phone with primary=first priority; no truncated private columns; caption, th scope, no content hiding without meaningful label |
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

**Compatibility:** Never rename or remove pre-existing props. Add optional props; existing call sites must render unchanged unless specified above for accessibility. “Loading” isn't a substitute for `disabled` or `aria-busy`. No catalogue component may fetch tenant data by itself.

## 6. Mobile + native-app WebView

1. **Table-to-card algorithm:** at <640px render first `mobilePriority="primary"` as card heading, up to three `secondary` properties as labelled definition rows, keep status and up to two explicit actions, omit `hidden` *only when redundant*; make full record accessible via detail link. PII never appears in a mobile card if absent from desktop or unauthorized. Desktop `DataTable` remains a semantic table. Columns with no priority default to first as heading and remaining as labelled rows; audit dense 25+ column grids explicitly.
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
| `/learn` | dashboard → PageHeader StatTile Card |
| `/learn/courses` | directory → FilterBar DataTable-as-cards Pagination |
| `/learn/courses/[deliveryId]` | detail → Breadcrumbs Tabs Card |
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
| `/college/people` | directory → FilterBar DataTable Pagination |
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
- Directory: `src/app/(authenticated)/college/contacts/page.tsx` (College Admin).
- Form: `src/app/(authenticated)/teacher/profile/details/page.tsx` (Faculty).
- Detail with tabs: `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` (Mentor).
- Dashboard: `src/app/(authenticated)/tpo/home/page.tsx` (TPO).

Do not tick other lanes' UX checklists until a browser audit actually passes. These four pages are patterns, not fixtures; keep their original permission/data integrations and exact legacy wording.
