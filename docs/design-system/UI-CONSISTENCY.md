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

## State on 2026-11-06

Burned down from 2,037 violations to 178: hex colors 1,505 to 4, raw controls 459 to 43, radii 61 to 1, font sizes 11 to 6, font families 1 to 0. The 4 hex, the 6 sizes and the 1 radius are legacy values pinned by tests (sidebar rail, route-progress dots, mobile footer, historic logomark). Raw inputs, selects, textareas, tables and loading/error headings now use the shared components. All raw buttons use `Button`; 124 of them use `variant="bare"` (behaviour only, no chrome) and are tracked by the `button-bare` rule until they get a real variant or a Tab/MenuItem/Chip component.

Semantic color tokens were added to `globals.css` (`--lms-text-body`, `--lms-text-muted`, `--lms-border`, `--lms-border-strong`, success/error/warning/info/purple surface and strong tokens). `<input type="hidden">` is exempt from `raw-control`. A literal hex that must stay (native colour input) takes a `ui-consistency-allow-hex` comment on the same or previous line.

## Overnight checklist (started 2026-11-06 01:30 IST)

Tick items as they land on `main`. One commit per category.

- [ ] 1. Mechanical snaps: weights, line heights, letter spacing, opacity, border widths, radii, spacing grid, named breakpoints, motion durations
- [ ] 2. Theme tokens: breakpoints (lg = 992px), named shadows and radii point at `--lms-*` tokens
- [ ] 3. Colors: rgba()/hsl()/named colors and Tailwind palette classes to `--lms-*` tokens
- [ ] 4. Shadows, z-index to tokens; all `@keyframes` moved to `src/styles/motion.css`
- [ ] 5. Shared `Heading`, `TextLink`, `Image`; convert raw `<h2>-<h6>`, `<a>`, `<img>`
- [ ] 6. Bare buttons to real variants; last raw controls and prototype tables
- [ ] 7. Remove `!important`
- [ ] 8. Prototype skins (TPO, recruiter, mentor, faculty) onto shared components
- [ ] 9. Legacy-pinned tests updated to the new values; baseline at zero
- [ ] 10. Computed-style audit script (every page, every role)
- [ ] 11. Full lint, unit and style tests; CI read; fix regressions
- [ ] 12. Morning summary
