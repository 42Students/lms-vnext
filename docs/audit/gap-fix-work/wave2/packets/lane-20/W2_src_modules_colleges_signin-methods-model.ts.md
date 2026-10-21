# Work packet (wave 2): edit src/modules/colleges/signin-methods-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-025  [P2] GAP  facet F06  effort S
- Legacy: Mini sketch render varies order email first vs phone first (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:20-40`)
- vNext now: Computes primary channel but UI does not render visual order (`src/modules/colleges/signin-methods-model.ts:4-7`)
- Fix: Render channel order sketch from capabilities.
