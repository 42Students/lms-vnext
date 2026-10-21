# Work packet (wave 3): edit src/components/projects/project-template-view.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-035-019  [P1] MISSING  facet F04  effort L
- Legacy: overview.js:653-715 submissionType LINK/FILE/TEXT and instructions
- vNext now: project-template-view.tsx:3-34 blueprint overview has no submission type/instruction output
- Fix: Expose and edit submission type/instructions in versioned blueprint

## G2-7-035-025  [P1] MISSING  facet F06  effort L
- Legacy: overview.js:654-690 Goal, deliverables, Definition of done, personas, one item per line
- vNext now: project-template-view.tsx:69-90 display-only Goal/deliverables/DoD; no personas edit
- Fix: Add goal, deliverables, DoD and personas editor with text-to-list validation

## G2-7-035-026  [P1] MISSING  facet F06  effort L
- Legacy: overview.js:698-715 optional submissionType plus instructions
- vNext now: project-template-view.tsx:3-34 no form, metadata dialog has summary only
- Fix: Restore submission controls and clearing semantics
