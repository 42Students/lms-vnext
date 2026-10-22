# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-academic-setup-round5-gap-verification.test.ts (4 failing)
- chat-11 college academic page parity round five > COL-academic-setup-23 derives optional program code and preserves 1–10 integer year duration and editable department

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'deriveSuperAdminProgramCode(name)'
  - Expected
  + Received
  - deriveSuperAdminProgramCode(name)
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```
- chat-11 college academic page parity round five > COL-academic-setup-29 disables dependent batch removal with explicit student and class counts

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Move or remove its ${row.activeSectio…'
  - Expected
  + Received
  - Move or remove its ${row.activeSections} classes and ${row.activeEnrolledLearners} students before deleting.
  + "use client";
  + import { Button } from "@/components/ui/button";
  +
  + import { useEffect, useState, useTransition, type FormEvent } from "react";
  ```
- chat-11 college academic page parity round five > COL-academic-setup-32 launches a selected class schedule from its list row

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'defaultSectionId={classId}'
  - Expected
  + Received
  - defaultSectionId={classId}
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeRecurringRouteModal } from "./route-modal";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-11 college academic page parity round five > COL-academic-setup-39 uses Export CSV labels and keeps intentional capped server export

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'Export CSV'
  - Expected
  + Received
  - Export CSV
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/college-group-csv-preview.test.ts (1 failing)
- Student Group email import dry-run > rejects missing header, oversize files and malformed quoting

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```

## tests/unit/faculty-course-list-model.test.ts (1 failing)
- Faculty Course list query and bounded cards > pages before loading workspaces and clamps stale out-of-range pages

  ```
  AssertionError: expected [ …(75) ] to have a length of 27 but got 75
  - Expected
  + Received
  - 27
  + 75
  ```

## tests/unit/global-error-boundary.test.ts (1 failing)
- GR-11 custom root error boundary > GR-11 renders calm heading, retry and home recovery with no technical content

  ```
  AssertionError: expected '<html lang="en"><head></head><body><m…' to contain 'This page is temporarily unavailable'
  Expected: "This page is temporarily unavailable"
  Received: "<html lang="en"><head></head><body><main role="alert" class="flex min-h-dvh w-full min-w-0 flex-col items-center justify-center bg-[#fafbfc] p-8 text-center"><h1 class="m-0 text-[64px] font-extrabold leading-none text-[#1e9aa8]">500</h1><h2 class="mb-2 mt-4 text-[24px] font-semibold leadi
  ```

## tests/unit/learner-application-url-model.test.ts (1 failing)
- own application URL navigation > restores committed filters and resets pagination

  ```
  AssertionError: expected { q: 'developer', view: 'all', …(4) } to match object { q: 'developer', …(4) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "applicationId": "81818181-8181-4818-8818-818181818181",
  "page": 1,
  "q": "developer",
  ```

## tests/unit/learner-job-detail-parity.test.ts (3 failing)
- Learner published placement Job Detail > does not disclose unpublished/other-college jobs on arbitrary job IDs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listLearnerPlacementJobs(context)'
  - Expected
  + Received
  - listLearnerPlacementJobs(context)
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  + import {readOptionalLearnerPlacementSource} from "@/modules/placements/learner-optional-placement-source";
  ```
- Learner published placement Job Detail > uses a dedicated detail instead of generic uncontextualized cards

  ```
  AssertionError: expected 'import type {ReactNode} from "react";…' to contain 'Placement breadcrumbs'
  - Expected
  + Received
  - Placement breadcrumbs
  + import type {ReactNode} from "react";
  + import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
  + import { Breadcrumbs } from "@/components/ui/breadcrumbs";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Learner published placement Job Detail > distinguishes loading/failure from not-found and allows retry

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  +
  + export default function LearnerJobDetailLoading() {
  +   return <GracefulPageLoading label="Loading placement job details" shape="directory" />;
  ```
