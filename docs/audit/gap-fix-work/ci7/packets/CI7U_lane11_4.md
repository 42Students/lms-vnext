# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/graceful-alert-scheduler.test.ts (1 failing)
- scheduled Telegram alerts > GR-118 GR-119 GR-125 isolates failed optional checks without stopping later digest work

  ```
  AssertionError: expected 'import { cloudLoggingAccessToken, isC…' to contain 'withScheduledLease("telegram-digest"'
  - Expected
  + Received
  - withScheduledLease("telegram-digest"
  + import { cloudLoggingAccessToken, isCloudLogNamespace, isCloudLogProject, readCloudLogErrorPage } from "./cloud-log-reader";
  + import { reportErrorForAlert } from "./reporter";
  + import { reopenRegressedSignature } from "./policy";
  + import { randomUUID } from "node:crypto";
  ```

## tests/unit/learner-placements-chat7-legacy-headings-r7.test.ts (1 failing)
- chat-7 learner Placements legacy tabs and hero > LEARNER-placements-03 has no duplicate heading below shared tab strip

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain '<PageHeader'
  - Expected
  + Received
  - <PageHeader
  + import { Alert } from "@/components/ui/alert";
  + import { PageLoading } from "@/components/ui/page-loading";
  + import {StatusBadge,applicationStatusTone} from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  ```

## tests/unit/recruiter-chat14-autoapprove-contract.test.ts (1 failing)
- REC-home-drives-33 recruiter formal request auto approval > REC-home-drives-33 tells recruiters an autoapproved draft awaits publication, not review

  ```
  AssertionError: expected 'Rejected' to be 'Cancelled' // Object.is equality
  Expected: "Cancelled"
  Received: "Rejected"
  ```

## tests/unit/tpo-drive-applicant-partials-chat5.test.ts (1 failing)
- TPO drive applicant partial parity and query safety > TPO-drive-workspace-72 collapses mobile actions and filters

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '>Actions</summary>'
  - Expected
  + Received
  - >Actions</summary>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```
