# Work packet (wave 2): edit src/components/ui/select.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md

## G2-11-031-040  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:68-132: section form controls full width, AntD select.
- vNext now: src/components/ui/select.tsx:16-50: native select with browser-native popup.
- Fix: Check browser popup/height vs AntD at mobile and desktop.
