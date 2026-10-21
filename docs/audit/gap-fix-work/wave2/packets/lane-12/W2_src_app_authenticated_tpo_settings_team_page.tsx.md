# Work packet (wave 2): edit src/app/(authenticated)/tpo/settings/team/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-team-redirect.md

## G2-4-028-008  [P2] GAP  facet F02  effort S
- Legacy: Settings team is inside grouped Settings page (`docs/legacy-source/frontend/src/pages/tpo/settings.js:50-72,152`)
- vNext now: Separate route /tpo/settings/team and compact nav (`src/app/(authenticated)/tpo/settings/team/page.tsx:45-60`)
- Fix: Support old /tpo/settings?tab=team route.

## G2-4-028-040  [P2] GAP  facet F13  effort S
- Legacy: Error/forbidden states show Retry/info Alert (`docs/legacy-source/frontend/src/pages/tpo/settings.js:154-171`)
- vNext now: Access failure may redirect or throw (`src/app/(authenticated)/tpo/settings/team/page.tsx:28-35`)
- Fix: Restore informative access and retry UI.

## G2-4-028-043  [P2] MISSING  facet F15  effort S
- Legacy: Member removal also removes access to private conversations (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-86`)
- vNext now: No removal action (`src/app/(authenticated)/tpo/settings/team/page.tsx:124-160`)
- Fix: Audit notifications and access revocation in restored flow.

## G2-4-028-050  [P2] GAP  facet F18  effort S
- Legacy: Placement team description mentions who is on team, ownership and away (`docs/legacy-source/frontend/src/pages/tpo/settings.js:56`)
- vNext now: Read-only directory description (`src/app/(authenticated)/tpo/settings/team/page.tsx:47-49`)
- Fix: Use approved Settings Team copy.
