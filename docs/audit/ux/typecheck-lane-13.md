# Typecheck lane 13 — static source fixes

Six listed origin/main errors addressed without running code or CI. Each entry is one reported error; current strict compilation not independently executed.

- `src/app/api/placements/offers/[offerId]/joining/route.ts:33` **TS2345** — Parse bounded JSON with existing `placementJoiningOutcomeInputSchema` before passing to typed `recordPlacementJoiningOutcome`; the service keeps its own validation; origin guard, body limit, status/error semantics unchanged.
- `src/components/placements/college-hiring-funnel.tsx:77` **TS2322** — Declare initial `Total Applications` metric as a readonly tuple (`as const`), ensuring SummaryStrip `label` remains `string` and counts remain numbers; no displayed values or layout changed.
- `src/components/shell/route-progress.tsx:41` **TS2322** — Type `reveal` timer ref as `number | null`, matching `window.setTimeout`/`window.clearTimeout` and preserving 700ms delay.
- `src/components/shell/route-progress.tsx:42` **TS2322** — Type `stall` timer ref as `number | null`, matching DOM timeout identifiers and preserving 20s stall state.
- `src/components/shell/route-progress.tsx:44` **TS2322** — Type `recovery` timer ref as `number | null`, matching DOM timeout identifiers and preserving 30s fallback/reset.
- `src/components/ui/popover.tsx:21` **TS7053** — Type optional `"data-slot"` on `PopoverPanelProps`, destructure it before spreading and render the original passed value or `popover`; no duplicate JSX attribute, preserved caller overrides.
