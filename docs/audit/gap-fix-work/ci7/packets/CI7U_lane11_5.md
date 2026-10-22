# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-inbox-paging-chat2.test.ts (2 failing)
- TPO Team conversation pagination > TPO-inbox-team-18 pages all authorized Team threads in stable last-activity order

  ```
  AssertionError: expected 'import {hasPlacementTeamMembership} f…' to contain 'hasMore=items.length>100'
  - Expected
  + Received
  - hasMore=items.length>100
  + import {hasPlacementTeamMembership} from "./placement-team-access-model";
  + import "server-only";
  + import {and,desc,eq,isNull,or,like,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- TPO Team conversation pagination > TPO-inbox-team-18 preserves filter and search when fetching older conversations

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'listMyTpoInternalThreads(context,sear…'
  - Expected
  + Received
  - listMyTpoInternalThreads(context,search,conversationPage)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
