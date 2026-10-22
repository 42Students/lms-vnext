# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-notice-audience-round4.test.ts (1 failing)
- TPO notice audience selection and graceful preview > TPO-inbox-team-44 chooses actual college-scoped batch branch and published-drive IDs, not typed UUIDs by default

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'inArray(placementJobs.status,["PUBLIS…'
  - Expected
  + Received
  - inArray(placementJobs.status,["PUBLISHED","CLOSED"])
  + import "server-only";
  + import {and,asc,eq,isNull} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {cohorts,departments,placementJobs,programs} from "@/db/schema";
  ```

## tests/unit/ux-chat14-mentor-quality-04a.test.ts (4 failing)
- chat-14 mentor UX quality batch 04a > UX-mentor-landing-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-activity-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { Pagination } from "@/components/ui/pagination";
  + import { PageSizeSelect } from "@/components/ui/page-size-select";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-calendar-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-notifications-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { Suspense } from "react";
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {listMyProjectInstances} from "@/modules/projects/member-service";
  ```
