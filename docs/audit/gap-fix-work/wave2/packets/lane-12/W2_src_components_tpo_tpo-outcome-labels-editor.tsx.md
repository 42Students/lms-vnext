# Work packet (wave 2): edit src/components/tpo/tpo-outcome-labels-editor.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-004  [P2] GAP  facet F02  effort M
- Legacy: useChoices.js:33-40 exposes all options to any consuming form.
- vNext now: src/components/tpo/tpo-outcome-labels-editor.tsx uses TPO-specific editor; no universal choices wrapper identified.
- Fix: Use consistent dropdown spacing and loading/empty fallback via reusable option source.
