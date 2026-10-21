# Work packet (wave 2): edit src/components/ui/input.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md

## G2-11-031-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:138,167,225: field-specific primary/alternate phone and email placeholders.
- vNext now: src/components/ui/input.tsx:13-48: generic Input sets no placeholder, caller-owned.
- Fix: Audit every calling form placeholder.
