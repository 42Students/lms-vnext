# CI fix packet (round 1): src/modules/messaging/receipt-history-service.ts

These are REAL errors reported by CI (GitHub Actions) on main. Fix every one of them in this file with the smallest correct change. Keep behaviour and wording; do not touch unrelated code; never use any, @ts-ignore, @ts-expect-error or eslint-disable to silence an error; no new packages. If a fix needs another file, edit it only if it is clearly part of the same error.

File: src/modules/messaging/receipt-history-service.ts

- [tsc] line 116:11 error TS2339: Property 'id' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 116:26 error TS2339: Property 'purpose' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 117:24 error TS2339: Property 'recipientSuffix' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 118:15 error TS2339: Property 'outcome' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 119:10 error TS2339: Property 'outcome' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 120:26 error TS2339: Property 'providerMessageId' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 122:18 error TS2339: Property 'collegeId' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 123:18 error TS2339: Property 'createdAt' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
- [tsc] line 124:17 error TS2339: Property 'provider' does not exist on type '{ statusLabel: string; failureSummary: any; }'.
