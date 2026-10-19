# UI Clone Audit — B1 Top Bar and B2 Notification Drawer / Command Palette

Checked: 2026-10-19. Owner: chat-13. Branch: `chatgpt/chat-13-b`.
**Strict rule:** `docs/design/ui-clone-checklist.md`, lines 8–15. A row marked *matched* is source-level evidence for that property **only**, not a category tick. No B1/B2 item is checked off without **all** values, all states, full-repository coverage, responsive behavior, and regression proof. Section J visual comparison is separately pending.

## B1 — topbar geometry, controls and account switching

- [ ] B1: topbar (missing: all-portals Messages destinations and authoritative unread counts; source coverage is not zero; inactive/disabled/loading/error/empty states of every portal not all matched; no rendered responsive and no-regression validation).

| Property or state | Legacy value + file:line | vNext value + file:line | Source result |
| --- | --- | --- | --- |
| Header desktop height | 68px and min-height 68px — `docs/design/old-lms-shell.css:56` | 68px/68px — `src/components/shell/topbar/topbar.module.css:18-19` | Matched |
| Header border | 1px #e7ecf2 — `old-lms-shell.css:56` | 1px `--lms-header-border` — `topbar.module.css:24`, resolves to #e7ecf2 — `src/app/globals.css:321` | Matched |
| Header shadow | `0 1px 3px rgba(26,45,72,.035)` — `old-lms-shell.css:56` | `--lms-header-shadow` — `topbar.module.css:25`, same token — `globals.css:331` | Matched |
| Header background | White — `old-lms-shell-spec.md:14-16` | `--lms-white` — `topbar.module.css:23`, #ffffff — `globals.css:37` | Matched |
| Desktop header gap | 18px — `old-lms-shell.css:56` | 18px — `topbar.module.css:17` | Matched |
| Desktop header padding | `0 20px` — `old-lms-shell.css:56` | `0 20px` — `topbar.module.css:21` | Matched |
| Command grid | `auto minmax(220px,380px) 1fr`, 12px gap, flex auto — `old-lms-shell.css:57` | Same — `topbar.module.css:27`; children New/search/notifications — `legacy-topbar.tsx:39-54` | Matched for TPO with New |
| Search field | 291px width; 36px height; `#f8fafc` fill; radius 9 — `old-lms-shell-spec.md:15-17` | `topbar.module.css:4,29-30`, radius via `globals.css:326` | Matched |
| Search placeholder | `Find a student, recruiter or company` — `old-lms-shell-spec.md:16` | Same for TPO — `portal-config.ts:42-45`; other portal-specific copy differs intentionally | TPO matched, all-portals not proven |
| Ctrl K hint | Muted `rgb(91,107,130)` — `old-lms-shell.css:58` | `#5b6b82` — `topbar.module.css:5,33`; markup `command-search.tsx:137` | Matched source value |
| Shortcut behavior | `Ctrl K` hint — `old-lms-shell-spec.md:16`; exact behavioral source not extracted | Ctrl/Meta K and Escape — `command-search.tsx:66-88`, ArrowUp/Down and typing — `command-search.tsx:123-173` | Incomplete legacy behavior comparison |
| New default | 82×36, radius 9, solid #0a7c88/white, 14px/650 — `old-lms-shell-spec.md:16,25` | `topbar.module.css:40`; tokens `globals.css:17,37,326` | Matched |
| New hover | Legacy hover #086873 — `old-lms-shell-spec.md:25`; generic button state `legacy-styles/components___button.scss:9-13` | `topbar.module.css:41`, `globals.css:18` | Matched value; animation not proven |
| New active/focus/disabled/loading | Base button states — `legacy-styles/components___button.scss:9-28,83-88` | Focus `topbar.module.css:90,126`; no common New pending/disabled/error state — `legacy-topbar.tsx:37-53` | **Missing complete state parity** |
| Message and notification icons | 36px secondary buttons — `old-lms-shell-spec.md:16` | 36px — `topbar.module.css:43,55-57`; TPO message + bell — `tpo-notification-cluster.tsx:40-65` | TPO geometry matched; not all portals have Messages |
| Badge numeric typography | 10px; 16px minimum — `legacy-styles/components___notification-drawer.scss:52-60` | 10px/16px — `topbar.module.css:45` | Matched |
| Unread color | Warm #ff7576 legacy red dot — `legacy-styles/components___dropdown.scss:16-23` | `--topbar-unread:#ff7576` — `topbar.module.css:8,45,59` | Matched topbar header count color; see B2 row dots |
| Unread actual data | Legacy role badge tied to inbox — `legacy-styles/components___notification-drawer.scss:52-60` | TPO validated snapshot — `tpo-notification-cluster.tsx:10-41`; generic max 40, no Messages route in some roles — `notification-actions.tsx:40-90` | **Coverage incomplete** |
| Organization label | Max-width 260; 12px weight 600, #334155 — `old-lms-shell.css:61-62` | `topbar.module.css:3,47`; selected scope forwarded — `src/components/shell/app-shell.tsx:95-108` | Matched text measurements; dynamic behavior only partially verified |
| Avatar wrapper/icon | 42px/38px — `old-lms-shell.css:64,66` | 42px/38px — `topbar.module.css:48-49`, `account-menu.tsx:104-109` | Matched dimensions |
| Avatar actual initials/image | Legacy profile icon may contain image — `legacy-styles/components___header.scss:146-159` | Role/email-derived initials, no profile photo data — `portal-config.ts:93-103` | **Not an exact state clone** |
| Org switcher selector | Height ≥38px, radius 9, 1px #e7ecf2, no shadow — `old-lms-shell.css:63` | Shared native Select; `admin-scope-switcher.tsx:82-115` with min-height 40px, menu-only — `account-menu.tsx:114-124` | **Mismatch:** height and placement |
| Account menu desktop | Width ≤280px, radius 6, padding 16×24, shadow 9px 11px 28px rgba(0,0,0,.1) — `legacy-styles/components___dropdown.scss:96-113` | `topbar.module.css:51` | Matched shell values |
| Account dropdown mobile | ≤767px radius 14, padding 16 — `legacy-styles/components___dropdown.scss:116-127` | `topbar.module.css:137-144` | Matched radius/padding; overlay offset not proved |
| Account keyboard | Legacy profile/menu from dropdown SCSS, only styling measured — `legacy-styles/components___dropdown.scss:96-127` | Dialog focus, ArrowUp/Down/Home/End and Escape — `account-menu.tsx:38-73` | Behavior match not provable from SCSS alone |
| Account disabled/error/loading | Generic disabled legacy button — `legacy-styles/components___button.scss:84-88` | Disabled/aria-busy logout, pending text and error — `account-menu.tsx:84-130` | **Mismatch/unproved** for all states |
| Tablet 768–1199 | Gap10, pad14, grid `auto minmax(180px,1fr) auto`, max org 180 — `old-lms-shell.css:67-71` | `topbar.module.css:62-68` | Matched source layout |
| Phone ≤767 | Header min58, safe-area pad, gap8, search36, New38, avatar40/36 — `old-lms-shell.css:73-85` | `topbar.module.css:69-86` | Matched source values; behavior not screenshot-verified |

- [ ] B1: account menu and org/role switcher (missing: legacy 38px header org selector vs 40px in-menu native Select, profile image/initials state, account switcher responsive positions, exhaustive focus/hover/disabled error state comparison, and full coverage proof).

## B2 — notification drawer, unread state, command results panel

- [ ] B2: notifications dropdown and mobile drawer (missing: one shared role-consistent desktop-dropdown/mobile-drawer behavior, legacy grouping/mark-read/item states across roles, SCSS-based animations and empty/error/loading state parity, zero raw controls).
- [ ] B2: command palette (missing: the old LMS's full keyboard/empty/loading/search result reference; full coverage, no-regression and rendered phone/tablet parity proof).

| Property or state | Legacy value + file:line | vNext value + file:line | Result |
| --- | --- | --- | --- |
| Notification trigger default | Transparent, border none, 8px radius, 44×44 min, 200ms hover — `legacy-styles/components___notification-drawer.scss:27-49` | Header controls 36×36 outlined, 9px radius — `topbar.module.css:43,55-57`; TPO compact — `src/components/tpo/tpo-bell-panel.tsx:82-97` | **Different** (measured TPO header button vs generic drawer trigger) |
| Desktop notification popover | White, radius 12, shadow 0 4px 24px rgba(0,0,0,.06) + 0 1px 3px rgba(0,0,0,.04), #e5e9f0 border — `notification-drawer.scss:113-118` | HR/learner scoped panels — `topbar.module.css:103-108,167-176` | Matched CSS where adapter selector applies; TPO uses a shared `Drawer` |
| Panel width and max height | Min360 max420 viewport-24, max-height min(520px, viewport-120px) — `notification-drawer.scss:119-124` | `topbar.module.css:103-105` | Matched HR/learner declarations only |
| Panel show animation | 200ms translateY(-8px) ease-out — `notification-drawer.scss:125-147` | No matching dedicated animation in `topbar.module.css:103-109` | **Missing** |
| Desktop backdrop | fixed inset0, rgba(0,0,0,.08), z1050; hidden mobile — `notification-drawer.scss:64-109` | HR/learner inline sections; TPO shared Drawer — `notification-actions.tsx:28-36`, `tpo-bell-panel.tsx:97-116` | **Mismatch** |
| Drawer header | Padding 16px 20px; subtle #fafbfc; border #e5e9f0; rounded upper 12px — `notification-drawer.scss:153-159` | Scoped panel overrides — `topbar.module.css:192-198` | Matched when selector reaches header |
| Drawer heading | 18px/600, letter spacing -0.02em, line height1.3 — `notification-drawer.scss:161-168` | `topbar.module.css:110-112` | Matched selected panels |
| List inset | 0 12px padding — `notification-drawer.scss:180-184` | `topbar.module.css:200-205` | Matched HR/learner; TPO differs |
| List item gap + corners | 6px bottom, 8px radius, overflow hidden — `notification-drawer.scss:186-190` | `topbar.module.css:206-211` | Matched HR/learner |
| Item inner default | Padding 12×16, #fff, 8px radius, soft border, 200ms transitions — `notification-drawer.scss:192-204` | `topbar.module.css:213-220` | Partial: border alpha differs |
| Item hover | #fafbfc; soft shadow 0 1px 3px rgba(0,0,0,.04) — `notification-drawer.scss:206-210` | `topbar.module.css:221-226` | Matched declarations |
| Item active | rgba(0,0,0,.06); no shadow — `notification-drawer.scss:212-215` | `topbar.module.css:228-232` | Matched declarations |
| Item focus visible | 1px neutral-500 outline, offset1 — `notification-drawer.scss:217-224` | `topbar.module.css:233-237`; earlier teal selector `topbar.module.css:114-115` | **Competing declarations; need computed verification** |
| Unread dot | Warm red legacy inactive badge — `legacy-styles/components___dropdown.scss:16-23` | TPO row dot teal `bg-primary` — `tpo-bell-panel.tsx:102-110` | **Mismatch** |
| Item title | 14px/600 line height1.4 — `notification-drawer.scss:233-238` | HR/learner list title default not exhaustively sourced; TPO row font-medium — `tpo-bell-panel.tsx:102-111` | **Mismatch/incomplete** |
| Snippet | 14px line height1.5, 2-line clamp — `notification-drawer.scss:240-248` | `topbar.module.css:244-249` sets line height only, no two-line clamp | **Missing** |
| Timestamp | 12px, neutral-400 — `notification-drawer.scss:258-261` | `topbar.module.css:239-243` | Matched CSS for time elements |
| Mark-all-read | Legacy footer action min44 — `notification-drawer.scss:323-356` | TPO mark-all API/button — `tpo-bell-panel.tsx:69-79,113-115`; other roles independent | **Partial; not unified** |
| Grouping | Legacy event grouping/list structure — `notification-drawer.scss:180-269` | TPO `displayedItems.slice(0,20)` ungrouped — `tpo-bell-panel.tsx:100-112` | **Missing grouping parity** |
| Loading | Centered 32px 20px, 12px gap, 14px muted — `notification-drawer.scss:272-291` | TPO inline refreshing paragraph — `tpo-bell-panel.tsx:99-101` | **Mismatch** |
| Error | Centered 32px 20px, muted 14px — `notification-drawer.scss:293-299` | TPO inline error text — `tpo-bell-panel.tsx:115` | **Mismatch** |
| Empty | Centered 32px 20px, icon 36px, explanatory text — `notification-drawer.scss:301-321` | TPO "Nothing yet" inline — `tpo-bell-panel.tsx:100-101` | **Mismatch** |
| Mobile panel | Full width, safe-area padding, 44px close, flex column, scroll body — `notification-drawer.scss:400-445` | HR/learner mobile sections scoped `topbar.module.css:120-123,251-260`; TPO `Drawer` wrapper — `tpo-bell-panel.tsx:97-116` | **Incomplete per role** |
| Command palette wrapper | Legacy global search border #f1f4f9/radius12 — `legacy-styles/components___dropdown.scss:157-163` | `topbar.module.css:35` | Matched border/corners |
| Command result item | Legacy drawer row 14px / 8px radius / 12×16 — `notification-drawer.scss:192-205,233-238` (proxy; no complete command palette SCSS) | `topbar.module.css:36-39,157-161` | Proxy only — **not exact command palette evidence** |
| Command hover/active/focus | #fafbfc hover, rgba(0,0,0,.06) active, 1px neutral outline — `notification-drawer.scss:206-224` (proxy) | `topbar.module.css:37-39` | Proxy only; no original command-result states |
| Command keyboard | Search hint in shell — `old-lms-shell.css:58` | Ctrl/Meta+K, ArrowUp/Down, printable typing, Backspace, Home/End, Escape — `command-search.tsx:65-88,123-173` | Improved; original action map not available |
| Command no match / loading error | No legacy command palette state rules in supplied SCSS — `legacy-styles/components___dropdown.scss:157-184` | Course error and no-result text — `command-search.tsx:175-207` | **Cannot verify exact** |

## COVERAGE PROOF / STRICT GREP GATE

The repository is accessed through the connected GitHub file API, **not a mounted git checkout**. A complete shell `grep` or `rg` of the entire `src` tree was **not executed** and no zero-count claim is made. The following source-content scan fetched all 10 `.ts/`.tsx files under `src/components/shell/topbar` plus `app-shell.tsx`, `admin-scope-switcher.tsx`, `membership-switcher.tsx`, `tpo-bell-panel.tsx`, `hr-recruiter-bell.tsx`, and `learner-notification-bell.tsx` (16 files) from the same branch and counted these equivalent patterns:

| Pattern equivalent to grep | Hits in those 16 files | Explicit exemptions / blockers |
| --- | ---: | --- |
| `grep -rnE '<button([ >])' [16-file scope]` | **6** | 2 in `topbar/account-menu.tsx` (custom avatar/logout), 1 TPO trigger, 3 learner bell controls; **not zero** |
| `grep -rnE '<input([ >])' [16-file scope]` | **1** | Specialized combobox text input `command-search.tsx:122-137`; **not zero** |
| `grep -rnE '<select([ >])' [16-file scope]` | **0** | Only scoped count, not full `src` |
| `grep -rnE '<textarea([ >])' [16-file scope]` | **0** | Only scoped count |
| `grep -rn 'fixed inset-0' [16-file scope]` | **0** | Other imported overlays outside scope unresolved |
| `grep -rn 'role="dialog"' [16-file scope]` | **9 textual occurrences** | Includes selector strings as well as JSX; not a DOM-instance count |
| `grep -rnE '#[0-9a-fA-F]{3,8}' [16-file scope]` | **0** | CSS module outside scanned TSX contains legacy hex literals — `topbar.module.css:3-11,35-39,183-259`; shared-theme color-only policy remains unproved |
| `grep -rn '<Drawer' [16-file scope]` | **1** | TPO bell uses shared Drawer; recruiter/learner overlays remain independent |

These are **GitHub source scans**, not executed shell commands. Re-run the following on a checked-out branch before ticking:
```sh
grep -rnE '<(button|input|select|textarea)([ >])' src --include='*.tsx'
grep -rnE 'fixed inset-0|role="dialog"|<Drawer' src --include='*.tsx'
grep -rnE '#[0-9a-fA-F]{3,8}' src --include='*.tsx' --include='*.css'
grep -rnE 'rounded-\[[^"]+\]-\[' src --include='*.tsx'
```

## REGRESSION / RESPONSIVE / JSX GATE

- Source checks of touched files: no malformed `</Select` token, no mismatched `<Button>/</Button>` pairs in reviewed files, CSS curly braces balanced; **no TypeScript compiler or JSX parser run**.
- Tablet and phone CSS property rows cite `old-lms-shell.css:67-85` and `topbar.module.css:62-86`. CSS rules are compared, but **browser-computed layout and interactive mobile drawer behavior are not proved**.
- Some portal New or Messages routes are intentionally absent in `portal-config.ts:1-70`; do not create unauthorized routes or fake unread counts to satisfy a visual checkbox.
- No runtime, tests, app launch, screenshot diff, or CI. Section J remains separately pending.

**Strict decision: B1 ☐, B2 ☐.** Both are **unticked** because matching a subset of styling rows does not meet all four checklist conditions.


## 2026-10-19 continuation — 100 new chat-13 commits

**Scope synced:** At start, `chatgpt/chat-13-b` was fast-forwarded from `2220b5141877` to then-current `main` `df7de72e7f63`. The subsequent 100 commits were confirmed with a compare from that merge base; later concurrent mainline merges may change ahead/behind counts. **No CI or app execution.**

### Updated B1 measured-value and state proof

| Item/state | Legacy file:line and exact value | Current vNext file:line and effective value | Result |
| --- | --- | --- | --- |
| Header default | `old-lms-shell.css:56`: 68px, gap18, pad 0 20, 1px #e7ecf2 bottom, 0 1px 3px rgba(26,45,72,.035) | `topbar.module.css:12-25`, `src/app/globals.css:321,331`: corresponding values | Matched source values |
| Tablet layout | `old-lms-shell.css:67-71`: 768–1199px, gap10, pad14, search grid min180, organization 170–190 | `topbar.module.css:62-68,446-450`: same breakpoint and grid, org trigger 170–190 | Matched declarations; runtime unresolved |
| Phone layout | `old-lms-shell.css:73-85`: 767px boundary, 58px min header, safe-area, New38, avatar40/36 | `topbar.module.css:69-86`: same dimensions; `:452-455` hides header org chooser, leaving account-menu chooser | Matched most geometry; focus and menu still unverified on a phone |
| Header organization selector default | `old-lms-shell.css:61-63`: #334155, 12px/600, max260, selector min-height38, border #e7ecf2/radius9, no shadow | `organization-switcher.tsx:46-65`, `topbar.module.css:415-444`: authorized `Button` + popover, 38px/min and corresponding values | Source values matched; old LMS switcher position/context menu shape still differ |
| Header org hover/pressed/focus | `old-lms-shell.css:63` + generic `legacy-styles/components___button.scss` hover/focus states | `topbar.module.css:429-435`: neutral hover, pressed fill, teal visible focus | Not fully verified against precise original trigger SCSS |
| Org popover default | `legacy-styles/components___dropdown.scss:96-126`: max 280px, 6px radius, shadow 9px 11px 28px rgba(0,0,0,.1), mobile 14px | `topbar.module.css:437-455`: same desktop width/radius/shadow; phone header trigger hidden | Surface values matched, open/close animation and phone access need integration proof |
| Org chooser focus and activation | `old-lms-shell.css:63`: native AntD 38px control, disabled and focus defaults in `legacy-styles` | `organization-switcher.tsx:28-66`: focus into chooser, Escape, outside click, ArrowDown and focus-out; `topbar.module.css:457-477` styles native select | Interaction source improved; no browser/no-regression proof |
| Avatar and account menu default | `old-lms-shell.css:64-66`: 42/38px; `legacy-styles/components___dropdown.scss:96-126` dropdown 280px/radius6/shadow/padding | `topbar.module.css:48-53`, `account-menu.tsx:105-129`: `Button` avatar and logout, same dropdown shell tokens | Geometry matched; image and account-menu content remain distinct |
| Account menu disabled/loading | `legacy-styles/components___button.scss:83-88`: disabled/inactive visual | `account-menu.tsx:125-128`: shared ghost `Button` disabled + aria-busy pending | Full legacy state parity not proven |
| Command search input | `old-lms-shell-spec.md:15-17`: 291×36, search pale #f8fafc; `old-lms-shell.css:58`: Ctrl-K muted | `command-search.tsx:123-138`: shared `Input` combobox; `topbar.module.css:29-34,484-493` restores field sizing | Default source values matched; command result behavior not fully proven |

### Updated B2 notification and palette comparison

| Item/state | Legacy source file:line | vNext source file:line | Result |
| --- | --- | --- | --- |
| Desktop popover | `legacy-styles/components___notification-drawer.scss:113-124`: white/radius12/1px #e5e9f0; max420, max-height520; layered shadow | `topbar.module.css:322-342`: scoped TPO Drawer skin 420px, 12px, shadow; HR/learner adapters `:103-108` | Surface declaration closer; modal vs dropdown anchoring still different |
| Drawer header | `notification-drawer.scss:153-168`: padding16×20, neutral50, 18px/600 title | `topbar.module.css:343-358`: same dimensions and color roles | CSS match; exact browser cascade unverified |
| Drawer body | `notification-drawer.scss:170-184`: scroll region, hidden scrollbar, 12px vertical, list inset12 | `topbar.module.css:360-372`: same design on TPO shared Drawer body | CSS match; ScrollCue inner structure needs visual verification |
| Row default | `notification-drawer.scss:186-204`: gap6/radius8, padding12×16, two-state border | `tpo-bell-panel.tsx:103-113`, `topbar.module.css:381-393`: row layout, 8px, spacing, hover/active/focus | Matched parts, check exact border alpha and portal variants |
| Title/snippet | `notification-drawer.scss:233-248`: 14px/600/1.4 title, 14px/1.5 snippet with 2-line clamp | `tpo-bell-panel.tsx:107-110`: exact title/snippet typography and clamp | TPO matched declarations; other portal markup differs |
| Empty/loading/error | `notification-drawer.scss:272-321`: centered 32×20, gap12, 14px muted | `tpo-bell-panel.tsx:102-117`, `topbar.module.css:374-379` | **Still differs**: inline messages versus full legacy centered state cards |
| Desktop animation | `notification-drawer.scss:125-147`: enter translateY(-8px) 200ms ease-out | `topbar.module.css:322-342` has no equivalent animation on shared `Drawer` | **Missing** |
| Mobile drawer | `notification-drawer.scss:400-445`: full width, safe areas, 44px close | `topbar.module.css:396-413`: full-width compact TPO drawer with safe-area header; shared Drawer has 44px close | CSS largely matches; native dialog anchoring not proven |
| Command input keyboard | `old-lms-shell.css:58`, `legacy-styles/components___dropdown.scss:157-184`: Ctrl-K and search dropdown | `command-search.tsx:66-88,123-174`: search combobox ArrowUp/Down/Home/End, typing, Backspace/Escape | VNext behavior implemented; precise old behavior not exhaustively sourced |
| Grouping/mark all/read receipt | `notification-drawer.scss:180-269,323-355`: grouped list, mark-all footer | `tpo-bell-panel.tsx:20-79,103-117`: server mark-read, mark-all, ungrouped recent list | **Mismatch:** grouping and shared footer composition |

### Fresh scoped grep-equivalent results (after 100 commits)

Connected GitHub source retrieval is **not** a shell checkout. Two GitHub fetch batches inspected all **17 files**: 11 `.ts/.tsx` files in `src/components/shell/topbar`, plus `app-shell.tsx`, `admin-scope-switcher.tsx`, `membership-switcher.tsx`, `tpo-bell-panel.tsx`, `hr-recruiter-bell.tsx`, `learner-notification-bell.tsx`. The equivalents to these exact grep patterns returned:

| Required grep command (scope is the 17 listed files, not whole src) | Source-scan hits | Proof / limitation |
| --- | ---: | --- |
| `grep -rnE '<button([ >])' [17-file scope]` | 0 | Header avatar, org chooser, TPO and learner bell triggers converted to shared `Button` |
| `grep -rnE '<input([ >])' [17-file scope]` | 0 | Header search converted to shared `Input` |
| `grep -rnE '<select([ >])' [17-file scope]` | 0 | All selectors are shared `Select` |
| `grep -rnE '<textarea([ >])' [17-file scope]` | 0 | None needed in header scope |
| `grep -rn 'fixed inset-0' [17-file scope]` | 0 | Shared Drawer uses its own overlay; other dialogs may be outside this scope |
| `grep -rn 'role="dialog"' [17-file scope]` | 9 textual matches | Includes 6 selector strings in account menu; JSX still uses hand-rolled account/org/learner dialogs, so **strict overlay coverage fails** |
| `grep -rnE '#[0-9a-fA-F]{3,8}' src/components/shell/topbar/topbar.module.css` | 51 | Existing legacy hex literals still outside globals/shared UI, **strict hardcoded-color gate fails** |

**Full-repository `grep`/zero-instance proof was not executed**: source was available only via the connected GitHub API. Do not elevate the scoped zero counts to all of `src`. No build, TypeScript compiler, browser, CI, runtime or screenshot validation occurred.

### First-third Super Admin shared-component continuation

- College creation: `src/components/admin/college-create-form.tsx:92-175`, shared Input/Select/Button, pending field lock, ARIA busy/help association, shared Button loading.
- Bulk college import: `src/components/admin/college-bulk-import.tsx`, expanded panel association, pending form lock, CSV validation/help, spinner and result region. No business/API semantics rewritten.
- College edit: `src/components/admin/college-edit-dialog.tsx`, shared dialog/buttons/inputs now disable while pending with named autofill and shared loading.
- Academic first-third: `src/components/academics/academics-overview.tsx:68-380`, four shared teal code labels, four `DataTable` captions, and explicitly labelled periods/programs sections.

### Strict tick outcome — unchanged

- [ ] **B1 top bar** (missing: whole-`src` coverage and all-portal Messages/unread provenance, old LMS states and mobile browser proof).
- [ ] **B1 account/org switcher** (missing: rendered placement, legacy full state matrix, shared overlay coverage).
- [ ] **B2 notifications drawer** (missing: grouping, exact empty/loading/error, desktop dropdown behavior, unified portal coverage).
- [ ] **B2 command palette** (missing: complete original-result SCSS/action reference, responsive and regressions proof).


## Bounded continuation — 2026-10-19, chat-13

**Starting sync:** merged `main` at `d915bd67b208` into this lane before editing. No CI, TypeScript compiler, browser session, screenshot comparison or full-repository shell grep was run. Every source claim below is limited to the named fetched files; visual verification remains section J.

### B2 notification value/state delta — source references

| Property / state | Legacy evidence | vNext evidence after this turn | Strict result |
| --- | --- | --- | --- |
| Repeated overrides | One notification rule group in `docs/design/legacy-styles/components___notification-drawer.scss:113-147` | Removed duplicate topbar notification/switcher declarations in `src/components/shell/topbar/topbar.module.css` immediately above `:322` | Duplicate removed; browser-computed cascade unverified |
| Panel entry | Opacity 0→1, translateY(-8px)→0, 200ms ease-out — `components___notification-drawer.scss:125-147` | `topbar.module.css:436-443`, desktop only, reduced motion guarded | CSS values match; native dialog placement still differs |
| Backdrop entry | 150ms ease-out, rgba(0,0,0,.08) — `components___notification-drawer.scss:64-109` | `topbar.module.css:435,445-450` | Color and animation values matched for TPO modal; DOM/portal differs |
| Reduced motion | Panel/backdrop animations disabled when reduced — `components___notification-drawer.scss:125-147` | `topbar.module.css:452-457` | Matched scoped declaration |
| Loading | Centered, padding 32px 20px, 14px, gap12 — `components___notification-drawer.scss:272-291` | `topbar.module.css:464-468`; `src/components/tpo/tpo-bell-panel.tsx:113` | Matched layout values for TPO; other portals and progress icon unresolved |
| Empty | 32px 20px, 36px icon, explanatory body — `components___notification-drawer.scss:301-321` | `topbar.module.css:464-468`; `tpo-bell-panel.tsx:114` | **Missing** legacy empty icon and portal-wide state parity |
| Error | Centered 32px 20px, muted 14px — `components___notification-drawer.scss:293-299` | `topbar.module.css:480`, `tpo-bell-panel.tsx:129` | TPO centered/error role, but error color differs from old muted text |
| Notification day grouping | Nested list/item roles, 12px list inset, 6px gap — `components___notification-drawer.scss:180-190` | IST dates grouped, nested `ul[role=list]` with matching closing tags — `tpo-bell-panel.tsx:21-30,115-127` | New grouping functional source; exact old grouping labels **unverified** |
| Notification footer | 12px 20px, light neutral background, top border — `components___notification-drawer.scss:323-356` | Shared `Drawer.footer` `tpo-bell-panel.tsx:110-112`, CSS `topbar.module.css:471-473` | Structural/spacing match for TPO; role consistency still missing |
| Footer loading/action states | Mark-all action and minimum 44px — `components___notification-drawer.scss:323-356` | TPO refresh and mark-all use shared `Button.loading`, navigation dismisses drawer — `tpo-bell-panel.tsx:110-112` | Source improvement; rendered state not proven |
| Mobile panel | 100% width, safe-area top/bottom, 44px close — `components___notification-drawer.scss:400-445` | `topbar.module.css:396-413,471-473`, shared Drawer close from `src/components/ui/drawer.tsx` | Rules checked; screenshot/touch/keyboard proof still missing |

### B2 command results state delta

| State | Legacy reference | vNext source | Result |
| --- | --- | --- | --- |
| Search hint | `docs/design/old-lms-shell.css:56-60` — Ctrl K | `command-search.tsx:123-138` | Matched label |
| Learner results fetching | Legacy loading state not specified in command result SCSS `legacy-styles/components___dropdown.scss:155-184` | `command-search.tsx:24,35-53,179-180` explicit loading/loaded/error | **Cannot tick without legacy state source** |
| TPO async record lookup | Legacy command palette suggestions not enumerated in old SCSS | `command-search.tsx:181-212` suppress false “no matches” while TPO lookup is pending | Improved; no exact baseline |
| No matching commands | Legacy command palette empty wording/style absent from reference | `command-search.tsx:209-213`, `role=status` | Accessible but unmatched reference |

### Strict scoped source counts / syntax review

From connected GitHub source reads of the current `chatgpt/chat-13-b` branch, **not a repository-wide command execution**:

| Scoped equivalent command | Count | Notes |
| --- | ---: | --- |
| `grep -E '<button([ >])|<input([ >])' src/components/shell/topbar/{account-menu,command-search,legacy-topbar,organization-switcher}.tsx src/components/tpo/tpo-bell-panel.tsx` | 0 | Shared `Button`/`Input` remain; not a full-`src` claim |
| `grep -E '</Select([^>]|$)|</Button([^>]|$)' [changed TSX files]` | 0 | Checked changed JSX names and closing pairs |
| `grep -E 'rounded-\\[[^"]+\\]-\\[' [changed TSX files]` | 0 observed in scoped source review | Full-repository scan not run |
| `grep -E '#[0-9a-fA-F]{3,8}' src/components/shell/topbar/topbar.module.css` | Nonzero | Old values intentionally remain hard-coded in component CSS, failing strict shared-token gate |
| `grep -E 'role="dialog"|<Drawer' [topbar/notification files]` | Nonzero | Hand-rolled account/org/learner overlay and modal TPO bell remain |

**Source-only JSX review:** The changed TPO list has exactly two nested `<ul></ul>` pairs and two `<li></li>` pairs, each constructed inside its respective map; the edited shared `<Button></Button>` pairs and CSS curly braces balanced. No parsed TSX/typecheck or runtime proof.

### Work queue for next bounded turn

- [ ] **B1 top bar:** inspect all portal message destinations/count API provenance; shared token/hard-coded-color cleanup and real tablet/phone review.
- [ ] **B1 account/org switcher:** `src/components/shell/topbar/account-menu.tsx` + `organization-switcher.tsx`: replace hand-rolled popovers only where a shared nonmodal primitive supports the old UX, then measure all open/hover/focus/disabled states.
- [ ] **B2 notification drawer:** next file **`src/components/shell/learner-notification-bell.tsx`**; currently a custom dialog with role-specific list and partially incompatible mobile styling. Follow with recruiter bell and TPO desktop anchor positioning.
- [ ] **B2 command palette:** `src/components/shell/topbar/command-search.tsx`; find complete old result reference or keep unticked, and perform mobile/keyboard regression checks.

**Strict tick outcome remains:** B1 top bar ☐; B1 account/org switcher ☐; B2 notification drawer ☐; B2 command palette ☐. Properties fixed here do not waive the strict coverage, responsive, state, and regression gates.


## Bounded turn — 2026-10-19, learner notification and shared-popover pass

**Base:** fast-forwarded chat-13 to `origin/main` at `55a3efe0a591` before modifying any files. Source checking only; no CI, app launch, TypeScript compiler or browser-computed styles. Audit reflects the current branch after these edits.

| Value / state | Old LMS reference (file:line) | vNext after this turn (file:line) | Comparison |
| --- | --- | --- | --- |
| Learner desktop notification panel geometry | `docs/design/legacy-styles/components___notification-drawer.scss:113-124`: border #e5e9f0, 12px radius, 360px minimum/420px maximum width, 520px maximum height, layered shadow | `src/components/shell/topbar/topbar.module.css:482-505` (learner panel rule at end of CSS), shared `PopoverPanel` at `src/components/shell/learner-notification-bell.tsx:81` | CSS values matched; positioning relative to viewport not browser-verified |
| Learner panel header | `components___notification-drawer.scss:153-168`: 16px 20px, #fafbfc, #e5e9f0 separator | `topbar.module.css` `.learnerNotificationPopover > div:first-child`, `learner-notification-bell.tsx:82-86` | Source values match |
| Learner row/list | `components___notification-drawer.scss:180-224`: 12px inset, 6px item gap, 8px radius, 12px 16px cell, hover #fafbfc, active rgba(0,0,0,.06), focus neutral-500 | `topbar.module.css` learner list selectors, `learner-notification-bell.tsx:99-119` | Source values matched, due-soon callouts remain intentionally distinct |
| Learner preview | `components___notification-drawer.scss:233-261`: 14px body, 1.5 line-height, clamp 2, 12px date | `learner-notification-bell.tsx:113-117`: line-clamp-2, 1.5 and dated IST `<time>` | Matched body treatment; exact font inherited and browser validation outstanding |
| Open/close semantics | Desktop dropdown is nonmodal, mobile drawer — `components___notification-drawer.scss:1-5,400-445` | Shared `PopoverPanel` at `learner-notification-bell.tsx:81,125`, `src/components/ui/popover.tsx:15-21` owns role/dialog/nonmodal semantics, Escape/outside-click remain in learner bell | Hand-rolled JSX overlay removed; mobile still CSS-backed popover, not shared mobile Drawer |
| Learner loading/error/empty | `components___notification-drawer.scss:272-321` centered, 32px 20px, 14px text, error and empty icon | `learner-notification-bell.tsx:87-94` busy, loading, retry and empty status; `topbar.module.css` `[data-learner-notification-state]` | Centering/padding closer; legacy empty icon still absent, **not matched** |
| Learner trigger badge | `components___notification-drawer.scss:27-60` min 44px trigger, 16px count, 10px text | `learner-notification-bell.tsx:73-80` 44px trigger, 16px warm-red badge | Source values match; visual states not rendered |
| Account menu semantic wrapper | `docs/design/legacy-styles/components___dropdown.scss:96-126` nonmodal profile popup, 280px, desktop radius 6px, mobile radius 14px | `src/components/shell/topbar/account-menu.tsx:112-132` now shared `PopoverPanel` and `topbar.module.css:51,140` existing shell | Shared wrapper; content, focus order and all states not fully proven |
| Org chooser semantic wrapper | `old-lms-shell.css:61-63` selector 38px, border #e7ecf2, radius 9px | `organization-switcher.tsx:53-67` now shared `PopoverPanel`, existing selector CSS `topbar.module.css:355-418` | Source values aligned, tablet/phone rendering unverified |

### Scoped coverage and JSX evidence

Fetched all **17 topbar-related .ts/.tsx files**, covering 11 under `src/components/shell/topbar/` and six shell/bell integration files. This is a source-level equivalent of:
`grep -rnE '<(button|input|select|textarea)([ >])' [17 fetched files]` → **0**.
`grep -rn 'role="dialog"' [17 fetched files]` → **6 textual matches** (all in selector string literals within `account-menu.tsx`, not JSX opening tags). Shared `PopoverPanel` owns actual dialog markup.
All edited `Button`/`PopoverPanel` opening and closing tags were counted after each change. However, this is **not a full-repository grep** and the CSS still contains many literal legacy colors outside `globals.css`/`src/components/ui`; the strict coverage gate is not satisfied.

### Responsive proof and limitations

The old learner notification mobile breakpoint is **767px** (`components___notification-drawer.scss:400-445`). `topbar.module.css` now has a corresponding `max-width:767px` learner panel rule: width 100vw, height constrained to the visual viewport, safe-area top, 44px action targets, and reduced-motion behavior. Tablet panel width is constrained at 768–1199px. This establishes source-rule comparison only; **no rendered phone/tablet proof** is available.

- [ ] **B1 top bar:** full-route Messages destinations/real unread counts and full-repository grep still missing.
- [ ] **B1 account/org:** shared PopoverPanel achieved; remaining exact SCSS menu states, photo/initials, and rendered responsive/focus proof.
- [ ] **B2 notifications:** learner panel migrated; recruiter remains a separate renderer, TPO desktop uses native Drawer, mobile shared-Drawer parity and exact empty/error icon unresolved.
- [ ] **B2 command palette:** legacy search-result state reference and rendered keyboard/mobile no-regression check absent.

**Exact next file:** `src/components/hr/hr-recruiter-bell.tsx` — match notification list/hover/error/empty and migrate remaining custom overlay to shared popover without changing unread provenance. All four strict items remain unticked.


## Recruiter notification continuation — 2026-10-19, chat-13 bounded turn

Synced to `origin/main` at `60f960b7816e` before the sprint batch. The recruiter bell is the next B2 page from the previous queue. This source-only comparison **does not tick B1 or B2** without global grep and actual desktop/tablet/mobile state proof.

| B2 state / measured property | Old LMS reference | vNext source, exact behavior | Result |
| --- | --- | --- | --- |
| Desktop overlay | `docs/design/legacy-styles/components___notification-drawer.scss:113-147`: white, 12px radius, border #e5e9f0, width 360–420, max-height 520, two-layer shadow, 200ms entry | `src/components/hr/hr-recruiter-bell.tsx:112-121` uses shared nonmodal `PopoverPanel`; `src/components/shell/topbar/topbar.module.css:506-507,525` matches desktop panel sizing, surface and animation | Matched CSS source; anchored viewport and browser focus not proven |
| Desktop header | `notification-drawer.scss:153-168`: 16px 20px padding, neutral50, border neutral200, 18px/600 title | `topbar.module.css:508-511`, `hr-recruiter-bell.tsx:115-119` | Matched values |
| Scroll body | `notification-drawer.scss:170-184`: min-height 0, scroll Y, 12px vertical padding, no visible scrollbar | `topbar.module.css:512-513`, shared `ScrollCue` content remains in `hr-recruiter-bell.tsx:98-103` | CSS source matched; nested max-height 320px remains intentionally smaller than full 520px panel |
| Notification list | `notification-drawer.scss:180-224`: 12px horizontal inset, 6px gap, radius8, 12px 16px, 44px target, neutral hover/pressed/focus | `topbar.module.css:515-524` and `hr-recruiter-bell.tsx:98-103`; shared list/row links | Matched property declarations, not screenshot |
| Unread/timestamp | `notification-drawer.scss:52-60,233-261`: 16px count, 10px font, 14px/600 title, 12px subtle timestamp; warm red legacy `components___dropdown.scss:16-23` | `hr-recruiter-bell.tsx:101-111`: 16px warm-red count, 14px/600 label, `<time>` relative timestamp, unread red dot | Matched sourced values; actual unread totals remain role-server data |
| Footer | `notification-drawer.scss:323-356`: 12px 20px, top hairline, subtle surface, minimum 44px controls | `hr-recruiter-bell.tsx:86-92,112-121` uses fixed popover footer or shared `Drawer.footer`; `topbar.module.css:529-534` | Matched source styling/structure |
| Phone | `notification-drawer.scss:400-445`: mobile ≤767, full-width Drawer, safe-area header/footer, 44px actions | `hr-recruiter-bell.tsx:50-55,112-121` switches on matchMedia 767; `topbar.module.css:527,534,536` and shared `Drawer` control safe areas | Responsive source-rule evidence only, no 320/375/768px browser test |
| Loading/error/empty | `notification-drawer.scss:272-321`: centered 32px 20px, 14px muted text and empty icon | `hr-recruiter-bell.tsx:94-100` retains server state gating; `topbar.module.css:537-538` centers empty/error states | **Partial:** legacy empty icon and exact explanatory copy missing |
| Dismissal/focus | Legacy desktop outside backdrop/ESC and mobile modal — `notification-drawer.scss:64-109,400-445` | Desktop outside pointer + Escape with focus return `hr-recruiter-bell.tsx:57-69`; mobile shared `Drawer` Escape/backdrop handling | Source semantics closer; exact focus timing not browser-proven |

**Scoped grep-equivalent verification (GitHub file content, not executed shell grep):** `src/components/hr/hr-recruiter-bell.tsx` has **0** native `<button>`, `<input>`, `<select>` and `<textarea>`; exactly one `<PopoverPanel></PopoverPanel>`, one `<Drawer></Drawer>`, and three matching `<Button></Button>` pairs. Edited `topbar.module.css` curly braces balance. Re-read the changed JSX after every open/close conversion and fixed a malformed root opening tag before proceeding. CSS includes hard-coded legacy hex values, so global token-zero evidence **does not pass**; full-`src` greps are unrun.

**STRICT TICK DECISION:** all four `clone-topbar.md` categories remain **unticked**: global grep, desktop/mobile rendered proof, all-portal count provenance, and exact missing legacy state behavior cannot be truthfully certified without integration and screenshot evidence.

**Next file:** `src/components/shell/topbar/command-search.tsx` — finish command palette empty/error/open/focus states and align its popover geometry to the legacy CSS, then update B2 evidence.


## 2026-10-19 final source sweep — chat-13

### B1 exact topbar comparison after token migration

| Property/state | Legacy CSS/SCSS reference (file:line) | Current vNext source (file:line) | Result |
| --- | --- | --- | --- |
| Header height and gap | `docs/design/old-lms-shell.css:56` — 68px; gap 18px | `src/components/shell/topbar/topbar.module.css:14-22` — 68px; gap 18px | Source matched |
| Header border and shadow | `old-lms-shell.css:56` — 1px #e7ecf2; 0 1px 3px rgba(26,45,72,.035) | `topbar.module.css:24-25`, `src/app/globals.css:328,340-350` | Source matched |
| Command layout | `old-lms-shell.css:57` — auto minmax(220px,380px) 1fr; gap12px | `topbar.module.css:27`; `legacy-topbar.tsx:36-65` | Source matched |
| Search width and shortcut | `old-lms-shell-spec.md:15-17` 291x36px, pale #f8fafc; `old-lms-shell.css:58` Ctrl K muted #5b6b82 | `topbar.module.css:29-33`, `command-search.tsx:121-145`; values `globals.css:329-333` | Source matched |
| Primary new action | `old-lms-shell-spec.md:16,25` — 82x36px, radius9, #0a7c88, white, 14px/650 | `topbar.module.css:40-41`, `globals.css:17-18,37,333-336` | Matched where an authorized New destination exists |
| Icon controls and unread badge | `old-lms-shell-spec.md:16`, `legacy-styles/components___notification-drawer.scss:27-60` — 36px shell, count font10/min16 | `topbar.module.css:43-45`, `notification-actions.tsx:18-31`, `globals.css:334` | Geometry matched; some portal Messages destinations absent |
| Org/account label | `old-lms-shell.css:61-63` — 12px weight600, #334155, org 38px control, max260 | `topbar.module.css:47,350-384`, `organization-switcher.tsx:50-67`, token `globals.css:329` | Source matched; native selector differs from old AntD instance |
| Avatar | `old-lms-shell.css:64-66` 42px outer, 38px inner | `topbar.module.css:48-50`, `account-menu.tsx:105-112` | Size matched; profile photo state not available in request context |
| Account dropdown | `legacy-styles/components___dropdown.scss:96-126` — 280px, 6px, 16x24px, shadow 9px 11px 28px rgba(0,0,0,.1), phone inset12/radius14 | `topbar.module.css:51-54,139-143`, `account-menu.tsx:112-132` | Source values matched; no browser screenshot |
| Header tablet | `old-lms-shell.css:67-72` — 768–1199px gap10, padding14, search grid min180, org 170–190 | `topbar.module.css:62-68,387-391` | Breakpoint declaration matched |
| Header mobile | `old-lms-shell.css:73-85` — ≤767px gap8, min-height58, search icon36, New38, avatar40/36 | `topbar.module.css:69-86` | Breakpoint declaration matched |

### B2 state and responsive parity — latest files

| Behavior/property | Legacy source (file:line) | vNext source (file:line) | Result |
| --- | --- | --- | --- |
| Desktop dropdown surface | `legacy-styles/components___notification-drawer.scss:113-147` — 360–420px width, max-height520, radius12, 1px neutral200, layered shadow, 200ms entry | `topbar.module.css:507-525`; `tpo-bell-panel.tsx:153-160`, `hr-recruiter-bell.tsx:112-122`, `learner-notification-bell.tsx:134-142` use shared `PopoverPanel` | Source style matched |
| Mobile drawer mode | `notification-drawer.scss:400-445` — ≤767px shared full-width Drawer, safe areas, close44 | All three bell components use `matchMedia("(max-width:767px)")` and shared `Drawer`; `topbar.module.css:337-354,527-549` and learner mobile rules near `:499-503` | Source mode and breakpoint matched; touch test not performed |
| List rows | `notification-drawer.scss:180-224` — inset12, gap6, radius8, 12x16px, neutral hover/active/focus | `topbar.module.css:308-335,515-523`; `tpo-bell-panel.tsx:119-135`, recruiter and learner bell row links | Source styling matched, portal text/content preserved |
| Footer | `notification-drawer.scss:323-356` — 12x20px, neutral50, border neutral200, controls44 | `topbar.module.css:471-473,529-536,553-554`; each portal's footer node passed into shared popup/drawer | Source styling matched |
| Empty state | `notification-drawer.scss:275-321` — centered 32x20, icon36 neutral400/60%, 14px text and max260 explanation | `topbar/notification-empty.tsx:1-16`, `topbar.module.css:464-468,557-560`, all three bell imports | Reusable source values matched; exact icon silhouette not visually verified |
| Command results | Old header hint `old-lms-shell.css:58`; generic legacy dropdown `legacy-styles/components___dropdown.scss:155-184` | `command-search.tsx:143-215` shared `PopoverListbox`, search field and keyboard controls in `:121-176` | Migrated to shared primitive; original result-specific state baseline absent |

### Coverage: exact scope and unresolved strict blockers

Source-content grep equivalent (the GitHub connector exposes file bytes but not a mounted working tree) **after the latest main merge**:

| Scoped search pattern | Result |
| --- | --- |
| `<(button|input|select|textarea)(?=[\\s>])` in all **17** directly owned topbar/shell/bell `.ts/.tsx` files | **0** native controls |
| `#[0-9a-fA-F]{3,8}\\b` in `topbar.module.css` | **0** literal hex colors; 17 exact values moved to `src/app/globals.css:329-338` or reused existing neutral tokens |
| `</(Select|Button|Drawer|PopoverPanel|PopoverListbox)(?!>)` in edited topbar TSX | **0** malformed closers observed |
| `rounded-full|border-b-2|#[0-9a-fA-F]{3,8}\\b|<(button|input|select|textarea)(?=[\\s>])` in first **36** Super Admin first-third page wrappers | **0** native/raw-control, local hex and hand-rolled chip/tab instances from the source sweep |
| The same source-pattern group in **56 directly imported Super Admin page components** plus the three delegated page components | Existing matches reduced to **0** after the announcement, branding and offering-tabs conversions detailed below |

**First-third files actively migrated in this pass:**

- `src/components/courses/admin-offering-learning-page.tsx`: four old `border-b-2` anchor tabs replaced with the shared `Tabs` through `src/components/courses/course-detail-anchor-tabs.tsx`. Existing fragment navigation, labels, PageHeader and panels preserved.
- `src/components/admin/college-branding-form.tsx`: remaining two native picker hex literals centralized in `src/components/ui/branding-color-tokens.ts` (required because input[type=color] does not accept `var(...)`).
- `src/components/announcements/announcement-admin-workspace.tsx`: list item card-in-canvas wrappers flattened to top borders and the handwritten empty card replaced with shared `EmptyState`.
- `src/components/shell/topbar/topbar.module.css`: all remaining hex values replaced with their exact shared theme tokens.
- `src/components/shell/topbar/command-search.tsx`: custom listbox wrapper replaced with shared `PopoverListbox`.
- `src/components/shell/topbar/account-menu.tsx`: keyboard focus selectors now use the shared popover `data-slot`; mobile overlay full viewport inset and visible focus styling added.
- `src/components/tpo/tpo-bell-panel.tsx`, `src/components/hr/hr-recruiter-bell.tsx`, `src/components/shell/learner-notification-bell.tsx`: desktop shared popover/mobile shared Drawer; central unread token; common empty state; server-specific read/refresh APIs unchanged.

**Strict tick status remains four open items**. The required *full-repository* `grep -rnE` counts, full value/state comparison for every caller, runtime phone/tablet interaction proof and command palette original-result baseline cannot be established from the connected source alone, and the global raw-control search is not known to be zero. Per the owner STRICT TICK RULE, none of B1/B2 is falsely checked. The appendix distinguishes completed source files from outstanding verification.

### Remaining work requiring proof

- [ ] Full-repository `grep -rnE '<(button|input|select|textarea)' src --include='*.tsx'` and `grep -rnE 'fixed inset-0|role="dialog"|#[0-9a-fA-F]{3,8}' src`, not just category-file scans.
- [ ] Keyboard/focus/tab order and actual rendered responsive screenshot comparison at representative 320px, 375px, 768px and desktop sizes.
- [ ] Confirm the old command-palette *result* hover/empty/loading/error behavior beyond the supplied generic dropdown SCSS; do not guess missing legacy properties.
- [ ] Verify Messages link and unread provenance for every portal where the role has a supported inbox. Do not introduce unauthorized destinations or fabricated counts.


## Mainline reconciliation and completed file inventory (2026-10-19)

After syncing `main` at `d54978d84992`, preserved the newer upstream `src/components/courses/course-detail-anchor-tabs.tsx` and `src/components/courses/admin-offering-learning-page.tsx` rather than keeping a duplicate `AdminOfferingSectionTabs`. The upstream implementation already uses the shared `Tabs` and preserves `deliveryId` plus hash/scroll offsets. The earlier historical notes describe prior chat-13 work, not a second active tabs component; `admin-offering-section-tabs.tsx` is **not in the current branch**.

Preserved the upstream recruiter `ShellNavGlyph` icon and reconciled chat-13's shared `TopbarNotificationEmpty`, accessible list semantics, exact unread-red token, 8px list rows, and shared Drawer body inset. No duplicate control element was introduced.

**Completed, inspected source files:** `src/components/shell/topbar/command-search.tsx` (shared PopoverListbox), `account-menu.tsx`, `organization-switcher.tsx`, `legacy-topbar.tsx`, `notification-actions.tsx`, `topbar.module.css`, `notification-empty.tsx`, `src/components/tpo/tpo-bell-panel.tsx`, `src/components/hr/hr-recruiter-bell.tsx`, `src/components/shell/learner-notification-bell.tsx`, `src/app/globals.css`, `src/components/admin/college-branding-form.tsx`, `src/components/ui/branding-color-tokens.ts`, `src/components/announcements/announcement-admin-workspace.tsx`, and the upstream `course-detail-anchor-tabs.tsx`.

**First-third Super Admin:** 36 route wrappers plus 56 directly imported components and three shared page delegates were inspected at source level. No remaining native `<button>`, `<input>`, `<select>`, `<textarea>`, one-off `rounded-full` pills, `border-b-2` tabs or literal hex colors were observed in that inspected scope after fixing the offering tabs, branding swatches, and announcement cards. This is not evidence that every route's nested *transitive* imports or runtime states have been compared visually.

**Strict rule outcome:** B1/B2 remain unticked. The full-repository grep and all-portal hover/focus/disabled/error/empty and responsive checks have not been fully established, and several portal-specific Messages routes/unread counts are intentionally undefined. Do not mark the four topbar items completed on the strength of these scoped source checks. The source-level visual sweep has advanced substantially, but pixel-level and runtime parity are unverified.
