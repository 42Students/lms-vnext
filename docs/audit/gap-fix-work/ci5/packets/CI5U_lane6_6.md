# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-team-person-context-chat2.test.ts (1 failing)
- TPO team conversation and person context > TPO-inbox-team-31 shows You only for the active roster membership

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.membershipId===context.members…'
  - Expected
  + Received
  - member.membershipId===context.membership?.id
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-loading-recovery.test.ts (3 failing)
- UX-admin-classes-03 bounded loading

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import {PageHeader} from "@/components/ui/page-header";
  + /** Legacy Classes & Sections list loading: eight rows and eight columns. */
  + export default function Loading(){
  +  return <div className="min-w-0 space-y-6" role="status" aria-busy="true" aria-live="polite">
  ```
- UX-admin-companies-03 bounded loading

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Skeleton} from "@/components/ui/skeleton";
  +
  + /** Legacy company directory: initial table skeleton rather than blocking the shell. */
  ```
- UX-admin-colleges-collegeId-branding-03 bounded loading

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'label="Loading branding preview…"'
  - Expected
  + Received
  - label="Loading branding preview…"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + export default function CollegeBrandingPreviewLoading() {
  ```

## tests/ux-color-contrast.test.ts (1 failing)
- UX-AUDIT B-01/B-05/B-06 canonical LMS AA pairings > UX-PLAYBOOK-12 both themes keep a white on-primary semantic on the solid teal button

  ```
  AssertionError: expected '@import "tailwindcss";\n@source not "…' to contain '--lms-link-text: #0e7c87'
  - Expected
  + Received
  - --lms-link-text: #0e7c87
  + @import "tailwindcss";
  + @source not "../../docs";
  + @source not "../../scripts";
  + @source not "../../tests";
  ```
