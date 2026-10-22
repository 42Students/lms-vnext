# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/graceful-raw-error-scan.test.ts (2 failing)
- new raw-error and mutation regression gate > GR-09 rejects new renderings of API codes or internal error messages

  ```
  AssertionError: New unsafe error rendering in: src/components/projects/super-admin-template-plan-editor.tsx: expected [ Array(1) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "src/components/projects/super-admin-template-plan-editor.tsx",
  + ]
  ```
- new raw-error and mutation regression gate > GR-31 inventories newly changed unguarded mutating components

  ```
  AssertionError: Mutating fetch without useGuardedAction: src/components/academics/college-archived-programs.tsx, src/components/academics/college-hall-booking-action.tsx, src/components/academics/college-hall-cancellation-action.tsx, src/components/admin/tenant-domain-manager.tsx, src/components/col
  - Expected
  + Received
  - []
  + [
  +   "src/components/academics/college-archived-programs.tsx",
  +   "src/components/academics/college-hall-booking-action.tsx",
  +   "src/components/academics/college-hall-cancellation-action.tsx",
  ```

## tests/unit/learner-placements-dashboard-parity.test.ts (1 failing)
- Learner placement dashboard route wiring > shows separate scheduled/attention and empty/error loading states

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy'
  - Expected
  + Received
  - aria-busy
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + /** Legacy LMS: one canvas, compact page heading and hairline rows. */
  + export default function Loading() {
  ```

## tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts (1 failing)
- REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 persists reminder cooldown and reply token hashes only after provider success

  ```
  AssertionError: expected 'import "server-only";\nimport {create…' to contain 'return {examined:0,sent:0,enabled:fal…'
  - Expected
  + Received
  - return {examined:0,sent:0,enabled:false}
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,count,desc,eq,isNull,lt,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/tpo-drive-graceful-chat5-round4.test.ts (1 failing)
- Drive action resilience and accessibility > GR-90 and GR-91 expose persistent alert copy and a keyboard confirmation control

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain '<InlineNotice tone="error" message={e…'
  - Expected
  + Received
  - <InlineNotice tone="error" message={error}
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  ```
