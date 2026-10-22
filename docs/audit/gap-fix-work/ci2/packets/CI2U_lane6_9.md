# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-tenant-lifecycle-signin-archive-policy.test.ts (1 failing)
- chat-4 tenant lifecycle and sign-in behavioral security > SA-colleges-directory-09 paginates bounded tenant results and never generates out-of-range links

  ```
  AssertionError: expected 25 to be 20 // Object.is equality
  - Expected
  + Received
  - 20
  + 25
  ```

## tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts (1 failing)
- TPO second-third — offer letters never invent proof > TPO-2ND-PAGE-letters-02 enforces TPO and persisted scope, explains unsupported letters in an accessible table

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'empty={<p role="status"'
  - Expected
  + Received
  - empty={<p role="status"
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { Alert } from "@/components/ui/alert";
  ```

## tests/unit/chat6-college-placements-read-parity.test.ts (2 failing)
- College Admin placement register and drive parity > COL-placements-07 College pipeline table exposes legacy email college source applied date age and match score

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain '<DataTable columns={columns} rows={ro…'
  - Expected
  + Received
  - <DataTable columns={columns} rows={rows}
  + "use client";
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  + import {Button} from "@/components/ui/button";
  ```
- College Admin placement register and drive parity > COL-placements-08 College drive table has legacy columns mobile cards bulk lifecycle and row actions

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'caption="College placement drives"'
  - Expected
  + Received
  - caption="College placement drives"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-10.test.ts (1 failing)
- Final sprint legacy recruiter task links > REC-home-drives-10 legacy task deep links map onto authorized recruiter workspaces

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'const safeTab=tab==="interviews"||tab…'
  - Expected
  + Received
  - const safeTab=tab==="interviews"||tab==="results"?"rounds"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/chat6-superadmin-course-entrypoints.test.ts (2 failing)
- Super Admin course in-tab entry points > SA-academics-people-77 links lessons assignments quizzes and progress to owning offering workspace

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to match /Open offering(?: to a…/ submissions)? →
  - Expected:
  /Open offering(?: to add lessons| builder \/ submissions)? →/
  + Received:
  "import Link from \"next/link\";
  import { Button } from \"@/components/ui/button\";
  import { Input } from \"@/components/ui/input\";
  import { Select } from \"@/components/ui/select\";
  ```
- Super Admin course in-tab entry points > SA-academics-people-57 lessons have course filter CSV and bulk visibility controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'SuperAdminLearningFilterFields'
  - Expected
  + Received
  - SuperAdminLearningFilterFields
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-tracker-intake-policy-round8.test.ts (1 failing)
- 42 Tracker reporter access security > SA-placements-projects-101 preserves approved authenticated reporter privacy boundary instead of anonymous listing

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if (!isSuperAdmin(context) || context…'
  - Expected
  + Received
  - if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE") redirect
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
  ```
