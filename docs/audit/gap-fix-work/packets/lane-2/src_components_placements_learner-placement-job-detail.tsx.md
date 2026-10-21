# Work packet: edit src/components/placements/learner-placement-job-detail.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

## G2-18-023-005  [P1] GAP  facet F03  effort M
- Legacy: Legacy apply button blocks with `reason` and `action` REGISTER/RULES; ApplyGate.java:28-45,61-83
- vNext now: vNext aggregate applicationBlockers text and availability CTA; learner-job-apply-blockers-model.ts:3-24; learner-placement-job-detail.tsx:~100-180
- Fix: Make CTA use same canonical denial and action code as actual apply service, including REGISTER/RULES link.

## G2-18-023-020  [P1] GAP  facet F08  effort M
- Legacy: ApplyGate returns actionable human reason and action `REGISTER`/`RULES` not success toast; ApplyGate.java:28-79
- vNext now: VNext availability status + blockers and navigation links, no code field shown; learner-job-apply-blockers-model.ts:3-24; learner-placement-job-detail.tsx:~125-185
- Fix: Keep denial reason as primary inline text, map actionCode to exact URL and don't declare OPEN from eligibility alone.
