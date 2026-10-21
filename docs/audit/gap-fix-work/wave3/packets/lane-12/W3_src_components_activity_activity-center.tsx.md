# Work packet (wave 3): edit src/components/activity/activity-center.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-audit-logs.md

## G2-9-027-011  [P1] MISSING  facet F04  effort L
- Legacy: Table columns Time, Action, Entity, Org, College, Actor, IP, User Agent `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:197-236`
- vNext now: Article badges, humanized summary and details; no tabular columns/IP/agent `src/components/activity/activity-center.tsx:123-189`
- Fix: Recreate tabular forensic columns and heading order.

## G2-9-027-063  [P1] MISSING  facet F23  effort L
- Legacy: Fidelity-focused developer audit table separate from ActivityCenter humanized feed `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:251-299`
- vNext now: Only humanized feed on /admin/audit alias `src/components/activity/activity-center.tsx:113-207`
- Fix: Restore a distinct Raw Audit Logs view alongside feed.
