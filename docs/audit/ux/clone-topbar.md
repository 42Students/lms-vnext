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
