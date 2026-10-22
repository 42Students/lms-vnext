# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-contacts-denial-before-filters.test.ts (1 failing)
- College Contacts role-first denial > checks active account role before resolving user-supplied filters

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to match /if\(!context\.membership\…/dashboard"\)
  - Expected:
  /if\(!context\.membership\|\|!hasMembershipRole\(context,"COLLEGE_ADMIN"\)\)redirect\("\/dashboard"\)/
  + Received:
  "import { DateInput } from \"@/components/ui/date-input\";
  import { Input } from \"@/components/ui/input\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Button } from \"@/components/ui/button\";
  ```

## tests/unit/college-recurring-preview.test.ts (1 failing)
- College recurring preview is IST-safe and bounded > requires unique weekdays, valid calendar dates, bounded range and increasing times

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-profile-error-model.test.ts (1 failing)
- Faculty profile optimistic conflict recovery > offers explicit reload only for a verified stale version

  ```
  AssertionError: expected 'Profile was updated elsewhere. Please…' to contain 'Reload'
  Expected: "Reload"
  Received: "Profile was updated elsewhere. Please refresh and try again."
  ```

## tests/unit/graceful-provider-adoption.test.ts (2 failing)
- graceful outbound provider adoption > GR-50 ZeptoMail OTP goes through the bounded outbound transport

  ```
  AssertionError: expected 'import { outboundFetch } from "@/lib/…' to contain 'maxAttempts: 1'
  - Expected
  + Received
  - maxAttempts: 1
  + import { outboundFetch } from "@/lib/outbound";
  + import { writeStructuredLog } from "@/observability/logger";
  + import type { EmailProvider } from "./types";
  + import { isValidRecipient, normalizeRecipient } from "@/modules/messaging/model";
  ```
- graceful outbound provider adoption > GR-50 campaign outbound calls avoid duplicate unkeyed POST retries

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```

## tests/unit/learner-closing-drives-filter.test.ts (1 failing)
- Own published drive closing-soon filter > selects only non-expired persisted deadlines within inclusive seven days

  ```
  AssertionError: expected [ 'within', 'boundary', 'beyond' ] to deeply equal [ 'within', 'boundary' ]
  - Expected
  + Received
  [
  "within",
  "boundary",
  +   "beyond",
  ]
  ```

## tests/unit/learner-placement-announcement-model.test.ts (1 failing)
- learner placement notice display > projects only approved presentation fields without identity or scope data

  ```
  AssertionError: expected [ { id: '1', title: 'Notice', …(9) } ] to deeply equal [ { id: '1', title: 'Notice', …(4) } ]
  - Expected
  + Received
  [
  {
  +     "authorName": null,
  +     "bodyLinks": [],
  "createdAt": "2026-10-15T00:00:00.000Z",
  ```
