# Work packet (wave 2): edit src/modules/placements/learner-college-placement-rules-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-023-009  [P2] GAP  facet F04  effort M
- Legacy: Rules JSON includes countsAsPlacedAt,maxHeldOffers,upliftPct,minResponseHours,summary,personalNote,points; LearnerEligibilityController.java:107-121
- vNext now: vNext policy read returns points,personal from college rule model, no exact summary field; learner-placement-rules-service.ts:34-55; learner-college-placement-rules-model.ts:7-35
- Fix: Preserve exact TPO sentence/template and personal-note verbatim where applicable; handle batch override.

## G2-18-023-060  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementRulesService.java:203-235 personal sentence 'You hold an offer of ₹X LPA...' and Dream
- vNext now: src/modules/placements/learner-college-placement-rules-model.ts:28-33 similar personal sentence but different no-offer/null-CTC variants
- Fix: Clone old exact text where policy status truly matches; retain safe unknown data states.
