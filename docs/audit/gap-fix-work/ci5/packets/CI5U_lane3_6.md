# CI unit-test packet (round 5)

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

## tests/unit/ux-admin-chat9-round9-legacy.test.ts (2 failing)
- chat-9 Round 9: legacy labels survive UX rollout > UX-admin-projects-labels-01 preserves the original College Project copy and scope recovery

  ```
  AssertionError: Target cannot be null or undefined.
  ❯ tests/unit/ux-admin-chat9-round9-legacy.test.ts:24:53
  22|     const workspaces=source("src/app/(authenticated)/college/projects/…
  23|     const risk=source("src/components/projects/project-admin-at-risk-p…
  24|     expect(workspaces.match(/title="Workspaces"/g)).toHaveLength(3);
  |                                                     ^
  25|     expect(workspaces).toContain('role="alert"');
  26|     expect(workspaces).toContain("Bulk reassign mentor");
  ```
- chat-9 Round 9: legacy labels survive UX rollout > UX-admin-tpo-settings-label-01 keeps the exact Recruiters settings tab

  ```
  AssertionError: expected [ Array(5) ] to include 'Placement Rules'
  ❯ tests/unit/ux-admin-chat9-round9-legacy.test.ts:40:20
  38|     const labels=TPO_SETTINGS_NAV_GROUPS.flatMap(group=>group.items.ma…
  39|     expect(labels).toContain("Recruiters");
  40|     expect(labels).toContain("Placement Rules");
  |                    ^
  41|     expect(labels).toContain("What Companies See");
  42|     expect(labels).toContain("Placement Branding");
  ```

## tests/unit/w03-lifecycle-concurrency-contract.test.ts (1 failing)
- W03 project lifecycle concurrency contract > rechecks sprint and release prerequisites inside their transactions

  ```
  AssertionError: expected -1 to be greater than 7086
  ❯ tests/unit/w03-lifecycle-concurrency-contract.test.ts:24:23
  22|     const transaction = source.indexOf("db.transaction", completeStart…
  23|     expect(transaction).toBeGreaterThan(completeStart);
  24|     expect(taskCheck).toBeGreaterThan(transaction);
  |                       ^
  25|
  26|     const shipStart = source.indexOf("export async function shipProjec…
  ```
