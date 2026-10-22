# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/company-share-mobile-cards.test.ts (2 failing)
- renders equivalent three-field mobile cards and desktop tables

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'cell: row=>row.cells[key]??"Not recor…'
  - Expected
  + Received
  - cell: row=>row.cells[key]??"Not recorded"
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- discloses only the selected fields on either viewport

  ```
  AssertionError: expected [ 'APPLICATION_ID', 'NAME', …(2) ] to deeply equal [ 'NAME', 'ROLL_NUMBER', 'STAGE' ]
  - Expected
  + Received
  [
  +   "APPLICATION_ID",
  "NAME",
  "ROLL_NUMBER",
  "STAGE",
  ```

## tests/unit/learner-course-tab-route-model.test.ts (1 failing)
- learner course tab routes > rejects nested, unknown, and empty tab paths

  ```
  AssertionError: expected 'home' to be null
  - Expected:
  null
  + Received:
  "home"
  ```

## tests/unit/placement-calendar-model.test.ts (4 failing)
- Placement calendar view windows > uses Monday-first week boundaries

  ```
  AssertionError: expected '2026-10-11' to be '2026-10-12' // Object.is equality
  Expected: "2026-10-12"
  Received: "2026-10-11"
  ```
- Placement calendar view windows > includes adjacent month days in a 42-day grid

  ```
  AssertionError: expected '2026-09-27' to be '2026-09-28' // Object.is equality
  Expected: "2026-09-28"
  Received: "2026-09-27"
  ```
- Placement calendar view windows > uses the selected calendar month for agenda

  ```
  AssertionError: expected { from: '2026-02-14', …(2) } to deeply equal { from: '2026-02-01', …(2) }
  - Expected
  + Received
  {
  "days": [],
  -   "from": "2026-02-01",
  -   "to": "2026-02-28",
  +   "from": "2026-02-14",
  ```
- Placement calendar view windows > handles leap-year month boundaries

  ```
  AssertionError: expected '2028-03-30' to be '2028-02-29' // Object.is equality
  Expected: "2028-02-29"
  Received: "2028-03-30"
  ```

## tests/unit/t-s2-04-campaign-send-policy.test.ts (1 failing)
- T-S2-04 campaign send policy > produces a bounded, PII-free preview with stable contact deduplication

  ```
  Error: TPO_CAMPAIGN_RECIPIENT_LIMIT
  ❯ assertCampaignRecipientCap src/modules/messaging/tpo-campaign-send-policy.ts:33:11
  31| export function assertCampaignRecipientCap(total:number):number {
  32|   if(!Number.isSafeInteger(total)||total<0||total>TPO_CAMPAIGN_MAX_REC…
  33|     throw new Error("TPO_CAMPAIGN_RECIPIENT_LIMIT");
  |           ^
  34|   return total;
  35| }
  ```
