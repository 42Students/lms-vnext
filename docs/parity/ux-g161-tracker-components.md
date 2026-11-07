# UX-G161 — Tracker interactive components

**Canonical state: DOING.** Eight interactive component sources belong to this group.

## Audited scope

- `audit-finding-status-action.tsx`: successful audited transition now locks stale version until server refresh; props version/current change re-syncs draft status and prevents an outdated second mutation.
- `tracker-live-logs-explorer.tsx`: CSV now uses shared Unicode-safe `spreadsheetCsvCell` for every untrusted field (including format/control/combining prefixes), while preserving existing static CSV header and LF row contract required by downstream consumers.
- `independent-finding-actions.tsx`, `known-errors-workspace.tsx`, `tracker-quick-report-launcher.tsx`, `tracker-report-form.tsx`, `tracker-telegram-manual-panel.tsx`, `tracker-workflow-panel.tsx`: audited component inventory for form/dialog/triage/alert/export states; other flows are not counted as newly browser-verified.

## Tests and verification debt

- Existing regression `tests/unit/chat16-SA-placements-projects-117-export-evidence.test.ts` asserts the original CSV header/line count; the compatibility contract was preserved. New `tests/unit/ux-five-group-batch-20261107.test.ts` tests Unicode-obscured formula cells and stale finding-state contract.
- Browser spec `tests/e2e/ux-five-group-batch-20261107.spec.ts` covers authenticated report route at 1280px and 390px with screenshot paths, when executed.
- Need exact-SHA CI results and real desktop/mobile testing for create report, similar search, attachments, known errors, status transitions, conflict, Telegram test/digest, log downloads, permission denials, no exported private secrets and screen reader focus.
- Server-side audit authorization, immutable records and redaction remain authoritative. No new export endpoint or permission was created.

**Do not mark DONE** until tests and authenticated browser matrix pass on an exact SHA and evidence is recorded in canonical tracker.
