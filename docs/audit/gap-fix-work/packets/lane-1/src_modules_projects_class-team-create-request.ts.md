# Work packet: edit src/modules/projects/class-team-create-request.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-7-020-042  [P2] GAP  facet F07  effort S
- Legacy: new.js:539-543 Pick the class to split into teams / Class is required in cohort mode
- vNext now: class-team-workspace-creator.tsx:165-169 native class Select; class-team-create-request.ts:1 Zod errors
- Fix: Render mode-specific validation on class picker
