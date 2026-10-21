# Work packet: edit src/modules/placements/tpo-debar-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-024  [P1] GAP  facet F09  effort M
- Legacy: Legacy debar form via StudentActions/StudentPanel  `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:1-100`
- vNext now: VNext TpoDebarControl may implement only tagged participation override, not DB08 timed debar `src/modules/placements/tpo-debar-model.ts:1-45`
- Fix: Expose timed/drive-count debar separately; avoid misleading generic button.
