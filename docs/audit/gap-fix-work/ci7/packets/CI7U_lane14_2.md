# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat19-hr-surface-parity.test.ts (2 failing)
- NORTH-STAR chat-19: legacy recruiter page canvas > uses a single old-LMS counter strip for calendar and company reports

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'aria-label="Calendar event types"'
  - Expected
  + Received
  - aria-label="Calendar event types"
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- NORTH-STAR chat-19: legacy recruiter page canvas > uses shared Input Select Button chrome for proposal filters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Input type="search" name="q"'
  - Expected
  + Received
  - <Input type="search" name="q"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```

## tests/unit/chat2-tpo-team-open-increments.test.ts (3 failing)
- TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-18 defaults to Following, retains search and counted filters but not imaginary object threads

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'parsed.data.filter??"FOLLOWING"'
  - Expected
  + Received
  - parsed.data.filter??"FOLLOWING"
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-30 validates legacy ?c and ?m aliases without redirecting to arbitrary external destinations

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'z.string().uuid().safeParse(threadId)'
  - Expected
  + Received
  - z.string().uuid().safeParse(threadId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-31 displays real workload counts, never fabricated unregistered owner values

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Live drives'
  - Expected
  + Received
  - Live drives
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat4-independent-findings-filters.test.ts (1 failing)
- SA-tenants-modules-48 persisted board filter states > SA-tenants-modules-48 calculates counts from SQL-scoped full matches, not one displayed page

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Critical open: {data.criticalOpen}'
  - Expected
  + Received
  - Critical open: {data.criticalOpen}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat5-tpo-second-third-page-journeys.test.ts (1 failing)
- chat-5 second-third TPO page journeys > UX-TPO-DRIVE-STOP-37 provides 44px return actions and explicit blocked-state messages on both previews

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'inline-flex min-h-11 w-full items-cen…'
  - Expected
  + Received
  - inline-flex min-h-11 w-full items-center
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
