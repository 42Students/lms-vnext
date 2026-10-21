# Work packet: edit src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-16-031-020  [P1] GAP  facet F07  effort M
- Legacy: TpoApplicantController.java:108-114 undo returns 409 'Too late to undo: the students have already been told'
- vNext now: src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts:18-32 has INVALID_TRANSITION/confirmation errors
- Fix: Maintain distinct applicant undo versus offer cascade undo; surface exact too-late explanation at affected action

## G2-16-031-054  [P1] GAP  facet F20  effort M
- Legacy: TpoApplicantController.java:108-114 undo fails 409 once students were notified
- vNext now: src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts:17-32 uses explicit confirmed, cascadeId UUID and errors
- Fix: Model applicant move undo separately from offer cascade undo; prevent stale or double undo and show remaining window
