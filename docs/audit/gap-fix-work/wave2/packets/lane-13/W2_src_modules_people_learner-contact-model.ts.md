# Work packet (wave 2): edit src/modules/people/learner-contact-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-013  [P2] GAP  facet F04  effort M
- Legacy: `ContactDTO.java:20-27` primary/alternate mobile plus contact email.
- vNext now: `learner-contact-model.ts:4-16` edits alternatePhone/contactEmail; primary stays canonical identity, `learner-profile-workspace.tsx:351-390`.
- Fix: Preserve primary-vs-alternate mapping and displayed value ownership.

## G2-1-004-027  [P2] GAP  facet F06  effort M
- Legacy: `LearnerProfileServiceImpl.java:343-387` alternate 10–15 digits, cannot equal primary; primary required if alternate.
- vNext now: `learner-contact-model.ts:10-29` checks digit count/email and workspace `:351-369` client checks primary.
- Fix: Enforce alternate≠primary and primary prerequisite on server mutation path.
