# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/w03-db07-source-contract.test.ts (1 failing)
- W03 DB07 staged schema/source-contract (NOT SQL replay) > keeps each staged child constrained to the same project as its parent

  ```
  AssertionError: expected '/**\n * W03 DB07 schema candidates. M…' to contain 'name:"project_resource_audit_project_…'
  - Expected
  + Received
  - name:"project_resource_audit_project_fk"
  + /**
  +  * W03 DB07 schema candidates. Meeting/resource audits promoted by 0196;
  +  * run against live endpoints or assume tables exist until W01 registers/replays
  +  * the corresponding Drizzle migration and verifies composite tenant/project FKs.
  ```
