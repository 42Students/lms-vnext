# Work packet: edit src/app/(authenticated)/tpo/settings/team/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-team-redirect.md

## G2-4-028-011  [P1] MISSING  facet F03  effort S
- Legacy: Add a team member action in Settings People (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:132-140`)
- vNext now: Read-only team directory (`src/app/(authenticated)/tpo/settings/team/page.tsx:124-160`)
- Fix: Restore Add member action.

## G2-4-028-012  [P1] MISSING  facet F03  effort S
- Legacy: Remove team member with impact confirmation (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-86`)
- vNext now: No remove row action (`src/app/(authenticated)/tpo/settings/team/page.tsx:124-160`)
- Fix: Implement guarded Remove member.

## G2-4-028-020  [P1] MISSING  facet F06  effort S
- Legacy: Admin searches faculty directory to add (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:89-92`)
- vNext now: Read-only roster has no faculty search (`src/app/(authenticated)/tpo/settings/team/page.tsx:124-160`)
- Fix: Reintroduce add search field.

## G2-4-028-028  [P1] MISSING  facet F09  effort S
- Legacy: Danger confirmation Remove X from placement team with consequences (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:83-86`)
- vNext now: No removal modal (`src/app/(authenticated)/tpo/settings/team/page.tsx:124-160`)
- Fix: Implement exact confirmation modal.

## G2-4-028-032  [P1] MISSING  facet F10  effort S
- Legacy: Settings team renders TeamPeople mutation actions (`docs/legacy-source/frontend/src/pages/tpo/settings.js:152`)
- vNext now: Only getTpoPlacementTeam roster read (`src/app/(authenticated)/tpo/settings/team/page.tsx:28-43`)
- Fix: Migrate create/remove/reassign APIs.

## G2-4-028-023  [P2] GAP  facet F07  effort S
- Legacy: Access error causes retry and forbidden is distinct (`docs/legacy-source/frontend/src/pages/tpo/settings.js:131-150`)
- vNext now: Non-TPO redirected dashboard (`src/app/(authenticated)/tpo/settings/team/page.tsx:28-35`)
- Fix: Provide settings permission retry state.

## G2-4-028-026  [P2] MISSING  facet F08  effort S
- Legacy: Removal success toast Removed from the team (`docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:83-86`)
- vNext now: Removal flow absent (`src/app/(authenticated)/tpo/settings/team/page.tsx:124-160`)
- Fix: Restore successful removal toast.
