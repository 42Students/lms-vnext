# Work packet (wave 2): edit src/modules/admin-ui/super-admin-program-input.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md

## G2-10-020-019  [P2] GAP  facet F04  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:119-123 — Create sends dept_id/name/duration_years only.
- vNext now: src/components/admin/admin-program-directory.tsx:104-125; src/modules/admin-ui/super-admin-program-input.ts:6-10 — New code auto-derived from program name and durationYears translated to terms.
- Fix: Keep code opt-in or transparent; verify generated code uniqueness on collisions.
