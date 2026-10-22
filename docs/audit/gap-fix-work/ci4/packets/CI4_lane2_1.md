# CI fix packet (round 4): src/app/(authenticated)/admin/audit/page.tsx

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/app/(authenticated)/admin/audit/page.tsx

- [tsc] line 121:43 error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
- [tsc] line 122:60 error TS2769: No overload matches this call.
- [tsc] line 123:29 error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
- [tsc] line 125:104 error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
- [tsc] line 128:87 error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
- [tsc] line 129:88 error TS2322: Type '{}' is not assignable to type 'ReactNode'.
- [tsc] line 130:63 error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
- [tsc] line 131:71 error TS2339: Property 'safeFailureCode' does not exist on type '{ id: unknown; purpose: unknown; provider: unknown; recipientSuffix: unknown; collegeId: unknown; outcome: unknown; providerMessageId: unknown; createdAt: unknown; statusLabel: string; failureSummary: any; }'.
