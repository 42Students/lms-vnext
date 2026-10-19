# E8 — TPO / HR spreadsheet clone audit (chat-14)

**Status: BLOCKED for AG Grid parity.** This report is written against the available `42Students/lms-vnext` refs (2026-10-19). At first read, the shared `docs/design/ui-clone-checklist.md` stopped at E7; this lane subsequently added a numbered E8 line on its branch to record the new owner assignment. It is **not** a completed checkbox. The mandatory `docs/design/legacy-grid/*.txt` references and AG Grid dependencies have not been found on either current `main` or `chatgpt/chat-14-b`. Do not mark E8 as passed, do not infer legacy theme parameters, and do not import packages that the repository does not declare.

- [ ] **E8 AG Grid legacy sheet clone** (missing: legacy source and exact `tpoGridTheme` values; `ag-grid-community` and `ag-grid-react` ^36.2; `ModuleRegistry.registerModules([AllCommunityModule])`; native `AgGridReact`; full selection, keyboard, column-state and responsive parity; true branch grep counts; runtime visual comparison).

## Source inspection and exact blockers

| Required source / dependency | What was actually available | Result |
|---|---|---|
| `docs/design/ui-clone-checklist.md`, section E8 | Initially E1–E7 only; E8 was added to the lane branch in commit `842116d6` | Item registered; no completion claim |
| `docs/design/legacy-grid/TpoGrid.jsx.txt` | GitHub contents API returned 404 on `main`; recursive main and chat-14 trees do not contain `legacy-grid` | Cannot claim a source-faithful port |
| `docs/design/legacy-grid/gridExport.js.txt` | 404 | Exact CSV / TSV behavior unavailable |
| `docs/design/legacy-grid/viewMemory.js.txt` | 404 | Exact browser layout contract unavailable |
| `HeaderFilter`, `ChoiceEditor`, `SavedViewsManager` | No `legacy-grid` source found. Current replacements include `tpo-grid-filter-panel.tsx` and `tpo-student-saved-views.tsx` | Not ported one-for-one |
| `package.json` `ag-grid-community` | No AG Grid dependency string on `main` or chat-14 | Cannot type-check an AG Grid import |
| `package.json` `ag-grid-react` | No AG Grid dependency string on either ref | Cannot type-check an AG Grid import |
| `package-lock.json` | File exists but has no `ag-grid` entry | No lockfile proof of installed modules |
| `src/components/tpo/tpo-spreadsheet-grid.tsx` | Existing authorized shared-Table sheet | Kept as functional fallback, not mislabeled as AG Grid |
| `src/components/tpo/grid/tpo-grid.tsx` | New typed client-only boundary around existing sheet | Ready for a later exact AG Grid implementation when source/deps land |
| `tpo-students-spreadsheet.tsx` and `tpo-applications-spreadsheet.tsx` | Both route-facing sheet callers use `next/dynamic` with `ssr:false` to load `TpoGrid` | **Source-level** client boundary implemented; no runtime proof |

## Source-level behavior comparison (legacy values cannot be invented)

| Property / behavior | Legacy source and value | Current vNext file and value | Status |
|---|---|---|---|
| Framework | `legacy-grid/TpoGrid.jsx.txt`: unavailable | `grid/tpo-grid.tsx:1-13`: client component delegating to existing Table; no AgGridReact | **Not matched** |
| Community registration | Unavailable; owner asks `ModuleRegistry.registerModules([AllCommunityModule])` | No import or registration until dependency exists | **Not matched** |
| Theme | Exact `tpoGridTheme` parameters unavailable | Shared Table CSS `src/components/ui/table.tsx:14-16`; no guessed Quartz theme | **Not matched** |
| Selection checkbox pinned | Owner-provided: 48px; exact legacy source unavailable | `tpo-spreadsheet-grid.tsx:154,177`: sticky left 0, `w-12 min-w-12` (48px) | Intended value matches; computed CSS/scroll proof missing |
| Header select-all scope | Owner: currently filtered rows | `tpo-spreadsheet-grid.tsx:61-69,154`: `selection.allIds` when supplied; otherwise current grid rows | Server allIds authorization and filter refresh need runtime proof |
| Shift / Ctrl / Cmd selection | Owner: range and additive/toggle modifiers | `grid/grid-selection.ts:12-61`, `tpo-spreadsheet-grid.tsx:70-81,173-177` | Implemented in Table fallback; no legacy event/keyboard proof |
| Ctrl / Cmd + C TSV | Owner: TSV copy | `grid/grid-export.ts:1-18`; `tpo-spreadsheet-grid.tsx:143-153`: safe TSV of selected/current visible rows | Implemented in fallback, browser clipboard failure gracefully reported |
| Sort eligibility | Owner: numeric/date only; text not sortable | `grid/grid-sort.ts:3-34` and `tpo-grid-model.ts:6-13`: explicit `sortKind`; student/applicant numeric and date fields opted in | Implemented in Table fallback; empty / invalid ordering and exact arrows not verified |
| Header filters | Owner: none | `tpo-spreadsheet-grid.tsx:154-172`: per-column header `Select` removed; external `TpoGridFilterPanel` preserved | Structurally matched; browser UI proof missing |
| Layout memory | Owner: `storageKey` | `tpo-spreadsheet-grid.tsx:38-60,90-138`: established `:layout-v2` width/pin storage; `grid/view-memory.ts:1-57` pure V3 sanitization prepared | V2 behavior preserved; exact legacy viewMemory not verifiable |
| Selected hidden rows | Owner: drop selection hidden by filter | `grid/grid-selection.ts:4-10`, `tpo-spreadsheet-grid.tsx:82-89`: intersect selected IDs with authorized `allIds` or current rows after filter | Source-level enforcement; paging/regression proof missing |
| Editing | `ChoiceEditor` unavailable | Existing row actions and server permission/auth flows unchanged in both consumers | No legacy ChoiceEditor port; **not matched** |
| Saved views | `SavedViewsManager` unavailable | Existing `src/components/tpo/tpo-student-saved-views.tsx` server-scoped saved-view API left intact | Preserved existing capability; exact legacy port unproven |
| Row height / hover / borders | Exact legacy Quartz parameters missing | Existing Table styles in `src/components/ui/table.tsx:14-16` | **Not matched/proven** |
| Phone/tablet | Legacy grid breakpoints unknown | `tpo-spreadsheet-grid.tsx:143,179-194`: desktop table, phone cards/actions; dynamic client wrapper | Existing responsive behavior preserved, not pixel-clone proof |
| Export/download authorization | Legacy gridExport unavailable | Existing student CSV/XLSX endpoints and applicant drawer/server authorizations untouched | Data contract preserved, exact legacy behavior unproven |

## Files changed in the E8 addition

- `src/modules/placements/tpo-grid-model.ts` — optional explicit numeric/date sort metadata.
- `src/components/tpo/grid/grid-export.ts` — safe, single-line TSV with spreadsheet-formula mitigation.
- `src/components/tpo/grid/grid-selection.ts` — pure Shift / Cmd / Ctrl selection and authorized-ID pruning.
- `src/components/tpo/grid/grid-sort.ts` — stable numeric/date-only sorting, raw timestamp sort values.
- `src/components/tpo/grid/view-memory.ts` — pure sanitizing layout schema for eventual AG Grid migration (not yet wired).
- `src/components/tpo/grid/tpo-grid.tsx` — typed, client-only integration boundary **still backed by Table**.
- `src/components/tpo/tpo-spreadsheet-grid.tsx` — typed props, selection, column sort, 48px pinned checkbox, TSV copy, removed inline header filter controls.
- `src/components/tpo/tpo-students-spreadsheet.tsx` and `src/components/tpo/tpo-applications-spreadsheet.tsx` — lazy grid client import with `ssr:false`, explicit sortable columns, all existing callback/data flow retained.

## Coverage proof

**No authentic repository-wide grep was run.** Two direct source reads showed the requested consumer names; the two dynamic client imports have since replaced both. The original checklist lacked E8, so the category entry was added to the lane branch. GitHub indexed search for `ag-grid-react`, `themeQuartz`, `TpoGrid.jsx.txt`, `gridExport.js.txt`, `viewMemory.js.txt` and `legacy-grid` returned zero hits; current main and lane tree listings showed zero paths under `docs/design/legacy-grid/`. Direct source reads confirmed the two named spreadsheet consumers are migrated; this does not certify that all source patterns have zero exceptions.

Required future shell commands (not executed):

```bash
grep -Rnl 'TpoSpreadsheetGrid' src --include='*.tsx'
grep -Rnl 'ag-grid-react\|ag-grid-community' package.json package-lock.json src --include='*.tsx'
grep -Rnl 'themeQuartz\|ModuleRegistry.registerModules' src --include='*.tsx'
grep -RnlE '<table([[:space:]]|>)' src/components/tpo --include='*.tsx'
grep -Rnl 'grid/tpo-grid' src/components/tpo --include='*.tsx'
```

## Responsive and regression proof

- Phone: inherited cards, capped primary fields, optional details/actions disclosures, touch-sized selection. No AG Grid instance to screenshot.
- Tablet: `md` breakpoint switches to scrollable Table; sticky 48px checkbox column. Old Quartz tablet behavior unavailable.
- Desktop: per-column width/pin controls persist under storageKey, external filter panel remains, sort applied only to explicitly opted-in numeric/date fields.
- No CI, tests, app execution, or local screenshot comparison was performed by chat-14, per owner's development-only rule.
- **Safety**: vNext server responses, scope restrictions, URL filters, export permission checks, Row action callbacks, and existing saved-view APIs were not moved into the client adapter.
- **Main integration**: `main` has advanced independently and the lane has diverged; do not force-update or fake-rebase the lane, which would risk losing its unmerged UI commits. A normal conflict-aware merge/rebase in a checked-out worktree remains needed.

## Exact completion blockers, in order

1. Land the requested `docs/design/legacy-grid/*.txt` files in the accessible repository and the real AG Grid 36.2 package/lock declarations (owned by the party supplying the baseline; chat-14 did **not** change `package.json`).
2. Read the exact legacy `tpoGridTheme`, `TpoGrid`, export, memory, header-filter, choice-editor and saved-view sources and build an `AgGridReact` implementation in `grid/tpo-grid.tsx`.
3. Register `AllCommunityModule` once, map controlled row selection, selection pruning, column state, numeric/date-only sort, clipboard/export callbacks, option editors, and saved views without widening server permissions.
4. Resolve branch divergence against origin/main without discarding parallel lane edits; run the required greps in the checked-out repository, and record real counts.
5. Provide the complete, value-by-value legacy/vNext state table (default, hover, selected, focus, disabled, loading, empty, responsive). Only then tick E8.

## Continuation: fallback hardening (2026-10-19)

The AG Grid source remains unavailable and the package manifest does not declare either `ag-grid-community` or `ag-grid-react`. E8 is **[ ]**. This turn deliberately did not create unresolved imports, fabricate Quartz theme parameters, claim native AG Grid grid state, or run CI.

| Incremental contract | vNext evidence | Limit |
|---|---|---|
| Explicit engine identity | src/components/tpo/grid/tpo-grid.tsx:12 | `TpoGrid` still delegates to shared Table |
| Pinned checkbox separation | src/components/tpo/tpo-spreadsheet-grid.tsx:62 | 48px offset, no browser scroll proof |
| Safe clipboard fallback | src/components/tpo/tpo-spreadsheet-grid.tsx:160 | Browser clipboard permissions not executed |
| Deduplicated filtered selection | src/components/tpo/tpo-spreadsheet-grid.tsx:68 | Backend still owns authorized/filter-scoped `allIds` |
| Selection anchor cleanup | src/components/tpo/tpo-spreadsheet-grid.tsx:94 | No interactive keyboard test |
| Versioned data-free layout | src/components/tpo/tpo-spreadsheet-grid.tsx:50 | Sanitized `:layout-v3` storage on manual resize/pin; legacy `:layout-v2` restored when no valid v3 record, no AG Grid column API |
| v3 restore | src/components/tpo/tpo-spreadsheet-grid.tsx:104 | Saves widths/pins; URL column chooser remains source of visibility |

Source inspection was performed through GitHub file reads; **no** runtime, exhaustive repository grep, visual state matrix, or AG Grid integration evidence exists. Future continuation: `src/components/tpo/grid/tpo-grid.tsx` when upstream legacy-grid and declared AG Grid dependencies become available; otherwise work E1–E5 coverage.
