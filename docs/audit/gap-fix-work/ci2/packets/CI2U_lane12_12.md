# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-notice-actions.test.ts (1 failing)
- Chat-7 learner notice action and audience parity > LEARNER-placements-47 renders only safe persisted TPO action links

  ```
  AssertionError: expected { id: 'notice-1', …(14) } to match object { …(4) }
  (11 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "audienceLabel": "College",
  +   "audienceLabel": null,
  "buttonLabel": "View preparation",
  ```

## tests/unit/mentor-projects-chat7-final-r7.test.ts (2 failing)
- mentor gaps round-seven behavior > MEN-projects-meetings-14 preserves persisted truth and legacy controls

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'Course not linked'
  - Expected
  + Received
  - Course not linked
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- mentor gaps round-seven behavior > MEN-projects-meetings-R08 preserves persisted truth and legacy controls

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'onInput={mentor?liveRefresh:undefined}'
  - Expected
  + Received
  - onInput={mentor?liveRefresh:undefined}
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/proj-break-chat9-models.test.ts (1 failing)
- IIT Dharwad Projects adversarial admin/college models > PROJ-BREAK-exports-02 quoted commas, quotes and multiline fields do not create a new column

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/public-error-pages.test.ts (1 failing)
- shared public error pages > GR-13 keeps a customer-friendly no-code 404 route

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'homeHref="/"'
  - Expected
  + Received
  - homeHref="/"
  + import type { Metadata } from "next";
  + import { GracefulScreen } from "@/components/public/graceful-screen";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { getShellNavigation } from "@/components/shell/shell-model";
  ```

## tests/unit/recruiter-invite-otp-policy.test.ts (1 failing)
- T-S1-03 invitation OTP safety > enforces 5/link and 300/college hourly send caps

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/super-admin-organizations-empty.test.ts (2 failing)
- Super Admin organization directory > has a scoped empty state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'organizations.length===0'
  - Expected
  + Received
  - organizations.length===0
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- Super Admin organization directory > does not expose create form without permission

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'canCreate ? <section'
  - Expected
  + Received
  - canCreate ? <section
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
