# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-placements-admin-mutations.test.ts (2 failing)
- chat-13 additional admin mutation and recruiter account security > SA-PUBLISHED-DRIVE-EDIT-01 refuses tampered versions, arbitrary labels, duplicate locations and reversed CTC

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-13 additional admin mutation and recruiter account security > SA-BULK-DRIVE-01 bounds destructive multi-action input and maintains partial failure ledger

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'z.array(z.uuid()).min(1).max(25)'
  - Expected
  + Received
  - z.array(z.uuid()).min(1).max(25)
  + import "server-only";
  + import { and, count, eq, inArray } from "drizzle-orm";
  + import { z } from "zod";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/chat13-superadmin-bulk-drives.test.ts (1 failing)
- Super Admin bulk drive actions > SA-placements-projects-11 limits confirmed writes to 25 unique drives and the chosen college

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'z.array(z.uuid()).min(1).max(25)'
  - Expected
  + Received
  - z.array(z.uuid()).min(1).max(25)
  + import "server-only";
  + import { and, count, eq, inArray } from "drizzle-orm";
  + import { z } from "zod";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/chat14-final-tpo-drives-48.test.ts (1 failing)
- chat-14 final sprint > TPO-drives-48 allows audited PUBLISHED changes but still blocks CLOSED and inactive seasons

  ```
  AssertionError: expected 'ALLOW' to be 'READ_ONLY' // Object.is equality
  Expected: "READ_ONLY"
  Received: "ALLOW"
  ```

## tests/unit/chat15-quiz-table-legacy.test.ts (1 failing)
- Chat-15 learner quizzes table parity > LEARNER-learning-misc-16 presents the seven legacy quiz table columns and honest grade disclosure

  ```
  AssertionError: expected '"use client";\nimport { StatTile } fr…' to contain 'Lesson'
  - Expected
  + Received
  - Lesson
  + "use client";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import styles from "./learner-assessment-metrics.module.css";
  + import { AssessmentMetricGlyph } from "./learner-assessment-metric-glyph";
  ```

## tests/unit/chat16-inbound-mail-admin-page-16.test.tsx (3 failing)
- chat-16 inbound-mail Super Admin page-level failure and privacy journeys > UX-chat16-inbound-mail-01 checks permission before reading filters or mailbox data

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 inbound-mail Super Admin page-level failure and privacy journeys > UX-chat16-inbound-mail-02 renders a safe reset instead of querying an invalid recipient or page

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 inbound-mail Super Admin page-level failure and privacy journeys > UX-chat16-inbound-mail-04 passes only server-loaded message data into its private list

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat16-otp-provider-resilience-05.test.ts (4 failing)
- chat-16 OTP channel acceptance, validation and graceful failure > AUTH-OTP-DELIVERY-01 requires an affirmative Exotel state and valid SID, not HTTP 200

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- chat-16 OTP channel acceptance, validation and graceful failure > AUTH-OTP-DELIVERY-01 rejects malformed codes and phones without sending

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  "https://api.exotel.com/v1/Accounts/test-account/Sms/send.json",
  Object {
  "body": URLSearchParams {},
  "fetchImpl": [Function fetch],
  ```
- chat-16 OTP channel acceptance, validation and graceful failure > AUTH-OTP-DELIVERY-02 rejects whitespace-only auth tokens and failed provider responses

  ```
  AssertionError: expected "vi.fn()" to be called 2 times, but got 0 times
  ❯ tests/unit/chat16-otp-provider-resilience-05.test.ts:90:27
  88|     vi.mocked(outboundFetch).mockRejectedValueOnce(new Error("private-…
  89|     expect(await sendEmail("learner@example.org")).toBe(false);
  90|     expect(outboundFetch).toHaveBeenCalledTimes(2);
  |                           ^
  91|     expect(JSON.stringify(vi.mocked(writeStructuredLog).mock.calls)).n…
  92|   });
  ```
- chat-16 OTP channel acceptance, validation and graceful failure > AUTH-OTP-DELIVERY-02 accepts valid provider acknowledgment with a single POST

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
