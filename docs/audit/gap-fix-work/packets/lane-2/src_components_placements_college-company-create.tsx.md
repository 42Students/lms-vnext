# Work packet: edit src/components/placements/college-company-create.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-companies.md

## G2-9-004-028  [P1] MISSING  facet F07  effort M
- Legacy: Logo URL optional valid HTTPS max500 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-490`)
- vNext now: Logo field absent entirely (`src/components/placements/college-company-create.tsx:51-73`)
- Fix: Support canonical logo URL or permitted upload under signed object scheme.

## G2-9-004-030  [P1] MISSING  facet F07  effort M
- Legacy: Industry optional length100, example IT Services (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:491-493`)
- vNext now: No industry field in create form (`src/components/placements/college-company-create.tsx:51-72`)
- Fix: Restore industry editing in authorized company-identity workflow.

## G2-9-004-032  [P1] MISSING  facet F07  effort M
- Legacy: Contact person max150, email max150, phone regex max30 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:498-505`)
- vNext now: Contact fields absent (`src/components/placements/college-company-create.tsx:51-73`)
- Fix: Reinstate college-scoped contact details or privileged edit; preserve exact validation.

## G2-9-004-033  [P1] MISSING  facet F07  effort M
- Legacy: Internal notes rows2 max2000, placement-team-only tooltip (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:509-519`)
- vNext now: Internal notes absent (`src/components/placements/college-company-create.tsx:50-75`)
- Fix: Provide private relationship-scoped notes with proper access restrictions.

## G2-9-004-041  [P1] MISSING  facet F09  effort M
- Legacy: Dirty cancel nested Discard unsaved changes?/Keep editing (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:451-466`)
- vNext now: Cancel closes inline form immediately (`src/components/placements/college-company-create.tsx:72-80`)
- Fix: Add dirty change confirmation.

## G2-9-004-027  [P2] GAP  facet F07  effort M
- Legacy: Name required 2..150, placeholder e.g. Infosys Limited (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:480-490`)
- vNext now: Name required min2/max150, no example placeholder (`src/components/placements/college-company-create.tsx:52-58`)
- Fix: Add example placeholder and exact inline error copy.

## G2-9-004-031  [P2] MISSING  facet F07  effort M
- Legacy: Description textarea rows3 max2000 showCount (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:494-497`)
- vNext now: Description absent (`src/components/placements/college-company-create.tsx:52-75`)
- Fix: Add canonical description field and persisted service support.

## G2-9-004-034  [P2] GAP  facet F07  effort M
- Legacy: Form errors map logo_url/contact_person/email/phone/internal_notes (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:478-489`)
- vNext now: Only one generic error banner and first Zod issue (`src/components/placements/college-company-create.tsx:28-43`)
- Fix: Attach server errors to fields with exact legacy messages.

## G2-9-004-035  [P2] GAP  facet F08  effort M
- Legacy: Create/Edit success toasts 'Company created'/'Company updated' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:165-194`)
- vNext now: Create success Company added to this college... (`src/components/placements/college-company-create.tsx:32-42`)
- Fix: Use legacy toast title, retain explanatory detail.

## G2-9-004-036  [P2] GAP  facet F08  effort M
- Legacy: Failed save shows 'Company was not saved' alert and field errors (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:192-217`)
- vNext now: Error Could not add this company... text (`src/components/placements/college-company-create.tsx:38-42`)
- Fix: Restore dismissible save alert and inline field messages.
