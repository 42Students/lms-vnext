# chat-20 — old LMS micro-details parity audit

Reference baseline: `docs/design/legacy-styles/` (SCSS), `docs/design/old-lms-shell.css`, `docs/design/ui-clone-checklist.md` A3/A4/I. Scope is *interaction paint only*: `src/styles/micro-details.css` imported once from `src/app/globals.css` after `legacy-skin.css`. Branch `chatgpt/chat-20-b`.

## Work queue (code-search discovery; source files outside ownership are read-only)

- [x] Create `src/styles/micro-details.css` for fallback focus/cursor, touch active, link, semantic checked/selected, placeholder/selection, sticky-shadow and dropdown-enter paint.
- [x] Import it once from `src/app/globals.css`, below the shared global skin.
- [ ] Validate all selectors against an actual browser; owner prohibited runtime and CI in this turn.
- [ ] Measure matching tooltip open delays/close delays. Sources: `src/components/ui/tooltip.tsx` (native `details` opens on pointer-enter immediately) and `docs/design/legacy-styles/components___antddesign.scss:46-80` (visual only); duration is not expressed in SCSS.
- [ ] Confirm toast timeout, position and close behavior against running legacy LMS. Read-only `src/components/ui/toast.tsx`: non-error duration is content-dependent 4,500–15,000ms, error toasts persist; viewport-safe bottom-right placement. Neither timing nor position is controlled by CSS.
- [ ] Confirm modal/drawer exit transitions in `src/components/ui/legacy-overlays.css`; leave owner chat-16 overlay internals untouched.
- [ ] Confirm favicon artwork and tab-title format with running legacy page. Current `src/app/icon.svg:1-6` has teal mark; `src/app/layout.tsx:11-14` sets `%s · 42LMS`. No exact old-page favicon or title metadata is present in SCSS. These files are outside the lane.
- [ ] Confirm print output. Existing `src/app/(authenticated)/authenticated-print.css` is owned by the print lane; no duplicate print-layout overrides added here.
- [ ] Perform repository-wide exhaustive grep and responsive screenshot validation in the orchestrator's later runtime comparison. Connector code search below gives discovery, not exhaustive counts.

**Files discovered by GitHub code searches** (no local execution performed):
- `data-slot="toast-stack"`: `src/app/globals.css`, `src/components/ui/toast.tsx`, `src/components/ui/legacy-overlays.css`, `src/app/(authenticated)/authenticated-print.css`, and UX tests (6 matches reported).
- `data-slot="info-popover"`: `src/components/ui/tooltip.tsx`, `src/components/ui/legacy-overlays.css`, `src/app/globals.css`, HR refresh component (4 reported).
- `data-slot="dropdown-root"`: `src/components/ui/dropdown.tsx`, `src/components/ui/legacy-overlays.css`, `src/app/globals.css`, HR refresh component (4 reported).
- `scrollbar-width`: `src/app/globals.css`, `src/components/shell/sidebar-legacy.css`, legacy SCSS and existing audit/tests. Code search was limited to first 8 results.
- `metadata title`: `src/app/layout.tsx`, `src/components/shell/page-title.tsx` and others. The shell owner controls the dynamic title composition.

## Value comparison (source exact SCSS lines versus implementation)

| Detail / state | Old LMS reference and value | vNext value and location | Result |
| --- | --- | --- | --- |
| Fast motion | `components___variables.scss:251-252`: 150ms | `micro-details.css:12`: 150ms; `globals.css` `--lms-motion-fast` | Match (static) |
| Normal motion | `components___variables.scss:253-254`: 250ms | `micro-details.css:13`: 250ms | Match (static) |
| Slow motion | `components___variables.scss:255-256`: 350ms | `micro-details.css:14`: 350ms | Match (static) |
| Easing | `components___variables.scss:258`: cubic-bezier(0.2,0,0,1) | `micro-details.css:15`: cubic-bezier(0.2,0,0,1) | Match (static) |
| Default keyboard focus | `components___accessibility.scss:19-23`: 2px solid #1a95a1, offset 3px | `micro-details.css:28-32`: 2px #1a95a1, offset 3px | Match (generic fallback; shared control overrides preserved) |
| Mouse focus | `components___accessibility.scss:13-16`: no outline | `micro-details.css:24-26`: no outline for generic controls | Match (static) |
| Elevated focus | `components___accessibility.scss:25-36`: 2px ring, offset 2px, 4px 12% halo | `micro-details.css:55-59`: 2px/2px and rgba(26,149,161,.12) | Match (roles only) |
| Hover/press transitions | `components___button.scss:13-16`: 150ms ease, pointer cursor; `components___variables.scss:251-259`: 150ms material easing | `micro-details.css:36-52`; shared button retains its own timing in globals | Split legacy values; special control exceptions remain |
| Touch press | `components___accessibility.scss:49-60`: scale(.98), opacity(.9), 50ms ease | `micro-details.css:65-72` (role button, touch only) | Match where role present |
| Tap highlight | `components___notification-drawer.scss:38-41,196-203`: transparent | `micro-details.css:180-184`: transparent semantic actions | Match legacy notification-action value, global extrapolation not yet screenshot-verified |
| Disabled cursor | `components___antddesign.scss:176-181`: disabled palette; cursor not specified | `micro-details.css:45-47`: not-allowed | Reasonable vNext fallback, no exact legacy cursor proof |
| Link hover | `components___common.scss:68-75`: #26bac7 + underline | `micro-details.css:83-86` plus `legacy-skin.css` | Match for canvas links |
| Link visited | No explicit visited state in provided SCSS | `micro-details.css:79-81`: teal | Inferred; visual confirmation needed |
| Checkbox checked | `components___antddesign.scss:123-132`: teal check; `213-216`: checked label | `micro-details.css:90-103` accent/transition; `globals.css` accent | Paint matches; browser-native check animation not deterministic |
| Switch checked | `components___common.scss:226-228`: track #26bac7 | `micro-details.css:187-193`: checked role switch background #26bac7 | Match semantic switch track; component markup / animation not independently verified |
| Radio checked | `components___antddesign.scss:742-745`: teal fill/border | `micro-details.css:97-103` native accent | Matches colour, animation UA-controlled |
| Placeholder | `components___form.scss:57-60`: #a9a7ae, 14px | `micro-details.css:110-113` colour; `legacy-skin.css` font 14px | Match |
| Autofill | No specified UA autofill appearance in legacy SCSS | `micro-details.css:116-119`: preserve inherited text/caret ink | Cannot certify, no guessed background |
| Text selection | `components___variables.scss:10-13`: ink #1a1d21; soft teal #eff8fa | `micro-details.css:123-126` | Token-derived; old selection paint not explicit |
| Scrollbars | `components___common.scss:307-311,329-331`: scrollbar-width:none and hidden webkit | `globals.css:183-193` (global hide, before import offset) | Matches generic global hide; sidebar hover exception owned chat-19 (`old-lms-shell.css:41-43`) |
| Menu selected | `components___antddesign.scss:134-136`: selected teal fill, white foreground; shell active tint `old-lms-shell.css:45-48` | `micro-details.css:136-141`: subtle menu fill/teal ink; `micro-details.css:142-147`: selected options teal/white | Options now match legacy full-teal/white; menuitem tint still requires menu-specific proof |
| Table selected | Old SCSS has no explicit semantic row-selected value in inspected references | `micro-details.css:132-135`: #eff8fa | Palette-derived, not proven |
| Table row hover | `old-lms-shell.css:45-48`: 7% teal hover (sidebar, not table); `components___common.scss:130-139` exempts no-hover tables | Existing `globals.css` row hover and `legacy-skin.css` | Needs actual table-row reference and screenshot |
| Sticky header shadow | `old-lms-shell.css:56`: 0 1px 3px rgba(26,45,72,.035) | `micro-details.css:151-154`: same paint on *already sticky* heads | Match shadow token; actual table presence unverified |
| Dropdown open | `components___variables.scss:253-259`: normal 250ms material easing | `micro-details.css:158-169`: 250ms opacity/translate | Timing match; old dropdown keyframes unproven |
| Dialog/drawer enter and exit | `components___variables.scss:253-259` general motion; `components___antddesign.scss:1-13` tab/page entry 180/250ms | Existing `legacy-overlays.css` owns modal/drawer 180/200ms; `globals.css` also defines animations | Unticked pending legacy modal-specific measurement |
| Tooltip visual, open delay | `components___antddesign.scss:48-64`: charcoal, 8px radius, 12px; no delay specified | `legacy-overlays.css` visual match; `tooltip.tsx` hover opens immediately | Visual partial; interaction timing unknown |
| Toast lifetime, position and animation | No authoritative duration/position in inspected legacy SCSS | `toast.tsx` 4.5–15s (non-errors), errors persistent, safe bottom-right; `globals.css` 250ms entrance | Cannot claim parity without legacy runtime |
| Reduced motion | `components___accessibility.scss:116-124`: 0.01ms and auto scroll | `globals.css` existing media block; `micro-details.css:173-177` disables popup entrance | Match (static) |
| Favicon and tab title | No title/favicon in supplied style references | `src/app/icon.svg:1-6`; `src/app/layout.tsx:11-14` | Unverified; outside CSS ownership |
| Print | Not specified in micro-interaction SCSS | Existing authenticated-print stylesheet untouched | Owned by chat-6 |

## STRICT TICK RULE and responsive proof

- [ ] Micro-details **fully closed** (missing: exhaustive per-selector grep coverage, checked hover/touch/keyboard behavior on phone, tablet and desktop, plus old LMS computed-style parity).
- [ ] Tooltip/toast/overlay timing (missing: runtime comparison and component-owned JS values; CSS cannot modify event delays or timer lifetimes).
- [ ] Browser chrome (missing: measured legacy favicon/title, files outside this CSS-only lane).
- [ ] Print (missing: paired print preview and stylesheet ownership handoff).
- [x] One-time import (greps: read `globals.css` import occurrence = 1; values: the new import follows the legacy skin, affects no JSX; responsive: same stylesheet on all breakpoints).

**Verification constraints:** User explicitly prohibited running the app and CI. GitHub connector source reads and code searches were used instead; no grep result has been disguised as an exhaustive local search. All named files were left unchanged unless explicitly owned by chat-20. Do not tick remaining items until the orchestrator performs its local grep/screenshot pass.
