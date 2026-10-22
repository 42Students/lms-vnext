# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-programs-page.test.tsx (4 failing)
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-36 disabled and College Admin actors never read private program membership

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminProgramsPage src/app/(authenticated)/admin/programs/page.tsx:16:2
  14|
  15| export default async function SuperAdminProgramsPage({
  16|  searchParams,
  |  ^
  17| }: {searchParams?:Promise<{page?:string}>} ) {
  18|   const context = await getCurrentRequestContext();
  ```
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-37 missing selected college never performs cross-tenant fallback

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminProgramsPage src/app/(authenticated)/admin/programs/page.tsx:16:2
  14|
  15| export default async function SuperAdminProgramsPage({
  16|  searchParams,
  |  ^
  17| }: {searchParams?:Promise<{page?:string}>} ) {
  18|   const context = await getCurrentRequestContext();
  ```
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-38 any essential directory outage displays an honest retry, never a false zero-program list

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminProgramsPage src/app/(authenticated)/admin/programs/page.tsx:16:2
  14|
  15| export default async function SuperAdminProgramsPage({
  16|  searchParams,
  |  ^
  17| }: {searchParams?:Promise<{page?:string}>} ) {
  18|   const context = await getCurrentRequestContext();
  ```
- Super Admin last-third Programs: cross-role, partial outage and scoped directory > UX-admin-programs-39 a valid college preserves the exact program/dept association

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.SuperAdminProgramsPage src/app/(authenticated)/admin/programs/page.tsx:16:2
  14|
  15| export default async function SuperAdminProgramsPage({
  16|  searchParams,
  |  ^
  17| }: {searchParams?:Promise<{page?:string}>} ) {
  18|   const context = await getCurrentRequestContext();
  ```

## tests/unit/PROJ-BREAK-chat9-mentor-reassignment-page-outages.test.tsx (2 failing)
- IIT Dharwad Projects: bulk mentor reassignment partial failure states > PROJ-BREAK-mentor-114 malformed filters show Clear before context or any private roster requests

  ```
  AssertionError: expected 1 to be +0 // Object.is equality
  - Expected
  + Received
  - 0
  + 1
  ```
- IIT Dharwad Projects: bulk mentor reassignment partial failure states > PROJ-BREAK-mentor-115 failure in any essential dependency blocks all mutation forms and retains filters

  ```
  AssertionError: expected 'Bulk mentor reassignment Failed to lo…' to contain 'Mentor reassignment unavailable'
  Expected: "Mentor reassignment unavailable"
  Received: "Bulk mentor reassignment Failed to load project workspaces The workspace, mentor or workload details could not be verified. No reassignment action is available. Retry loading mentor reassignment /admin/projects/reassign-mentor?mentorSearch=faculty&q=IIT&status=ACTIVE&page=2"
  ```

## tests/unit/PROJ-BREAK-chat9-template-directory-query.test.ts (1 failing)
- IIT Dharwad Projects: Super Admin template catalogue query resilience > PROJ-BREAK-scale-25 pagination never emits NaN, Infinity, zero or negative page counts

  ```
  AssertionError: expected 10 to be 20 // Object.is equality
  - Expected
  + Received
  - 20
  + 10
  ```

## tests/unit/UX-campaign-unsubscribe-token-01.test.ts (2 failing)
- UX-campaign-unsubscribe-token-01 preference confirmation > validates the link on GET without any suppression mutation or false success

  ```
  AssertionError: expected 'import { Card } from "@/components/ui…' to contain 'campaignUnsubscribeTokenKind(token)'
  - Expected
  + Received
  - campaignUnsubscribeTokenKind(token)
  + import { Card } from "@/components/ui/card";
  + import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";
  +
  + export default async function CampaignUnsubscribe({
  ```
- UX-campaign-unsubscribe-token-01 preference confirmation > uses mobile-safe shared Card and a guarded confirmed POST with accessible error

  ```
  AssertionError: expected 'import { Card } from "@/components/ui…' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { Card } from "@/components/ui/card";
  + import {CampaignUnsubscribeConfirm} from "@/components/placements/campaign-unsubscribe-confirm";
  +
  + export default async function CampaignUnsubscribe({
  ```

## tests/unit/UX-college-college-branding-01.test.ts (1 failing)
- UX-college-college-branding-01 preserves state and mobile layout

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeBrandingForm } from "@/components/admin/college-branding-form";
  + import { CollegeLogoUploader } from "@/components/admin/college-logo-uploader";
  ```

## tests/unit/UX-college-college-groups-group-id-rule-preview-01.test.ts (1 failing)
- UX-college-college-groups-group-id-rule-preview-01 keeps accessible shared screen state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
