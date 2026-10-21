# Work packet (wave 2): edit src/modules/placements/tpo-audit-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-audit.md

## G2-11-006-013  [P2] GAP  facet F04  effort M
- Legacy: Action rendered by legacy `actionText` map (e.g. BULK_RUN => Bulk action). `docs/legacy-source/frontend/src/components/tpo/ui/labels.js:30`
- vNext now: New event formatter uses different mapping and normalized fallback. `src/modules/placements/tpo-audit-model.ts:121`
- Fix: Port each action-label override with exact-string tests.

## G2-11-006-014  [P2] GAP  facet F04  effort S
- Legacy: Actor name missing: fallback `label(actor,actorType)` (Placement team, Recruiter, Student...). `docs/legacy-source/frontend/src/pages/tpo/audit.js:156`
- vNext now: Missing name always rendered `System / unknown`. `src/modules/placements/tpo-audit-model.ts:179`
- Fix: Preserve safe role-based fallback text.
