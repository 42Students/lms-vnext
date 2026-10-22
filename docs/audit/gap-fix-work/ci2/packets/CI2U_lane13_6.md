# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-hiring-report-tenant-aggregation.test.ts (1 failing)
- SA-HIRING-REPORT-SCOPE-03 tenant-safe job pipeline analytics > preserves zero-application jobs while keeping selected organization and employer relationship boundaries

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain '.limit(SUPER_ADMIN_HIRING_EXPORT_CAP+…'
  - Expected
  + Received
  - .limit(SUPER_ADMIN_HIRING_EXPORT_CAP+1)
  + import "server-only";
  + import {and,asc,eq,exists,gte,ilike,lt,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```

## tests/unit/chat13-tenant-settings-runtime-gap37.test.ts (2 failing)
- SA-tenants-modules-37 saved course settings are honored > SA-tenants-modules-37 uses editor-compatible validated save intervals

  ```
  AssertionError: expected 'import { eq, and, inArray } from "dri…' to contain 'n>=5000&&n<=600000'
  - Expected
  + Received
  - n>=5000&&n<=600000
  + import { eq, and, inArray } from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {platformSettingOverrides} from "@/db/schema";
  + import {writeStructuredLog} from "@/observability/logger";
  ```
- SA-tenants-modules-37 saved course settings are honored > SA-tenants-modules-37 reads an in-progress threshold and applies it to both reads and saves

  ```
  AssertionError: expected 'import { eq, and, inArray } from "dri…' to contain 'minInProgressPercent:5'
  - Expected
  + Received
  - minInProgressPercent:5
  + import { eq, and, inArray } from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {platformSettingOverrides} from "@/db/schema";
  + import {writeStructuredLog} from "@/observability/logger";
  ```

## tests/unit/chat15-hr-legacy-parity-54-55.test.ts (3 failing)
- HR legacy inventory B explicit UNKNOWN routes, source parity audit > HR-PARITY-54 legacy Closed drives tab reaches the actual scoped recruiter filter

  ```
  AssertionError: expected 'import {StatusBadge} from "@/componen…' to contain 'listOwnRecruiterPlacementJobs'
  - Expected
  + Received
  - listOwnRecruiterPlacementJobs
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- HR legacy inventory B explicit UNKNOWN routes, source parity audit > HR-PARITY-55 legacy job Requests tab is mapped after the scoped hiring read

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'href={"/recruiter/drives/"+workspace.…'
  - Expected
  + Received
  - href={"/recruiter/drives/"+workspace.job.id+"?tab=requests"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- HR legacy inventory B explicit UNKNOWN routes, source parity audit > HR-PARITY-55 direct change-request page rejects the TPO party with the same 404 as missing jobs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'error.code==="PLACEMENT_JOB_NOT_FOUND"'
  - Expected
  + Received
  - error.code==="PLACEMENT_JOB_NOT_FOUND"
  + import Link from "next/link";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/chat16-final-col-placements-02.test.ts (2 failing)
- COL-placements-02 application details drawer > COL-placements-02 uses authenticated college-scoped application details rather than row-only PII

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'Mobile:'
  - Expected
  + Received
  - Mobile:
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```
- COL-placements-02 application details drawer > COL-placements-02 does not fabricate scores or public resume URLs

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'detail.resume.available&&detail.resum…'
  - Expected
  + Received
  - detail.resume.available&&detail.resume.url
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat16-mentor-final-review-r6.test.ts (1 failing)
- chat-16 mentor delivery review verified actions > MEN-projects-meetings-65 always requires explicit approval/change confirmation before submitting

  ```
  AssertionError: expected '"use client";\n\nimport {\n  type For…' to contain 'onClick={()=>{setDecision("APPROVED")…'
  - Expected
  + Received
  - onClick={()=>{setDecision("APPROVED");setConfirmReview(true);}}
  + "use client";
  +
  + import {
  +   type FormEvent,
  ```

## tests/unit/chat16-public-login-page-render-08.test.ts (5 failing)
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-OTP-01 renders the actual login route with both permitted OTP channels

  ```
  Error: [vitest] No "publicLoginStyleVariables" export is defined on the "@/modules/colleges/branding" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/branding"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-OTP-02 honors college channel policy and never renders a disallowed SMS action

  ```
  Error: [vitest] No "publicLoginStyleVariables" export is defined on the "@/modules/colleges/branding" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/branding"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-OTP-03 shows a recovery alert after an expired session and preserves sign-in

  ```
  Error: [vitest] No "publicLoginStyleVariables" export is defined on the "@/modules/colleges/branding" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/branding"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-TENANT-04 unknown and temporarily unavailable hosts are safe fallback states

  ```
  Error: [vitest] No "publicLoginStyleVariables" export is defined on the "@/modules/colleges/branding" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/colleges/branding"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-16 direct public sign-in page render and tenant/OTP journeys > AUTH-PAGE-BRANDING-07 gives college-bound OTP login its own title

  ```
  TypeError: Cannot destructure property 'searchParams' of 'undefined' as it is undefined.
  ❯ Module.generateMetadata src/app/page.tsx:24:41
  22| }
  23|
  24| export async function generateMetadata({searchParams}:{
  |                                         ^
  25|  searchParams:Promise<{legacy?:string|string[]}>;
  26| }):Promise<Metadata> {
  ```
