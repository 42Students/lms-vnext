# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-25-chat5.test.ts (1 failing)
- TPO batch decision success and undo action > TPO-batches-25 displays server-issued Undo for saved learner and whole batch decisions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<TpoBatchInlineDecision membershipId=…'
  - Expected
  + Received
  - <TpoBatchInlineDecision membershipId={s.membershipId} batchId={batchId}
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-drive-lifecycle.test.ts (1 failing)
- TPO drive publish / close / reopen transitions > closes a published drive; forbids reopening after applied results or offers

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/tpo-inbox-team-round5-parity-review.test.ts (2 failing)
- TPO inbox/team outstanding legacy contracts > TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias

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
- TPO inbox/team outstanding legacy contracts > TPO-inbox-team-37 hides temporary coordinator assignments from permanent team roles

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'const activeTeam=team.members.filter(…'
  - Expected
  + Received
  - const activeTeam=team.members.filter(member=>member.roles.includes("TPO")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/tpo-team-filter-round4.test.ts (2 failing)
- TPO conversations filters > TPO-inbox-team-23 filters only conversations with recorded, unrevoked decisions

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'conversations.asksReady?["ASKS","AT_M…'
  - Expected
  + Received
  - conversations.asksReady?["ASKS","AT_ME"] as const
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO conversations filters > TPO-inbox-team-18 keeps filter state in the URL and explains an empty filtered result

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'tpoTeamConversationFilterSchema.optio…'
  - Expected
  + Received
  - tpoTeamConversationFilterSchema.optional()
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-chat9-loading-a.test.ts (3 failing)
- chat-9 bounded loading /admin last third A > UX-admin-projects-templates-template-id-02 shows a bounded recoverable loading state

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'Loading template section'
  - Expected
  + Received
  - Loading template section
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { ProjectAdminNav } from "@/components/projects/project-admin-nav";
  +
  ```
- chat-9 bounded loading /admin last third A > UX-admin-quizzes-02 shows a bounded recoverable loading state

  ```
  AssertionError: expected '/** Legacy Super Admin directory: eig…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + /** Legacy Super Admin directory: eight visible rows at load, then the
  +  * authorized SSR result or a recoverable ErrorState on failure. */
  + export default function Loading(){
  +  return <div className="min-w-0 space-y-4" role="status" aria-label="Loading quizzes">
  ```
- chat-9 bounded loading /admin last third A > UX-admin-semesters-02 shows a bounded recoverable loading state

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import {PageHeader} from "@/components/ui/page-header";
  + export default function LoadingSuperAdminSemesters(){
  +  return <div className="space-y-6" aria-busy="true" role="status" aria-label="Loading semesters">
  +   <PageHeader title="Semesters"/>
  ```

## tests/unit/w03-archived-project-readonly.test.ts (1 failing)
- W03 archived project read-only UI contract > derives one read-only flag from persisted ARCHIVED status

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Archived workspace · read only'
  - Expected
  + Received
  - Archived workspace · read only
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
