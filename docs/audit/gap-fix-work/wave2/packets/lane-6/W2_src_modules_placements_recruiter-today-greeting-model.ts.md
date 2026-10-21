# Work packet (wave 2): edit src/modules/placements/recruiter-today-greeting-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md

## G2-13-002-014  [P2] GAP  facet F04  effort S
- Legacy: First name falls back from API user to Redux login user (`docs/legacy-source/frontend/src/pages/recruiter/home.js:44-45`)
- vNext now: Greeting derives first token from profile displayName (`src/modules/placements/recruiter-today-greeting-model.ts:2-10`)
- Fix: Use stored firstName preference if defined; otherwise retain fallback.

## G2-13-002-015  [P2] GAP  facet F04  effort S
- Legacy: Greeting clock uses viewer local hours (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:15-18`)
- vNext now: New forces `Asia/Kolkata` (`src/modules/placements/recruiter-today-greeting-model.ts:2-7`)
- Fix: Confirm policy IST-only and test remote browsers.

## G2-13-002-063  [P2] GAP  facet F18  effort S
- Legacy: Old greeting title Good morning/afternoon/evening, firstName (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:15-18`)
- vNext now: New same phrases, but profile displayName (`src/modules/placements/recruiter-today-greeting-model.ts:2-9`)
- Fix: Preserve legacy firstName source.

## G2-13-002-064  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle simply N thing(s) need you today (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:111-113`)
- vNext now: New appends Each one takes you straight to where it is done. (`src/modules/placements/recruiter-today-greeting-model.ts:8-10`)
- Fix: Use exact legacy subtitle.
