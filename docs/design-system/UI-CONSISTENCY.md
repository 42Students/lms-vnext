# UI consistency rules

One system everywhere. `npm run ux:consistency` (part of `npm run lint`, so part of CI) fails if any file gets worse.

| Rule | Meaning |
|---|---|
| `raw-control` | No raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<h1>` outside `src/components/ui/`. Use `Button`, `Input`, `Select`, `Textarea`, `DataTable`, `PageHeader`. |
| `hex-color` | No hex literals outside the token files. Use a `--lms-*` token. |
| `font-size-off-scale` | 12, 13, 14, 16, 18, 20, 24, 30, 36 px, plus 48 and 64 for display numerals only. |
| `radius-off-scale` | 0, 2, 4, 6, 8, 10, 12, 14, 18, 20, 999 px (or 50%). |
| `font-family-off` | Inter stack, `inherit`, or the mono token only. |

Rules live in `scripts/ui-consistency-rules.mjs`. The debt is in `UI-CONSISTENCY-BASELINE.json`, per file and rule. It can only go down: `node scripts/check-ui-consistency.mjs --update` refuses to raise a count. `--report` prints the totals. The goal is an empty baseline.

New code may not add a violation. If a shared component is missing something, extend the component, not the page.

## Rules (guarded by `npm run ux:consistency`)

Raw elements: raw-control (button/input/select/textarea/table/h1), raw-heading (h2-h6), raw-link (a, styled next/link), raw-image, raw-label, raw-details, button-bare, link-bare. Colors: hex-color, color-literal, palette-class. Type: font-size/family/weight, line-height, letter-spacing. Shape and space: radius, border-width, opacity, spacing grid, size grid, shadow, z-index. Behaviour: focus-style-off (one focus-ring utility), important, breakpoint-off, motion-literal, keyframes-local, handrolled-skeleton, class-conflict, adhoc-format, icon-size-off. Scales live in `scripts/ui-consistency-rules.mjs`; tokens in `src/app/globals.css`; keyframes in `src/styles/motion.css`.

## Shared building blocks

Button (primary, secondary, ghost, danger, link, chip, menu-item; sizes sm, md, lg, icon, inline), ButtonLink, TextLink, Heading (h1-h6), Label (field, choice), Table, Disclosure, SkeletonBlock, Img, Input, Select, Textarea, Checkbox, Radio, PageHeader. `cx()` merges conflicting Tailwind classes (tailwind-merge) so a later class wins and no `!important` is needed. Dates and numbers: `formatDateTimeIst`, `formatDateIst`, `formatDateWith`, the shared `ist*Formatter` instances, `createDateFormatter`, `formatNumberIN`, `createNumberFormatter`.

## State on 2026-11-06 (end of the overnight pass)

Burned down from 9,000+ violations across 23+ categories to a short tracked remainder. Zero in every rule except:

- `important`: about 660 `!important` declarations in CSS files (legacy skins and CSS modules). Every `!important` utility in TSX is gone. Removing the CSS ones needs the cascade checked on real pages, so they wait for the visual pass.
- `link-bare` and `button-bare`: about 360 links and buttons that are tab/pill/segment navigation or cards styled per page (most with a conditional class). They need a designed `Tabs`/`PillLink`/card composition each; the guard tracks them so they can only shrink.
- `handrolled-skeleton`: a handful of conditional or live-status pulses.

No exemptions: the shell, sidebar and top bar are held to the same rules (`UI-CONSISTENCY-EXEMPTIONS.json` is empty). Their pinned tests assert the on-system values; the legacy reference file `docs/design/old-lms-shell.css` is untouched.

Next: run `npm run ux:audit` against a running app for each role (it reads computed styles of every visible element and flags anything off the scales), then do the visual pass.

## Overnight checklist (started 2026-11-06 01:30 IST)

- [x] Mechanical snaps, theme tokens, colors, shadows, z-index, keyframes
- [x] Shared Heading, TextLink, ButtonLink, Img, Label, SkeletonBlock; raw elements converted
- [x] Focus-ring unification, size grid, icon sizes, tables, details, shell exemptions removed
- [x] Dates and numbers through shared formatters; cx merges conflicting classes; TSX `!important` removed
- [x] Runtime computed-style audit script (`npm run ux:audit`)
- [ ] CSS `!important` (needs the visual pass), bare buttons and links (need designed components)
- [ ] Visual pass on a running app
