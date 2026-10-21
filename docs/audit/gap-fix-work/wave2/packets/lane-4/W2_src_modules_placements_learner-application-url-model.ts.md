# Work packet (wave 2): edit src/modules/placements/learner-application-url-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-063  [P2] GAP  facet F20  effort S
- Legacy: Malformed show falls back live; linked ID forces all `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:43-44`
- vNext now: Sanitizes duplicate/malformed filters independently `src/modules/placements/learner-application-url-model.ts:2-20`
- Fix: Preserve valid deep-link intent

## G2-12-006-033  [P3] GAP  facet F10  effort S
- Legacy: Switch view shallow replace clears other query params `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:43-44`
- vNext now: Filters preserved and page resets `src/modules/placements/learner-application-url-model.ts:22-33`
- Fix: Document intentional deep-link behavior change
