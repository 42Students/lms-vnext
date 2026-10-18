# Old LMS shell spec (measured 2026-10-19 on the local legacy stack, TPO home, 1280x800)

North star (owner): vNext must look super good and match the old LMS shell exactly: sidebar hover behaviour, top navbar, one big canvas, white button text, a premium font. This file is the measured reference. Legacy source of truth is the running old LMS (TPO home `/tpo/home`).

## 1. Sidebar (class `tpo-sidebar-panel`)
- Collapsed: 96px wide icon rail (logo on top, icons only, one icon per nav item, group dividers). Expanded: 256px wide, labels plus small uppercase group headings (OPERATE, COORDINATE, INSIGHTS, ADMINISTRATION).
- Opens on HOVER over the rail, closes when the pointer leaves. No click needed.
- Transition: `width 0.15s cubic-bezier(0.2, 0, 0, 1), opacity 0.15s cubic-bezier(0.2, 0, 0, 1)`.
- The page content shifts right (layout push, not an overlay): canvas x = 280 when expanded.
- Panel: white `#ffffff`, horizontal padding 8px, 1px right border `#f1f4f9`, no shadow, full viewport height.
- Active item: soft teal tint with teal outline on the rounded item; labels 15px.

## 2. Top bar
- White `#ffffff`, 1px bottom border `#e7ecf2`, about 85px tall including padding (24px 24px 16px), starts after the sidebar (x = 256 expanded).
- Left: search field, 291px wide, 36px high, radius 9px, background `#f8fafc`, text "Find a student, recruiter or company" with a `Ctrl K` hint.
- Centre-right: primary "+ New" button (82px x 36px, radius 9px), then two 36px round-rect icon buttons (Messages, Notifications) with red count badges, then the organisation name, then a 52px circular avatar button (initials) that opens the account menu.

## 3. Canvas
- App shell background `#f1f4f9`. Page content sits on ONE large white canvas: background `#ffffff`, `1px solid #e5e9f0`, radius 12px, padding 24px, no shadow. Canvas x = 280, width 976 at 1280 viewport (16px right margin), top y = 101.
- Inside the canvas the page is a continuous surface: date line, greeting heading, then content blocks divided by whitespace and thin borders; only genuinely separate objects (the "next up" panel, the grouped row list) have their own light border. Rows in a list are separated by hairlines, not individual cards.

## 4. Buttons
- Primary: background `#0a7c88`, text WHITE `#ffffff`, radius 9px, height 36px, font-weight 650, font-size 14px. (vNext primary buttons currently use near-black text `#1a1d21` on teal `#26bac7`: change to white text.)
- Secondary/icon buttons: white background, hairline border, radius 9px, 36px.

## 5. Typography
- Old LMS loads Inter 400/500/600/700 and JetBrains Mono 500 from Google Fonts; body falls back to Lato then system fonts; page title (h1) 30px, weight 600, color `#172033`; sidebar labels 15px.
- vNext currently loads NO webfont (computed body font Arial/Helvetica). Switch to a premium UI font (Inter variable, self-hosted via next/font so no external request; optional JetBrains Mono for numbers/code), tighten letter-spacing slightly for headings, tabular numbers for data.

## How to use
- Do NOT start changing the app from this file until the orchestrator says GO (owner wants to review the plan first). This is the reference for the later "north star" pass.
