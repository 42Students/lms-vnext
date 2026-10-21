# Work packet: edit src/modules/projects/risk-signals.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md

## G2-7-001-041  [P1] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/adminProjectUtils.js:263-281: pending includes submitted OR under review in resolvedDelivery/delivery.
- vNext now: V/modules/projects/admin-insights-service.ts:532-541; modules/projects/risk-signals.ts:72-77: latest-version SUBMITTED and ACTIVE status only.
- Fix: Support equivalent under-review semantics or explicitly migrate states.
