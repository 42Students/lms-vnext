# Work packet: edit src/components/admin/college-logo-uploader.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-branding.md

## G2-9-030-023  [P1] GAP  facet F06  effort L
- Legacy: Image chosen inside Ant Form.Item `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-169`
- vNext now: Independent upload commits before branding form Save `src/components/admin/college-logo-uploader.tsx:92-120`
- Fix: Align upload/save transaction semantics

## G2-9-030-034  [P1] GAP  facet F09  effort L
- Legacy: Replaced logo staged as stale key, not deleted until Save succeeds `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46`
- vNext now: Logo Remove immediately persists via DELETE `src/components/admin/college-logo-uploader.tsx:38-48`
- Fix: Do not remove referenced logo before main Save commit

## G2-9-030-037  [P1] GAP  facet F10  effort L
- Legacy: deleteFileFromR2 called only after successful save `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46,97-109`
- vNext now: Logo DELETE separated from branding Save `src/components/admin/college-logo-uploader.tsx:38-48` `src/app/api/colleges/[collegeId]/branding/logo/route.ts:9-30`
- Fix: Add deferred cleanup/staged mutation

## G2-9-030-044  [P1] GAP  facet F12  effort L
- Legacy: Deletion deferred until upsert successful `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:38-46,97-108`
- vNext now: Immediate Remove uploaded logo transaction `src/components/admin/college-logo-uploader.tsx:38-48`
- Fix: Stage/delete only after new effective logo persisted

## G2-9-030-050  [P1] GAP  facet F14  effort L
- Legacy: Deletes stale storage keys after successful Save `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:104-109`
- vNext now: Independent logo object deletion `src/app/api/colleges/[collegeId]/branding/logo/route.ts:38-60` `src/components/admin/college-logo-uploader.tsx:38-48`
- Fix: Prevent broken login if form Save abandoned
