# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-organization-directory-persisted-role.test.ts (2 failing)
- SA-ORGANIZATIONS-ACTOR-09 persisted organization directory authorization > denies College Admin whose persisted platform role was revoked before an organization SELECT

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Anything, …(3) ]
  Received:
  1st vi.fn() call:
  @@ -1,7 +1,9 @@
  [
  -   Anything,
  +   {
  +     "select": [Function select],
  ```
- SA-ORGANIZATIONS-ACTOR-09 persisted organization directory authorization > keeps College Admin membership scope in the persisted authorization call

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ Anything, …(3) ]
  Received:
  1st vi.fn() call:
  @@ -1,7 +1,9 @@
  [
  -   Anything,
  +   {
  +     "select": [Function select],
  ```

## tests/unit/chat5-tpo-account-breakit.test.ts (2 failing)
- TPO-BREAK-session-01 / TPO-BREAK-tenant-01 > TPO-BREAK-session-01 maps 401 to an actionable message without leaking internal errors

  ```
  AssertionError: expected FriendlyFetchError: Please sign in again … { …(5) } to match object { …(2) }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  - {
  -   "message": "Your session has ended. Please sign in again.",
  + FriendlyFetchError {
  "status": 401,
  ```
- TPO-BREAK-session-01 / TPO-BREAK-tenant-01 > TPO-BREAK-session-01 maps 409 to an actionable message without leaking internal errors

  ```
  AssertionError: expected FriendlyFetchError: This changed elsewher… { …(5) } to match object { …(2) }
  (5 matching properties omitted from actual)
  - Expected
  + Received
  - {
  -   "message": "This changed while you were working. Refresh and try again.",
  + FriendlyFetchError {
  "status": 409,
  ```

## tests/unit/chat6-auth-revoke-admin-flight-and-errors.test.ts (1 failing)
- AUTH-sessions-07 administrative session-revocation failure resilience > AUTH-sessions-07 locks the complete revoke action, not just a disabled button

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'description={"All active sessions for…'
  - Expected
  + Received
  - description={"All active sessions for this administrator, including other colleges, will be revoked immediately."+(errorMessage?" "+errorMessage:"")}
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  +
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-04.test.ts (1 failing)
- Final sprint recruiter home greeting > REC-home-drives-04 greeting and action-count copy are time-zone deterministic

  ```
  AssertionError: expected { title: 'Good morning, Asha', …(1) } to deeply equal { title: 'Good morning, Asha', …(1) }
  - Expected
  + Received
  {
  -   "subtitle": "2 things need you today. Each one takes you straight to where it is done.",
  +   "subtitle": "2 things need you today.",
  "title": "Good morning, Asha",
  }
  ```

## tests/unit/chat6-superadmin-content-round2.test.ts (3 failing)
- Super Admin Courses and Content gap closure > SA-academics-people-48 uses select college legacy empty copy consistently

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'title="Select a college to continue"'
  - Expected
  + Received
  - title="Select a college to continue"
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```
- Super Admin Courses and Content gap closure > SA-academics-people-63 exact legacy video and live class labels and help

  ```
  AssertionError: expected 'import { z } from "zod";\n/** Video/L…' to contain '"YouTube Video"'
  - Expected
  + Received
  - "YouTube Video"
  + import { z } from "zod";
  + /** Video/Live source tables default to 10; the old resources table to 15.
  +  * Keep a bounded size changer rather than loading the entire lesson tree. */
  + export const ADMIN_CONTENT_PAGE_SIZE = 10;
  ```
- Super Admin Courses and Content gap closure > SA-academics-people-76 keyboard operable move buttons are an approved equivalent to drag reorder

  ```
  AssertionError: expected '"use client";\n\nimport { useState, u…' to contain 'aria-label={`Move ${item.title} up`}'
  - Expected
  + Received
  - aria-label={`Move ${item.title} up`}
  + "use client";
  +
  + import { useState, useTransition } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/chat6-superadmin-progress-policy-decision-49.test.ts (1 failing)
- Super Admin course progress threshold policy > SA-academics-people-49 computes global minimum progress and watched thresholds without exposing editable policy dials

  ```
  AssertionError: expected 'import { eq, and, inArray } from "dri…' to contain 'watchedThresholdPercent:90,minInProgr…'
  - Expected
  + Received
  - watchedThresholdPercent:90,minInProgressPercent:5
  + import { eq, and, inArray } from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {platformSettingOverrides} from "@/db/schema";
  + import {writeStructuredLog} from "@/observability/logger";
  ```
