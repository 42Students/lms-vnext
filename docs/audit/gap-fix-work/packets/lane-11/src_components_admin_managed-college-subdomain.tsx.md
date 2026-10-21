# Work packet: edit src/components/admin/managed-college-subdomain.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-9-031-016  [P1] GAP  facet F05  effort S
- Legacy: Name must lowercase 3–30 ASCII alnum/hyphen `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:55-58`
- vNext now: Input allows up to63 and regex 1–63 `src/components/admin/managed-college-subdomain.tsx:15-16,59-67`
- Fix: Match 3–30 managed subdomain restriction or document intentional loosening.

## G2-9-031-025  [P1] GAP  facet F07  effort M
- Legacy: Exact regex requires 3–30 length and no leading/trailing hyphens `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:10,55-60`
- vNext now: Backend labelSchema likely accepts up to63, validates reserved names `src/modules/tenant-domains/managed-subdomain-model.ts:5-13` `src/components/admin/managed-college-subdomain.tsx:15-16`
- Fix: Validate old range/wording at client and server.

## G2-9-031-032  [P1] GAP  facet F09  effort M
- Legacy: Move Modal title with destination, content old address stops working immediately and others need new one `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:80-88`
- vNext now: Generic Confirm the managed web address change for this college `src/components/admin/managed-college-subdomain.tsx:78-87`
- Fix: Restore consequential move warning verbatim and Keep current.

## G2-9-031-033  [P1] GAP  facet F09  effort M
- Legacy: Remove Modal warns college becomes unreachable at this address; data unaffected `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:93-100`
- vNext now: Generic confirmation with Current host only `src/components/admin/managed-college-subdomain.tsx:78-88`
- Fix: Explain loss of access and data unaffected before Remove.

## G2-9-031-026  [P2] GAP  facet F07  effort S
- Legacy: Error Use 3 to 30 lowercase letters, numbers or hyphens, starting and ending with a letter or number. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:56-59`
- vNext now: Error Use letters, numbers or internal hyphens without leading/trailing hyphens. `src/components/admin/managed-college-subdomain.tsx:67-67`
- Fix: Restore exact validation copy.

## G2-9-031-031  [P2] GAP  facet F08  effort S
- Legacy: Remove failure Couldn't remove the address. Try again. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:110-110`
- vNext now: Show API code/Request failed error inline `src/components/admin/managed-college-subdomain.tsx:33-48`
- Fix: Show actionable removal failure text.

## G2-9-031-027  [P3] GAP  facet F07  effort S
- Legacy: Allot error Couldn't allot this address. Try again. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:71-74`
- vNext now: Maps server error codes to conflicts/not ready/stale `src/components/admin/managed-college-subdomain.tsx:33-39`
- Fix: Keep specific new conflicts but include old fallback wording.

## G2-9-031-030  [P3] GAP  facet F08  effort S
- Legacy: Remove success Web address removed `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSubdomain.js:108-108`
- vNext now: Managed web address removed. `src/components/admin/managed-college-subdomain.tsx:44-46`
- Fix: Use exact success copy.
