# Work packet: edit src/modules/projects/readiness-override-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

## G2-7-004-046  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:637-655: existing final submission takes precedence and override has no effect.
- vNext now: V/components/projects/project-workspace-readiness.tsx:41-42; modules/projects/readiness-override-model.ts:7-9: isReady calculation ignores existence of final submission.
- Fix: Derive final verdict from submission gate precedence, not override alone.
