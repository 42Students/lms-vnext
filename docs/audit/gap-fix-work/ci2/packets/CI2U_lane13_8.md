# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-team-open-increments.test.ts (3 failing)
- TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-18 defaults to Following, retains search and counted filters but not imaginary object threads

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'parsed.data.filter??"FOLLOWING"'
  - Expected
  + Received
  - parsed.data.filter??"FOLLOWING"
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-30 validates legacy ?c and ?m aliases without redirecting to arbitrary external destinations

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
- TPO Team remaining gap increments, not full object-thread parity > TPO-inbox-team-31 displays real workload counts, never fabricated unregistered owner values

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'Live drives'
  - Expected
  + Received
  - Live drives
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat3-final-sprint-company-accessibility.test.ts (2 failing)
- chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-18 preserves scoped company UI and privacy guarantees

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Companies ('
  - Expected
  + Received
  - Companies (
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- chat-3 final sprint companies accessibility, exporting and safety > TPO-companies-26 preserves scoped company UI and privacy guarantees

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-admin-college-readiness-journey.test.ts (1 failing)
- SA-colleges-readiness-R01 authorized and accurate tenant launch journey > rejects invalid/ambiguous URL filters before reading the persisted readiness data

  ```
  AssertionError: expected -1 to be greater than 2511
  ❯ tests/unit/chat4-admin-college-readiness-journey.test.ts:28:20
  26|     expect(auth).toBeGreaterThan(-1);
  27|     expect(validate).toBeGreaterThan(auth);
  28|     expect(reject).toBeGreaterThan(validate);
  |                    ^
  29|     expect(read).toBeGreaterThan(reject);
  30|     expect(page).toContain('title="Invalid readiness filter"');
  ```

## tests/unit/chat4-college-groups-directory-query-and-ux.test.ts (2 failing)
- College Admin Student groups directory query and role journey > COL-GROUPS-DIRECTORY-03 checks college manage permission before even parsing malformed filters or listing groups

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'Showing {offset + 1}'
  - Expected
  + Received
  - Showing {offset + 1}
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin Student groups directory query and role journey > UX-COL-GROUPS-ONE-CANVAS-01 uses an unboxed filter area and existing responsive table actions

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'className="flex flex-wrap items-end g…'
  - Expected
  + Received
  - className="flex flex-wrap items-end gap-3 border-t border-border pt-4"
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat4-college-ux-round7.test.ts (4 failing)
- Chat-4 college UX round seven > UX-college-hiring-dashboard-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Chat-4 college UX round seven > UX-college-lecture-halls-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- Chat-4 college UX round seven > UX-college-lecture-halls-hallId-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { notFound } from "next/naviga…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  ```
- Chat-4 college UX round seven > UX-college-lessons-01 supports accessible narrow-screen presentation

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Alert } from "@/components/ui/alert";
  + import { Tabs } from "@/components/ui/tabs";
  + import { loadCourseScope } from "@/modules/courses/scope";
  + import {LessonPageSizePreference} from "@/components/courses/lesson-page-size-preference";
  ```

## tests/unit/chat4-super-admin-tenants-modules-gap-closure.test.ts (7 failing)
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-51 preserves the audited admin workflow

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Mark done'
  - Expected
  + Received
  - Mark done
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-59 preserves the audited admin workflow

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<progress'
  - Expected
  + Received
  - <progress
  + import {Button} from "@/components/ui/button";
  + import {MetricBar} from "@/components/ui/metric-bar";
  + import chartStyles from "@/components/placements/report-bar-chart.module.css";
  + import {Select} from "@/components/ui/select";
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-61 preserves the audited admin workflow

  ```
  AssertionError: expected 'import {z} from "zod";\nexport const …' to contain '.max(200)'
  - Expected
  + Received
  - .max(200)
  + import {z} from "zod";
  + export const superAdminCollegeBroadcastSchema=z.strictObject({
  +  audienceMode:z.enum(["ALL_COLLEGES","SELECTED_COLLEGES"]),
  +  collegeIds:z.array(z.uuid()).max(500),
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-67 presents exact section-specific verification reasons and success copy

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'apiBase==="/api/admin/verification"'
  - Expected
  + Received
  - apiBase==="/api/admin/verification"
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-43 shows actor sentences and sanitized event details

  ```
  AssertionError: expected 'Ananya changed promoted Cohort 2027' to be 'Ananya promoted cohort Cohort 2027' // Object.is equality
  Expected: "Ananya promoted cohort Cohort 2027"
  Received: "Ananya changed promoted Cohort 2027"
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-45 shows 50 events with older matching count

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'limit: 50'
  - Expected
  + Received
  - limit: 50
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
- chat-4 Super Admin Tenants and Modules verified source contracts > SA-tenants-modules-44 tells Super Admin the current activity scope

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Platform-wide activity.'
  - Expected
  + Received
  - Platform-wide activity.
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```
