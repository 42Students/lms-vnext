# Work packet (wave 2): edit src/app/api/college/classes/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md

## G2-2-031-001  [P2] GAP  facet F01  effort M
- Legacy: ClassController.java:31-35 has /api/v1/class with POST /create and PUT /update/{id}.
- vNext now: src/app/api/college/classes/route.ts:11-28 and [sectionId]/route.ts:11-34 use POST/PATCH paths.
- Fix: Map verb/path contracts for all old class-management callers.

## G2-2-031-017  [P2] GAP  facet F04  effort S
- Legacy: ClassController.java:103-106 create response `{status:'OK',message:'OK',data:class}` HTTP200.
- vNext now: college/classes/route.ts:18-19 HTTP201 `{section}`.
- Fix: Map old response consumers, method and status expectations.
