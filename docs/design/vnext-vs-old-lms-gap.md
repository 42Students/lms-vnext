# vNext versus old LMS: UI gap (measured 2026-10-19, both run locally, TPO portal, 1280x800)

North star (owner): vNext must look the same as the old LMS so stakeholders do not feel it is a new app. References: `old-lms-shell-spec.md`, `old-lms-shell.css` (exact rules), `old-lms-pages.md` (page anatomy). Build order below is by visual impact.

| # | Area | Old LMS | vNext today | Fix |
|---|---|---|---|---|
| 1 | Sidebar | 96px icon rail, expands to 256px on HOVER (0.15s cubic-bezier(.2,0,0,1)), content pushes right; real icons; group headings OPERATE/COORDINATE/INSIGHTS/ADMINISTRATION only when expanded; thin dividers when collapsed; logo mark on top; active = tinted bg + 3px teal inset bar | always 256px, no collapse, no hover; text items with single-letter badges (D, C, H, P) instead of icons; "42 STUDENTS LMS" text brand; Faculty and TPO items mixed in one list | port `old-lms-shell.css` sidebar rules; icon per item; separate portals per role |
| 2 | Top bar | 68px, white, bottom border #e7ecf2 + light shadow; command search (Ctrl K) left, "+ New" primary, Messages and Notifications icon buttons with red badges, org name, circular initials avatar with account menu | 69px; tiny two-line label, then "Messages", college name, "My Account", "Logout" as text links; search/New/notifications sit INSIDE the page as a separate strip | rebuild header as in spec; move search, New and notifications into it; account menu from avatar |
| 3 | Canvas | content on ONE white canvas: radius 12, 1px #e5e9f0, padding 24, on #f1f4f9 shell | no canvas: headings and cards sit directly on the grey shell, padding 32 | wrap page content in the canvas; kill per-section card boxes (see anatomy list) |
| 4 | Buttons | primary `#0a7c88`, WHITE text, radius 9, 36px high, weight 650, 14px | primary `#26bac7` with near-black `#1a1d21` text, pill radius on some | primary token to `#0a7c88` and white text everywhere (CSS variable + audit hard-coded colours); radius 9 |
| 5 | Font | Inter (400/500/600/700) + JetBrains Mono, loaded from Google Fonts; sidebar labels 15px; h1 30px/600 #172033 | Arial/Helvetica fallback, no webfont loaded; h1 colour #1a1d21 | Inter via next/font (self-hosted), JetBrains Mono for numbers; weights as old LMS; tabular numbers |
| 6 | Page head | one row: title + grey one-line subtitle inline, primary action(s) top-right | eyebrow label, big title, paragraph under it, actions elsewhere | page-head primitive: title + subtitle inline + right actions |
| 7 | Lists | "Needs doing" chips, tabs with counts + teal underline, compact toolbar (Search, Filters, Views, Columns, Export), "N items in this view / Act on all N", hairline table | long stacks of native select/input filter forms with disclosure triangles ("More student tools", "Profile strength filters") | shared list-page kit: chips, tabs, toolbar, filter popovers, table styles |
| 8 | Tiles and summaries | slim funnel strips, tile grids for report options, pale yellow banners | big stat cards (0 / 0 / 0) and plain paragraph blocks | summary-strip, tile and banner primitives |
| 9 | Header region text | org name only | role and college text in several places | mirror old LMS text exactly (wording audit already exists) |

## Order of work (after the current build lanes finish, owner approval first)
1. Tokens: colours (primary #0a7c88, white text), Inter font, radii, shell/canvas/border colours; one commit in the shared kit + global CSS.
2. Shell: sidebar (rail + hover + icons + groups), top bar (search, New, notifications, avatar), canvas wrapper. This alone changes how every page feels.
3. Page-head, chips, tabs, toolbar, table, banner and tile primitives in `src/components/ui`; migrate TPO pages first (Home, Students, Engage, Drives, Reports), then HR, College Admin, Faculty, Learner, Mentor, Super Admin.
4. Visual diff pass against the old LMS page by page (the lanes cannot run the app; the orchestrator captures old and new screenshots and files per-page gaps).

## How the numbers were taken
Old LMS: local legacy stack (frontend 3020), TPO portal, signed in with the stack's own test contact. vNext: `next dev` on 8080 against a fresh local database seeded with `seed-test-tenants`, signed in with the seeded TPO test email and the local test code. Note vNext local data is thin (Placements module off for the seeded college), so empty states differ from the old LMS's populated pages; the structural gaps above are independent of data.
