# Work packet: edit src/modules/activity/college-activity-export-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-051  [P1] GAP  facet F14  effort M
- Legacy: CSV Time,Who,What,Item,Action key,IP; IP from row (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:194-206`)
- vNext now: Same header but empty IP column (`src/modules/activity/college-activity-export-model.ts:29-60`)
- Fix: Approve IP redaction/privileged export policy; don't expose without authorization.
