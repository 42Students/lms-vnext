# CI fix packet (round 1): src/modules/admin-ui/super-admin-scoped-people-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/admin-ui/super-admin-scoped-people-service.ts

- [tsc] line 171:21 error TS2304: Cannot find name 'desc'.
- [tsc] line 191:20 error TS2339: Property 'facultyContactEmail' does not exist on type '{ id: any; status: any; collegeId: any; organizationId: any; userId: string; suspendedAt: any; legacyMembershipId: any; joinedAt: any; name: string | null; platformStatus: "ACTIVE" | "DISABLED"; ... 18 more ...; classNames: string | null; }'.
- [tsc] line 191:62 error TS2339: Property 'facultyContactMobile' does not exist on type '{ id: any; status: any; collegeId: any; organizationId: any; userId: string; suspendedAt: any; legacyMembershipId: any; joinedAt: any; name: string | null; platformStatus: "ACTIVE" | "DISABLED"; ... 18 more ...; classNames: string | null; }'.
