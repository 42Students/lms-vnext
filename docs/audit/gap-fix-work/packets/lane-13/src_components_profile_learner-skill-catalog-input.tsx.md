# Work packet: edit src/components/profile/learner-skill-catalog-input.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-6/skill.md

## G2-4-025-082  [P1] GAP  facet F23  effort M
- Legacy: Selection persists recent history and automatically increments popularity (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:313-350`)
- vNext now: Selection updates string only (`src/components/profile/learner-skill-catalog-input.tsx:62-64,80-85`)
- Fix: Add recent-history persistence and selection side effect without double submit.

## G2-6-016-001  [P1] GAP  facet F01  effort L
- Legacy: Global skill taxonomy consumed by old profile autocomplete (Skill.java:10-20; SkillsAutocomplete.jsx:13-42).
- vNext now: Read-only /api/skills and learner autocomplete (route.ts:12-27; learner-skill-catalog-input.tsx:7-22).
- Fix: Enable a verified catalog in all legacy profile entry points; do not treat dormant route as working UI.

## G2-4-025-028  [P2] GAP  facet F07  effort S
- Legacy: Dropdown error text `Failed to search. Please try again.` (`docs/legacy-source/frontend/src/components/Global/SkillsAutocomplete.jsx:264-279`)
- vNext now: `Skill catalog temporarily unavailable. You can save the entered skill name.` (`src/components/profile/learner-skill-catalog-input.tsx:75-77`)
- Fix: Use approved exact error copy and distinguish no DB-ready from network failure.
