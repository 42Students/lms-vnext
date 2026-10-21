# Work packet: edit src/components/admin/organization-actions.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-organizations.md, docs/audit/gap2/lane-6/organization.md

## G2-3-030-030  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:108-109`
- vNext now: `src/components/admin/organization-actions.tsx:45-65`
- Fix: Legacy Failed to update organization: <message>; vNext Rename failed / The organization could not be renamed.

## G2-3-030-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:121-122`
- vNext now: `src/components/admin/organization-actions.tsx:81-100`
- Fix: Legacy Failed to delete organization: <message>; vNext Archive blocked and specific active-college advice.

## G2-6-018-025  [P2] GAP  facet F07  effort S
- Legacy: Legacy deletion blocked if active college with exact Cannot delete organization: colleges exist under this organization (OrganizationServiceImpl.java:72-87).
- vNext now: vNext ORGANIZATION_HAS_COLLEGES and UI Archive or move active colleges before archiving this organization. (organizations/service.ts:253-257; organization-actions.tsx:81-89).
- Fix: Restore legacy confirmation/error messaging or document intentional Archive wording explicitly.

## G2-3-030-034  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:102-104`
- vNext now: `src/components/admin/organization-actions.tsx:59-64`
- Fix: Legacy Updated organization “name”. vs vNext Organization renamed, losing specific name.

## G2-3-030-035  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:118-120`
- vNext now: `src/components/admin/organization-actions.tsx:93-97`
- Fix: Legacy Deleted organization “name”. vs vNext Organization archived.
