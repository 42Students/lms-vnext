# Work packet: edit src/components/admin/college-signin-method-form.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md

## G2-4-031-023  [P1] MISSING  facet F06  effort S
- Legacy: onDirtyChange/onBusyChange informs parent drawer close guard (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:79-89`)
- vNext now: No onDirtyChange/onBusyChange props; independent page form (`src/components/admin/college-signin-method-form.tsx:20-75`)
- Fix: Integrate route leave/close guard or restore parent callbacks.

## G2-4-031-067  [P1] GAP  facet F20  effort S
- Legacy: requestSeq cancels stale responses, busy callbacks lock parent (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:85,90-113`)
- vNext now: GuardedRun lock and version CAS but no parent dirty guard (`src/components/admin/college-signin-method-form.tsx:20-53`)
- Fix: Add unsaved navigation/parent drawer guard.

## G2-4-031-027  [P2] GAP  facet F07  effort S
- Legacy: Save failure toast Couldn't save sign-in settings: {server error} (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:124-125`)
- vNext now: Error Alert Could not save sign-in settings; stale 409 special (`src/components/admin/college-signin-method-form.tsx:47-52`)
- Fix: Preserve exact prefix and useful server details without exposing internals.

## G2-4-031-031  [P2] GAP  facet F08  effort S
- Legacy: Success toast Sign-in settings saved (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:121-122`)
- vNext now: Success inline Alert Sign-in settings saved (`src/components/admin/college-signin-method-form.tsx:44-46`)
- Fix: Match toast placement and visibility lifespan.

## G2-4-031-032  [P2] GAP  facet F08  effort S
- Legacy: Save error message exact Couldn't save sign-in settings: {msg} (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:125`)
- vNext now: Error copies Settings changed elsewhere... or Could not save sign-in settings. (`src/components/admin/college-signin-method-form.tsx:49-51`)
- Fix: Show stale conflict distinct but preserve ordinary copy in toast.
