# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-batches-batchid-classes-01.test.ts (1 failing)
- UX-tpo-batches-batchid-classes-01 /tpo/batches/[batchId]/classes > preserves legacy UI while applying signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import Link from \"next/link\";
  import {getCurrentRequestContext} from \"@/auth/request-context\";
  import {TpoBatchWorkspaceTabs} from \"@/components/tpo/tpo-batch-workspace-tabs\";
  import {TpoBatchClassDecision} from \"@/components/tpo/tpo-batch-class-decision\";
  ```

## tests/unit/UX-tpo-companies-companyid-people-01.test.ts (1 failing)
- UX-tpo-companies-companyid-people-01 /tpo/companies/[companyId]/people > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {PageHeader} from \"@/components/ui/page-header\";
  import {Disclosure} from \"@/components/ui/disclosure\";
  import {Alert} from \"@/components/ui/alert\";
  import {EmptyState} from \"@/components/ui/empty-state\";
  ```

## tests/unit/UX-tracker-cross-audit-controls.test.ts (5 failing)
- Cross-audit Tracker directory and actions > UX-tracker-audit-findings-02 fields, long-list pagination and filters keep mobile hit targets

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '<Input name="area"'
  - Expected
  + Received
  - <Input name="area"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```
- Cross-audit Tracker directory and actions > UX-tracker-issues-02 issue detail link works on touch and keyboard without hover

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'inline-flex min-h-11 items-center tex…'
  - Expected
  + Received
  - inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
  ```
- Cross-audit Tracker directory and actions > UX-tracker-audit-findings-publicId-02 similar-findings action is keyboard-visible

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]">Looks similar
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- Cross-audit Tracker directory and actions > UX-tracker-shared-workflow-02 removes undersized actions and low-contrast link ink

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Checkbox } from "@/components/ui/checkbox";
  +
  ```
- Cross-audit Tracker directory and actions > UX-tracker-shared-logs-02 removes undersized actions and low-contrast link ink

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + "use client";
  + import { Button } from "@/components/ui/button";
  +
  + import {useState} from "react";
  ```

## tests/unit/chat-3-graceful-pages.test.ts (5 failing)
- Chat-3 graceful-operation coverage for touched pages > GR-19 course detail, college attendance and learner profile show loading skeletons

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + export default function CollegeOfferingLoading() {
  +   return <GracefulPageLoading label="Loading course details" shape="directory"/>;
  + }
  ```
- Chat-3 graceful-operation coverage for touched pages > GR-31 mutating attendance correction and learner contact save guard duplicate actions

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'disabled={correcting}'
  - Expected
  + Received
  - disabled={correcting}
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- Chat-3 graceful-operation coverage for touched pages > GR-71 course catalogue and attendance lists explain empty vs filtered empty

  ```
  AssertionError: expected '"use client";\n\nimport { ADMIN_ATTEN…' to contain 'No attendance data for this month'
  - Expected
  + Received
  - No attendance data for this month
  + "use client";
  +
  + import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
  + import {AdminAttendanceParentContactEditor} from "./admin-attendance-parent-contact-editor";
  ```
- Chat-3 graceful-operation coverage for touched pages > GR-90 no raw error code in corrected attendance alert and course load error summary

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- Chat-3 graceful-operation coverage for touched pages > GR-91 Retry is keyboard-accessible in all three role error screens

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain '<Button onClick={reset}>Retry</Button>'
  - Expected
  + Received
  - <Button onClick={reset}>Retry</Button>
  + "use client";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/chat11-mentor-delivery-decision-round3.test.ts (1 failing)
- mentor review parity > MEN-projects-meetings-65 preserves feedback and shows safe stale-review guidance

  ```
  AssertionError: expected '"use client";\n\nimport {\n  type For…' to contain 'if (pending || staleReview) return;'
  - Expected
  + Received
  - if (pending || staleReview) return;
  + "use client";
  +
  + import {
  +   type FormEvent,
  ```

## tests/unit/chat11-tpo-job-type-transaction-authorization.test.ts (1 failing)
- TPO-settings-audit-23 transactional job-type settings safety > TPO-settings-audit-23 rejects empty or punctuation-only labels but accepts Unicode combining marks

  ```
  AssertionError: --: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
