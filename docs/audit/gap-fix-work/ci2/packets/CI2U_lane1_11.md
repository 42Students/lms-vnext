# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-tpo-report-snapshot-error.test.ts (1 failing)
- TPO report snapshot failure states > TPO-calendar-reports-55 never presents an empty placement snapshot as a successful zero and exposes Retry

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'No placement totals are being inferre…'
  - Expected
  + Received
  - No placement totals are being inferred from missing data.
  + import { Select } from "@/components/ui/select";
  + import { tpoReportHasAmbiguousFilters } from "@/modules/placements/tpo-report-url-guard";
  + import { TpoReportInvalidFilters } from "@/components/placements/tpo-report-invalid-filters";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/college-contacts-pagination.test.ts (2 failing)
- contacts pagination > keeps tab while changing page

  ```
  AssertionError: expected 10 to be 20 // Object.is equality
  - Expected
  + Received
  - 20
  + 10
  ```
- contacts variable page size > preserves the bounded page size on navigation but excludes it from CSV schema

  ```
  AssertionError: expected 10 to be 20 // Object.is equality
  - Expected
  + Received
  - 20
  + 10
  ```

## tests/unit/college-structure-directory-model.test.ts (1 failing)
- College Admin classes/electives read-only filters > parses bounded filters and refuses a caller-controlled college

  ```
  AssertionError: expected { q: '', status: 'ACTIVE', …(2) } to deeply equal { q: '', status: 'ACTIVE', …(2) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 10,
  +   "pageSize": 25,
  "q": "",
  ```

## tests/unit/faculty-profile-round12-12.test.ts (1 failing)
- uses non-sensitive saved confirmation without copying personal values

  ```
  AssertionError: expected 'Updated successfully' to be 'Education saved (revision 4).' // Object.is equality
  Expected: "Education saved (revision 4)."
  Received: "Updated successfully"
  ```

## tests/unit/graceful-server-helpers.test.ts (1 failing)
- server error envelope > GR-06 maps domain statuses and never includes unknown error.message

  ```
  AssertionError: expected 'import { NextResponse } from "next/se…' to contain 'message: friendlyApiError({ status, c…'
  - Expected
  + Received
  - message: friendlyApiError({ status, code })
  + import { NextResponse } from "next/server";
  + import { friendlyApiError } from "@/lib/friendly-error";
  + import { createRequestId } from "@/lib/request-id";
  + import { isDatabaseUnavailableError } from "@/lib/db-outage";
  ```

## tests/unit/learner-college-notice-invalid-date.test.ts (1 failing)
- keeps authorized college notices with valid dates while excluding invalid dated records

  ```
  AssertionError: expected [ Array(2) ] to have a length of 1 but got 2
  - Expected
  + Received
  - 1
  + 2
  ```
