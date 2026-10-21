# Work packet: edit src/components/projects/project-readiness-override-form.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-032-026  [P1] GAP  facet F06  effort M
- Legacy: readiness/index.js:657-674 Override required, no default when no previous override
- vNext now: project-readiness-override-form.tsx:28 default CLEAR even when no override
- Fix: Start unset until explicit choice; don't preselect meaningless CLEAR

## G2-7-032-032  [P1] GAP  facet F07  effort S
- Legacy: readiness/index.js:657 Choose an override state
- vNext now: project-readiness-override-form.tsx:28 default CLEAR and :35-43 no missing-state validation
- Fix: Block submit until a real state is chosen; exact error copy

## G2-7-032-034  [P2] GAP  facet F07  effort S
- Legacy: readiness/index.js:303 Failed to update readiness fallback via showProjectErrorMessage
- vNext now: project-readiness-override-form.tsx:60-62 generic copy.failed
- Fix: Preserve safe backend cause and exact fallback

## G2-7-032-037  [P2] GAP  facet F08  effort S
- Legacy: readiness/index.js:286 toast Readiness updated
- vNext now: project-readiness-override-form.tsx:57-59 inline feedback copy.updated
- Fix: Use same success toast and duration
