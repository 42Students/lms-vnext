# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat15-assignment-material-links.test.ts (1 failing)
- Faculty-authored learner assignment materials > LEARNER-learning-misc-02 validates faculty authoring, optimistic parent locking, and same-origin mutation

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'rows.some(row=>row.externalUrl.toLowe…'
  - Expected
  + Received
  - rows.some(row=>row.externalUrl.toLowerCase()
  + import "server-only";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat16-inbound-mail-status-route-16.test.ts (1 failing)
- chat-16 private inbound-mail status route > inbound-mail-route-17 maps an optimistic conflict to a 409 without a fake success

  ```
  AssertionError: expected { error: 'MESSAGE_CHANGED', …(1) } to deeply equal { error: 'MESSAGE_CHANGED' }
  - Expected
  + Received
  {
  "error": "MESSAGE_CHANGED",
  +   "message": "This message changed. Reload it and try again.",
  }
  ```

## tests/unit/chat16-recruiter-mail-inbound-route-01.test.ts (1 failing)
- chat-16 inbound recruiter mail POST guard > HR-MAIL-ROUTE-04 forwards the unmodified body and supplied signature

  ```
  AssertionError: expected { accepted: true, …(2) } to deeply equal { accepted: true, replayed: false }
  - Expected
  + Received
  {
  "accepted": true,
  +   "outcome": "NOT_OURS",
  "replayed": false,
  }
  ```

## tests/unit/chat2-campaign-history-legacy-copy.test.ts (1 failing)
- TPO legacy Emails history copy > TPO-campaigns-public-10 retains exact Emails, sent/skipped/failed and failure Retry copy

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'item.skipped+" skipped"'
  - Expected
  + Received
  - item.skipped+" skipped"
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat2-team-member-and-alert-parity.test.ts (1 failing)
- chat-2 Team membership, context and event notifications > TPO-inbox-team-38 lets authorized college admins and TPO admins participate, with persisted college scope

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'new Set(active.map(member=>member.id)…'
  - Expected
  + Received
  - new Set(active.map(member=>member.id)).size!==2
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,eq,inArray,isNull,sql} from "drizzle-orm";
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

## tests/unit/chat3-tenant-public-verified-round13.test.ts (2 failing)
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-06 has two scoped URL-persisted tenant setup steps

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'requirePermission(context,"admin-scop…'
  - Expected
  + Received
  - requirePermission(context,"admin-scope.select")
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-19 retains college-scoped activity read and authorized CSV without a duplicate GET write

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'collegeId: one(params.collegeId)'
  - Expected
  + Received
  - collegeId: one(params.collegeId)
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/chat4-college-projects-canonical-page.test.ts (1 failing)
- PROJ-BREAK-COLLEGE-04-PAGE-06 stale College Admin project bookmarks > keeps malformed and cross-tenant URL filters out before building any canonical redirect

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
