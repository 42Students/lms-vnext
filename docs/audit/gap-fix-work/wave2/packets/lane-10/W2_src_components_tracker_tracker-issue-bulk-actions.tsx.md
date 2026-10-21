# Work packet (wave 2): edit src/components/tracker/tracker-issue-bulk-actions.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u004-tracker-issues-index.md

## G2-16-004-012  [P2] GAP  facet F03  effort M
- Legacy: `issues/index.js:344-365`: bulk bar has checkbox `All on this page`, count, status select and `Apply`.
- vNext now: `tracker-issue-bulk-actions.tsx:66-91`: separate Select this page and Clear selection buttons, count, `Apply to N selected`.
- Fix: Use legacy select-all checkbox and Apply button; keep vNext accessible select grouping.

## G2-16-004-043  [P2] GAP  facet F10  effort M
- Legacy: `issues/index.js:200-217`; `trackerBulk.js:6-30`: 3 concurrent individual status PATCH calls, per-item result.
- vNext now: `tracker-issue-bulk-actions.tsx:27-56`: sequential individual version-checked workflow PATCH, distinct success/failure handling.
- Fix: Use concurrency cap 3 for large batch with CAS refresh/retry, and preserve failed selection.

## G2-16-004-049  [P2] GAP  facet F12  effort M
- Legacy: `issues/index.js:343-349`: `All on this page` tri-state checkbox selected based on row IDs.
- vNext now: `tracker-issue-bulk-actions.tsx:66-79`: two explicit select-all and clear buttons, no indeterminate state.
- Fix: Restore all-on-page tri-state checkbox and count.

## G2-16-004-060  [P2] GAP  facet F17  effort M
- Legacy: `issues/index.js:315-320`: selectable cards include checkbox aria-label `Select <ID>` but inner checkbox tabindex=-1.
- vNext now: `tracker-issue-bulk-actions.tsx:73-78`: labelled input checkbox separate from card, keyboard toggles.
- Fix: Ensure whole-card keyboard Enter/Space toggles in select mode and individual checkbox accessible.

## G2-16-004-073  [P2] GAP  facet F20  effort M
- Legacy: `trackerBulk.js:6-30`: bulk worker concurrency 3 and partial results, no all-or-nothing atomicity.
- vNext now: `tracker-issue-bulk-actions.tsx:35-56`: serial PATCH, preserves partial results but keeps full selection on failure.
- Fix: Use bounded parallelism 3, retry failed IDs only, record partial status.

## G2-16-004-011  [P3] GAP  facet F03  effort S
- Legacy: `issues/index.js:283-291`: `Select issues` / `Cancel selection` only for managers.
- vNext now: `tracker-issue-bulk-actions.tsx:59-65`: always available inside already Super Admin-only page, label `Close selection`.
- Fix: Restore `Cancel selection` text and initial compact manager-only button.

## G2-16-004-056  [P3] GAP  facet F15  effort S
- Legacy: `issues/index.js:204-215`: bulk mutations immediately generate success/error toasts; no emails on client.
- vNext now: `tracker-issue-bulk-actions.tsx:47-56,93-94`: inline feedback; DB action appends activity, no emails in reviewed route.
- Fix: Match in-app toasts; do not introduce emails without backend evidence.

## G2-16-004-066  [P3] GAP  facet F18  effort S
- Legacy: `issues/index.js:288`: `Cancel selection`.
- vNext now: `tracker-issue-bulk-actions.tsx:62`: `Close selection`.
- Fix: Use `Cancel selection`.

## G2-16-004-067  [P3] GAP  facet F18  effort S
- Legacy: `issues/index.js:361-363`: bulk button `Apply`.
- vNext now: `tracker-issue-bulk-actions.tsx:87-90`: `Apply to N selected`.
- Fix: Restore `Apply` and adjacent count label.
