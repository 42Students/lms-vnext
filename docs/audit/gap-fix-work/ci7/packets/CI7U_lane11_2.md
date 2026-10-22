# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts (2 failing)
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-16 validates purpose-bound HMAC before touching private database

  ```
  AssertionError: expected "vi.fn()" to be called once, but got 0 times
  ❯ tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts:49:34
  47|   await expect(unsubscribeTpoCampaignRecipient("untrusted"))
  48|    .resolves.toEqual({unsubscribed:true});
  49|   expect(unknown.db.transaction).toHaveBeenCalledOnce();
  |                                  ^
  50|  });
  51|  it("campaign-unsubscribe-service-17 refuses missing campaign recipien…
  ```
- chat-16 TPO recipient unsubscribe live row decision > campaign-unsubscribe-service-18 validates locked college/campaign/recipient identity before changes

  ```
  AssertionError: promise resolved "{ unsubscribed: true }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + {
  +   "unsubscribed": true,
  }
  ```

## tests/unit/chat2-tpo-public-link-bounded-json.test.ts (1 failing)
- TPO-settings-audit-55 bounded recruiter and public join-link write boundaries > all public link and recruiter grant POST handlers check origin before bounded body

  ```
  AssertionError: src/app/api/placements/tpo/settings/recruiter-grants/route.ts: expected 'import { NextResponse } from "next/se…' to match /status:\s*400/
  - Expected:
  /status:\s*400/
  + Received:
  "import { NextResponse } from \"next/server\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { isSameOriginRequest } from \"@/auth/origin\";
  import { apiErrorResponse } from \"@/lib/api-error\";
  ```

## tests/unit/chat4-college-term-mapping-phone-actions.test.tsx (1 failing)
- COL-UX-TERM-MAPPINGS-04 keyboard/mobile curriculum mapping > retains the empty-state guidance instead of rendering a zero-row modal or phantom mapping

  ```
  AssertionError: expected '<section class="min-w-0 space-y-4 bor…' to contain 'Add Courses to Semester'
  Expected: "Add Courses to Semester"
  Received: "<section class="min-w-0 space-y-4 border-t border-border pt-4"><div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]"><section class="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4"><h2 class="text-lg font-semibold text-foreg
  ```

## tests/unit/chat5-placements-retention-and-joining-followups.test.ts (2 failing)
- PLACEMENTS-RETENTION-01 read-only application retention boundary > uses exactly the 180-day lookback and refuses malformed clocks

  ```
  AssertionError: expected 365 to be 180 // Object.is equality
  - Expected
  + Received
  - 180
  + 365
  ```
- PLACEMENTS-RETENTION-01 read-only application retention boundary > PLACEMENTS-RETENTION-02 keeps every old row college scoped and read-only in the persisted report

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'collegeApplicationRetentionCutoff(new…'
  - Expected
  + Received
  - collegeApplicationRetentionCutoff(new Date())
  + import "server-only";
  + import {and,count,desc,eq,inArray,lt,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```
