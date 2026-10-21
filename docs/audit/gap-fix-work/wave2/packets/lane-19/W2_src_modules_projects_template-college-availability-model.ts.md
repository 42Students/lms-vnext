# Work packet (wave 2): edit src/modules/projects/template-college-availability-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-060  [P2] GAP  facet F19  effort M
- Legacy: colleges.js:165-168 local immediate search on full loaded colleges
- vNext now: template-college-availability-model.ts:15-18 search inside service, route GET Filter button
- Fix: Restore live local filter where efficient or debounce remote search
