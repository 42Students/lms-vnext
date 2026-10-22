# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-recruiter-leads-copy.test.ts (2 failing)
- TPO recruiter leads visible legacy parity > TPO-recruiters-43 retains designation in table and board and names unnamed contacts safely

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'lead.designation?<p'
  - Expected
  + Received
  - lead.designation?<p
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- TPO recruiter leads visible legacy parity > TPO-recruiters-40 restores edit-action heading and legacy Save label

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '>Save</button>'
  - Expected
  + Received
  - >Save</button>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat2-ux-tpo-settings-b.test.ts (3 failing)
- TPO settings UX semantics > UX-tpo-tpo-settings-rules-01 keeps legacy heading and touch-safe controls

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'title="Placement rules"'
  - Expected
  + Received
  - title="Placement rules"
  + import { Disclosure } from "@/components/ui/disclosure";
  + import type {ReactNode} from "react";
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  ```
- TPO settings UX semantics > UX-tpo-tpo-settings-team-01 keeps legacy heading and touch-safe controls

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'title="Placement Team"'
  - Expected
  + Received
  - title="Placement Team"
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { TpoSettingsTeamManage, TpoSettingsTeamRemove } from "@/components/tpo/tpo-settings-team-manage";
  + import { listTpoTeamAssignableStaff } from "@/modules/placements/tpo-settings-team-actions-service";
  + import Link from "next/link";
  ```
- TPO settings UX semantics > UX-tpo-tpo-settings-see-01 keeps legacy heading and touch-safe controls

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'title="What Companies See"'
  - Expected
  + Received
  - title="What Companies See"
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { redirect } from "next/navigation";
  +
  ```

## tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts (2 failing)
- Super Admin root-page platform-role defense > SA-PEOPLE-ROOT-01 protects person identity and membership reads before creating a roster

  ```
  AssertionError: expected -1 to be greater than 4539
  ❯ tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts:30:18
  28|   const people=source.indexOf("const people = await listCollegePeopleW…
  29|   expect(check).toBeGreaterThan(0);
  30|   expect(people).toBeGreaterThan(check);
  |                  ^
  31|  });
  32|  it("SA-PEOPLE-ROOT-02 verifies all People views and Faculty assignmen…
  ```
- Super Admin root-page platform-role defense > SA-PEOPLE-ROOT-02 verifies all People views and Faculty assignment list assert Super Admin before reading records

  ```
  AssertionError: expected -1 to be greater than 1609
  ❯ tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts:46:33
  44|    const guard=page.indexOf("isSuperAdmin(context)");
  45|    expect(guard).toBeGreaterThan(0);
  46|    expect(page.indexOf(lookup)).toBeGreaterThan(guard);
  |                                 ^
  47|   }
  48|  });
  ```

## tests/unit/chat4-college-admin-academics-contacts-role-journey.test.ts (2 failing)
- College Admin people and academic journey security > COL-ADMIN-JOURNEY-04 contacts page gates role before reads and maintains masked student CSV, partial, empty and recovery

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'No matching contacts in this college.'
  - Expected
  + Received
  - No matching contacts in this college.
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
- College Admin people and academic journey security > COL-ADMIN-JOURNEY-05 class/elective pages reject malformed filters rather than reading a wider dataset

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'readCollegeStructureParams(await sear…'
  - Expected
  + Received
  - readCollegeStructureParams(await searchParams)
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-college-public-signin-policy-read.test.ts (1 failing)
- COL-tenant-public-signin-01 resolved-host policy and fail-closed channel access > never treats a corrupt persisted policy as a permissive unconfigured policy

  ```
  AssertionError: promise resolved "'EMAIL_AND_PHONE'" instead of rejecting
  - Expected:
  Error {
  "message": "rejected promise",
  }
  + Received:
  "EMAIL_AND_PHONE"
  ```

## tests/unit/chat4-learner-attendance-month-scope.test.ts (1 failing)
- LEARNER-home-courses-18 scoped attendance month > LEARNER-home-courses-18 filters persisted attendance by authorized delivery and date at SQL boundary

  ```
  AssertionError: expected 'import "server-only";\n\nimport {\n  …' to contain 'authorizedDeliveries=options.delivery…'
  - Expected
  + Received
  - authorizedDeliveries=options.deliveryId
  + import "server-only";
  +
  + import {
  +   and,
  ```
