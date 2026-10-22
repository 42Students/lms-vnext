# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-final-LEARNER-course-detail-07.test.ts (1 failing)
- chat-9 final sprint > LEARNER-course-detail-07 preserves verified functionality and safe failure states

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'Materials ({materials.length}/20)'
  - Expected
  + Received
  - Materials ({materials.length}/20)
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Textarea } from "@/components/ui/textarea";
  +
  ```

## tests/unit/chat9-round9-recruiter-settings.test.ts (2 failing)
- chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-56 only extends a persisted active recruiter grant after explicit confirmation and expectedVersion

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'setNotice("Access extended")'
  - Expected
  + Received
  - setNotice("Access extended")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import {EmptyState} from "@/components/ui/empty-state";
  ```
- chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-57 preserves historical expiry and displays designation, verification and removal rather than a false live session

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Access & verification'
  - Expected
  + Received
  - Access & verification
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat9-unknown-report-recovery.test.ts (1 failing)
- TPO report unknown-route recovery > TPO-calendar-reports-53 shows Unknown report and return to reports only for authorized TPO members

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Back to reports'
  - Expected
  + Received
  - Back to reports
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/college-export-cap-messages.test.ts (3 failing)
- College Admin export cap disclosures > Electives export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin export cap disclosures > Semesters export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- College Admin export cap disclosures > Batches export UI discloses the same bounded cap as the exporter

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'flex flex-wrap items-center gap-3'
  - Expected
  + Received
  - flex flex-wrap items-center gap-3
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
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

## tests/unit/graceful-mutation-adoption-round4.test.ts (3 failing)
- chat-14 guarded mutation adoption > GR-30 GR-31 guards department creation and retains accessible validation and success

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'void run(async () => {'
  - Expected
  + Received
  - void run(async () => {
  + "use client";
  +
  + import { useEffect, useRef, useState } from "react";
  + import { useGuardedAction } from "@/hooks/use-guarded-action";
  ```
- chat-14 guarded mutation adoption > GR-30 GR-31 preserves resource confirmation and server message while serializing completion

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'setComplete(true)'
  - Expected
  + Received
  - setComplete(true)
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  +
  +
  ```
- chat-14 guarded mutation adoption > GR-30 GR-31 protects TPO follow-up creation and retains entered details on failure

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'setError("Could not save the follow-u…'
  - Expected
  + Received
  - setError("Could not save the follow-up")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/learner-coding-profile-privacy.test.ts (1 failing)
- never renders spoofed profile hosts or unsafe schemes

  ```
  AssertionError: expected 'https://github.com/real' to be null
  - Expected:
  null
  + Received:
  "https://github.com/real"
  ```

## tests/unit/learner-placements-47-notice-audience.test.ts (1 failing)
- LEARNER-placements-47 notice origin and scope > LEARNER-placements-47 marks actual edited notices only when updated version is recorded

  ```
  AssertionError: expected '2099-01-02T00:00:00.000Z' to be null
  - Expected:
  null
  + Received:
  "2099-01-02T00:00:00.000Z"
  ```
