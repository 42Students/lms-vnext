# CI fix packet (round 1): src/modules/placements/tpo-company-memory-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/placements/tpo-company-memory-service.ts

- [tsc] line 324:24 error TS2304: Cannot find name 'countResult'.
- [tsc] line 325:24 error TS2304: Cannot find name 'countResult'.
- [tsc] line 327:22 error TS2304: Cannot find name 'countResult'.
- [tsc] line 332:41 error TS2345: Argument of type '{ jobId: string; countsAsPlaced: boolean | null; jobStatus: string; archivedAt: Date | null; offerStatus: string | null; offerKind: string | null; membershipId: string | null; joiningStatus: string | null; joiningDate: string | null; }[]' is not assignable to parameter of type 'readonly CompanyPlacementOfferFact[]'.
- [tsc] line 445:38 error TS2345: Argument of type '{ jobId: string; countsAsPlaced: boolean | null; jobStatus: string; archivedAt: Date | null; offerStatus: string | null; offerKind: string | null; membershipId: string | null; joiningStatus: string | null; joiningDate: string | null; }[]' is not assignable to parameter of type 'readonly CompanyPlacementOfferFact[]'.
- [tsc] line 446:37 error TS2345: Argument of type '{ jobId: string; countsAsPlaced: boolean | null; jobStatus: string; archivedAt: Date | null; offerStatus: string | null; offerKind: string | null; membershipId: string | null; joiningStatus: string | null; joiningDate: string | null; }[]' is not assignable to parameter of type 'readonly CompanyPlacementOfferFact[]'.
