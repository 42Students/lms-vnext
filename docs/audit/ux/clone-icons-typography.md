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
