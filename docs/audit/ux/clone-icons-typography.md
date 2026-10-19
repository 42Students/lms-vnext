# Lane chat-12 — A5–A7 icons, brand, links

Source: docs/design/legacy-styles, docs/design/old-lms-shell.css, and original SVGs at 42Students/lms2-fe (branch lms-dev-2026). Branch: chatgpt/chat-12-b.

## Work queue and strict tick status

- [ ] A5 Icons — missing global page inventory, all sizes/strokes/colours/states and proven zero raw-icon instances.
- [ ] A6 Avatars, logo, favicon, tab title — favicon changed to original; avatar, wordmark, title format, responsive proof still unverified.
- [ ] A7 Links — default, hover, focus, visited and external styles still need file-by-file comparison and instance audit.

## Value proof (partial; leave category unticked)

| Property | Legacy path:line and value | vNext path:line and value | Match? |
|---|---|---|---|
| Favicon geometry | lms2-fe/public/favicon.svg:1-4 — 596x519 viewBox; two original paths | src/app/icon.svg:1-4 — exact same SVG copied, trailing newline only | Yes |
| Favicon dark/light | lms2-fe/public/favicon.svg:2-3 — #266891 / #ADE2E7 | src/app/icon.svg:2-3 — #266891 / #ADE2E7 | Yes |
| Search image | lms2-fe/public/assets/images/common/search.svg:1 — width and height 19px | public/assets/images/common/search.svg:1 and src/components/tpo/grid/grid-workspace.tsx — exact vector, mounted in search button | Yes, one instance |
| File/document image | lms2-fe/public/assets/images/common/file-black.svg:1 — 16px | public/assets/images/common/file-black.svg and grid-workspace.tsx — exact original vector | Yes, one instance |
| Semantic icon colours | docs/design/legacy-styles/components___variables.scss:45-49 — teal #26bac7, amber #ed9c2c, purple #9c6bcc, green #059669 | src/app/globals.css:14,52-54 — same palette variables | Tokens yes; actual callers unknown |
| Header avatar sizes | docs/design/legacy-styles/components___header.scss:129-150 — wrap 52x52, icon 45x45 | src/components/shell/topbar and sidebar implementations have separate owners | Not compared |
| Link colour | legacy-styles/components___variables.scss:11-16 — #26bac7 primary, #1a95a1 text; components___common.scss:69-73 uses primary | src/app/globals.css:20 — link text #26bac7; some pages use text-link | Partial, link states unknown |
| Tab text | Legacy public/manifest.json:2-3 — app name 42 LMS, not proof of browser title | src/app/layout.tsx:11-13 — 42LMS, template %s · 42LMS | Not verified |

Restored original SVG assets to public/assets/images/common/: back.svg, bell.svg, chat.svg, dropdown-arrow.svg, file-black.svg, plus.svg, search-icon.svg, search.svg, star-yellow-icon.svg, upload.svg, right.svg, message-square.svg, new.svg, contact.svg, check-mark.svg, left-arrow.svg, power.svg, send-icon.svg, tooltip.svg, clock.svg. No shared UI component was edited.

## Coverage and responsive proof still missing

No local grep or runtime/browser checks were executed (dev-only, no code execution/CI). Therefore counts are UNKNOWN, not zero. Commands for later source audit:

- grep -rnE '(<svg|<img|lucide-react|@ant-design/icons)' src --include='*.tsx'
- grep -rnE '(text-link|lms-inline-link|hover:underline|visited:)' src --include='*.tsx'
- grep -rnE '(avatar|logo|favicon|metadata.*title)' src --include='*.tsx'

For each match, compare hover/active/focus/disabled, external indicator, phone/tablet collapse and exact icon size/stroke/fill. A5–A7 remain open until all greps and value rows match.

## Next ownership-safe sweep

- src/components/shell/topbar/icons.tsx: still custom SVG; chat-13 owns its edits.
- src/components/shell/sidebar-nav.tsx: sidebar icon family; chat-19 owns its edits.
- src/app/(authenticated)/tpo/companies/page.tsx: chat-12 next editable page to migrate actions, links and sheet toolbar.
- Do not modify src/components/ui/*, src/app/globals.css or src/app/layout.tsx (chat-17 ownership).


## Bounded continuation — 2026-10-19, source review

Branch was fast-forwarded to the then-current main before this sweep. Directory inventory was explicitly retrieved through the GitHub repository contents API, not a local shell grep:

| Asset coverage | Old LMS at lms2-fe/public/assets/images/common | vNext at public/assets/images/common | Result |
|---|---|---|---|
| SVG icon asset filenames | 46 SVGs, repo contents listing | 46 SVGs, repo contents listing | All 46 names present; 0 missing SVG names |
| Bitmap assets | error.png, recording.png | Both still absent | **Open**, not exact full asset clone |
| Original header avatar | legacy-styles/components___header.scss:129-159: 52x52 wrap and 45x45 inner, round cover | src/components/ui/avatar.tsx:16-22 has lg 52x52 border/padding and 45px image intrinsic sizing | Inexact/needs rendered comparison; shared component owned by chat-17 |
| Notification avatar | legacy-styles/components___dropdown.scss:59-70: 38x38 radius 10px | Shell topbar and notification drawer controlled by chat-13/chat-16 | Open |
| Link colour and hover underline | legacy-styles/components___common.scss:69-74: $clrThird teal and hover underline | src/components/tpo/tpo-companies-spreadsheet.tsx:44-56: text-link and underline; focus-visible outline for external URL | Visual style partly aligned, visited state and full inventory open |
| External company link security | Old external URL treatment not confirmed | src/modules/placements/tpo-safe-company-url.ts:1-11 only permits explicit http(s) URLs without credentials; company grid:50-58 opens target=_blank with rel=noopener noreferrer and disclosed new-tab label | Safety improvement, not claimed as pixel-level old-style match |

**14 additional legacy SVGs restored this turn:** Menu-Icon.svg, analytics.svg, arrow-radio-right .svg, chat-submit.svg, chat2.svg, check-ar-white.svg, dropdown-arrow-2.svg, existing-student.svg, help-support.svg, left-ar-green.svg, plusBlack.svg, question-yellow.svg, surveys.svg, x.svg. SVG shapes and fixed fills are preserved from lms2-fe/lms-dev-2026. Existing vNext assets untouched.

**Strict tick rule:** A5, A6, A7 remain **[ ]**. Only the asset filename inventory is complete. No repository-wide icon caller grep, legacy/vNext state-by-state stroke audit, no phone/tablet proof, no full avatar tab-title check and no side-by-side comparison were performed. The user specifically disallowed running code/CI; do not count the API directory listing as source grep coverage. Shell owner lanes remain chat-13/chat-19, shared UI owner remains chat-17.

**Exact next A5/A6/A7 source file:** src/components/tpo/tpo-company-memory-workspace.tsx (review its avatar/person links and activity timeline icons), then src/components/tpo/recruiter-leads-workspace.tsx. Keep untouched all shared UI components and topbar/sidebar owned by other lanes.
