# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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
