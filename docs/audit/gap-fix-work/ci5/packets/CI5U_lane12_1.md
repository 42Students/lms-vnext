# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-team-attribution.test.ts (1 failing)
- HR-BREAK-TEAM-ATTRIBUTION-40: count approved drives, never stale request history > college branch suggestions fail closed for mismatched recruiter principal

  ```
  AssertionError: expected 'import "server-only";\nimport {hasAct…' to contain 'context.recruiter.userId!==context.us…'
  - Expected
  + Received
  - context.recruiter.userId!==context.user.id
  + import "server-only";
  + import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import { getRecruiterCollegeDemographics } from "./recruiter-college-demographics-service";
  ```

## tests/unit/PROJ-BREAK-chat9-sa-quiz-last-third.test.ts (1 failing)
- Super Admin last-third quiz directory, forged URL and outage contract > UX-admin-quizzes-04 independent loading failures never show false empty directories

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'AdminAssessmentDirectory data={data}'
  - Expected
  + Received
  - AdminAssessmentDirectory data={data}
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```

## tests/unit/UX-chat7-learner-scroll-motion-01.test.ts (1 failing)
- UX-chat7-learner-scroll-motion-01 hidden scrollbar resilience > names keyboard-operable Board lanes and explains horizontal scroll on phones

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/UX-cross-audit-recruiter-tracker-chat3.test.ts (1 failing)
- Chat-3 source cross-audit - actual UX and safety contracts > UX-tracker-02

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'setSimilarError("Related issues are t…'
  - Expected
  + Received
  - setSimilarError("Related issues are temporarily unavailable.")
  + "use client";
  +
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-tpo-batches-batchid-students-01.test.ts (1 failing)
- UX-tpo-batches-batchid-students-01 /tpo/batches/[batchId]/students > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /(?<![a-z-])min-h-(?:9|10)\b/
  - Expected:
  /(?<![a-z-])min-h-(?:9|10)\b/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {Disclosure} from \"@/components/ui/disclosure\";
  import {Badge} from \"@/components/ui/badge\";
  import {DataTable} from \"@/components/ui/data-table\";
  ```

## tests/unit/chat11-college-unconfirmed-decisions-round10.test.ts (1 failing)
- chat-11 delegated College Admin decisions > COL-academic-setup-41 supports long cards and keyboard-scrollable tables at 375px

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'grid grid-cols-1 gap-3 sm:grid-cols-2'
  - Expected
  + Received
  - grid grid-cols-1 gap-3 sm:grid-cols-2
  + import type { ReactNode } from "react";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Button } from "@/components/ui/button";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/chat12-round24-bulk-timed-debar.test.ts (1 failing)
- TPO timed debarment bulk guard > TPO-students-06 validates batches, duration and reason before per-learner server writes

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'action:"LIFT",debarmentId:active[0].id'
  - Expected
  + Received
  - action:"LIFT",debarmentId:active[0].id
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts (1 failing)
- SA-FACULTY-CSV-17 prevent stale bulk onboarding after replacement file > guards against invalid replacement files, out-of-order File.text and double confirm

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain 'if(version===fileVersion.current)setC…'
  - Expected
  + Received
  - if(version===fileVersion.current)setCsv(text)
  + "use client";
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
  ```
