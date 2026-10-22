# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-0134-conflict-aware-design.test.ts (1 failing)
- 0134 conflict-aware schema > TPO-requests-verification-01 permits the sixth kind only after its check constraint is registered

  ```
  Error: ENOENT: no such file or directory, open '/home/runner/work/lms-vnext/lms-vnext/docs/proposed-migrations/chat-12-0134-general-requests-correction.sql'
  ❯ src tests/unit/chat12-0134-conflict-aware-design.test.ts:5:26
  3| import {getTableColumns,getTableName} from "drizzle-orm";
  4| import {placementLearnerGeneralRequests,placementLearnerGeneralRequest…
  5| const src=(path:string)=>readFileSync(new URL("../../"+path,import.met…
  |                          ^
  6| describe("0134 conflict-aware schema",()=>{
  7|  it("TPO-requests-verification-01 uses the first effective request tab…
  ```

## tests/unit/chat12-round11-recruiter-request-safe-actions.test.ts (1 failing)
- chat-12 recruiter drive request safe review > TPO-requests-verification-R03 refuses unauthorized recruiter grant scope

  ```
  AssertionError: expected 'import "server-only";\nimport {and,de…' to contain 'return {request:finalRequest,replayed…'
  - Expected
  + Received
  - return {request:finalRequest,replayed:false}
  + import "server-only";
  + import {and,desc,eq,inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {activityEvents,collegeMemberships,colleges,inAppNotifications,membershipRoles,
  ```

## tests/unit/chat12-round8-requests-bulk.test.ts (2 failing)
- chat-12 Requests actual persisted bulk decisions and legacy copy > TPO-requests-verification-17 renders legacy title and waiting/history copy without an invented eyebrow

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'No requests in this period.'
  - Expected
  + Received
  - No requests in this period.
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- chat-12 Requests actual persisted bulk decisions and legacy copy > TPO-requests-verification-18 retains request loading and retryable friendly error states

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + export default function Loading() {
  +   return <GracefulPageLoading label="Loading requests…" shape="directory" />;
  ```

## tests/unit/chat12-tpo-requests-page-role-and-empty.test.tsx (1 failing)
- UX-tpo-first-third-requests-01 role, filter recovery, honest empty state > renders the genuine empty pending queue with safe status and existing legacy history tabs

  ```
  TypeError: Cannot read properties of undefined (reading 'map')
  ❯ Module.GlobalTpoRequestsPage src/app/(authenticated)/tpo/requests/page.tsx:146:27
  144|           <Select name="branchId" defaultValue={data.query.branchId??"…
  145|            <option value="">All branches</option>
  146|            {data.branches.map(branch=><option key={branch.id} value={b…
  |                           ^
  147|           </Select>
  148|          </label>
  ```

## tests/unit/chat13-application-note-corrections.test.ts (1 failing)
- SA-placements-projects-21 audited internal note correction > SA-placements-projects-21 exposes legacy Edit Internal Notes and audited revisions

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Save correction'
  - Expected
  + Received
  - Save correction
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat13-legacy-topbar-accessibility-contract.test.ts (2 failing)
- chat-13 old LMS topbar keyboard, signed-out, and notification interactions > TOPBAR-06 provides Ctrl/Cmd K, Escape, portal-safe commands, and a real learner course search

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain '"/learn/courses/" + encodeURIComponen…'
  - Expected
  + Received
  - "/learn/courses/" + encodeURIComponent(course.deliveryId) + "/home"
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- chat-13 old LMS topbar keyboard, signed-out, and notification interactions > TOPBAR-07 keeps the existing signout API, multi-tab logoff and both switchers

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'event.key !== "Escape"'
  - Expected
  + Received
  - event.key !== "Escape"
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
