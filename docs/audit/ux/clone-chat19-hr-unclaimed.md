# Chat-19 — HR spillover (unclaimed-file audit)

Compared the complete current repository tree against **both** work queues:
`docs/audit/ux/clone-hr.md` (chat-15) and `docs/audit/ux/clone-hr-secondary.md` (chat-18).
The four files below were the **only unclaimed** HR/recruiter source files in:
`src/app/(authenticated)/hr/**`, `src/app/(authenticated)/recruiter/**`,
`src/components/hr/**`, and `src/components/placements/recruiter-*`.
All other 148 source files in that area are owned by the two other lanes.
Do not modify their pages or tick their separate queues.

## Finished file inventory (source-level)

The four adapters are independent, authorized-row *data adapters*, not pages.
Therefore a nested PageHeader, Card, status-chip bar, Button, form control, or
empty-state canvas would violate the existing component contract.
Their single shared `TpoGrid` renders the original column chooser/copy controls,
AG Grid desktop, mobile spreadsheet fallback and empty-row overlay.
The shared engine is in `src/components/tpo/grid/tpo-grid.tsx:68-71,220-266`.
The adapter supplies values and stable keys only.

- [x] `src/components/hr/hr-company-reports-grid.tsx` — 50 lines; shared `TpoGrid` at 39-48; all ten columns (15-33), five numeric sort kinds, authorized job row id, mobile primary columns 41; real `StatusBadge` 43 and safe encoded drive link 44-47. No nested Card, raw controls, h1, local tabs or literal hex.
- [x] `src/components/hr/hr-job-offers-grid.tsx` — 39 lines; shared `TpoGrid` at 35-37, seven columns at 20-29, numeric CTC sorting and server-scoped storage key. Existing `TpoGrid` owns zero-row display, column chooser, responsive layout and controls.
- [x] `src/components/hr/hr-job-selection-grid.tsx` — 33 lines; shared `TpoGrid` at 29-31, four columns, numeric CTC sort, mobile columns 30, scoped storage; deliberately **no** college-only verification or mutation control.
- [x] `src/components/hr/hr-round-results-grid.tsx` — 35 lines; shared `TpoGrid` at 31-33; five columns, numeric score/rank sort, preserves null score/rank, stable composite key and round-scoped column preferences.

## Packages checked for each file

| Package | Verification and source |
|---|---|
| PageHeader | None of the four files is a page and none declares `h1`; the owning HR route page controls PageHeader. Creating a second title inside a spreadsheet is a regression. |
| Badge/chips/tabs | Company report uses shared StatusBadge at 5,43; other files only provide spreadsheet column values, leaving renderer to the shared grid. No local chips/tabs. |
| Button/Input/Select | 0 raw control tags across all 4; the shared grid uses Button/Checkbox/column chooser in `tpo-grid.tsx:20-22,190-199,220-224`. |
| Colors/fonts | 0 hex literals and 0 hardcoded Tailwind color styles in all 4. |
| Card nesting | 0 Card imports, 0 Card wrappers. One grid surface each. |
| Loading/empty/error | Parent HR route handles request loading and errors; all four receive already-authorized rows. Shared `TpoGrid` has empty-state overlay at `tpo-grid.tsx:252` and mobile fallback at 260-265. Local nested states would duplicate content. |
| Responsive | Each adapter sets `mobilePrimaryKeys` at its invocation; 768px and wider AG Grid desktop at `tpo-grid.tsx:226`, below 768px existing accessible spreadsheet fallback at 260-265. |
| Security/behaviour | None imports a client fetch or mutation. All four retain server-supplied row keys, numeric sort values, and per-scope storage. |
| Syntax/imports | Re-read all four source files. `TpoGrid`, `TpoGridColumn` and `StatusBadge` imports resolve. No element rename required, so existing paired JSX tags are unchanged. |

**Coverage searches applied to all four fetched file contents:** regex
`<(h1|button|input|select|textarea|table)(?=[\\s>])` → **0 matches**;
`#[0-9a-fA-F]{3,8}` → **0**;
`rounded-(full|lg|xl)|border-b-2|aria-pressed` → **0**;
`<Card|<PageHeader` → **0**.
A non-executed regression suite has been authored:
`tests/unit/chat19-unclaimed-hr-grid-parity.test.ts`.

**Status:** All four unclaimed adapter files are **source-reviewed** and have
no local control/style migration to make. This does *not* tick chat-15/chat-18's
entire HR portal, nor does it certify AG Grid runtime or visual parity.

**Upstream blocker (not owned by chat-19):** `src/components/tpo/grid/tpo-grid.tsx:15-19`
imports `ag-grid-react` and `ag-grid-community`, but current `package.json`
contains neither package in dependencies or devDependencies. All four adapters
are therefore structurally ready but cannot be certified buildable until the
shared AG Grid owner registers those dependencies and the package lock.
Do not replace the intended AG Grid with duplicated local hand-rolled tables.
No CI/application code was run.
