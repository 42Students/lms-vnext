# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat11-tpo-private-notifications-revocation.test.ts (1 failing)
- TPO-settings-audit-NOTIFY-READ-05 private inbox data after role revocation > revalidates persisted TPO role after private notification and preference reads

  ```
  AssertionError: expected 'import "server-only";\nimport { z } f…' not to contain 'inAppNotifications.body'
  - Expected
  + Received
  - inAppNotifications.body
  + import "server-only";
  + import { z } from "zod";
  +
  + import {
  ```

## tests/unit/chat12-fixed-main-requests-audit-r3.test.ts (4 failing)
- TPO Requests FIXED-ON-MAIN source contracts; DB acceptance separate > TPO-requests-verification-07 preserves its source contract

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'status:"APPROVED"'
  - Expected
  + Received
  - status:"APPROVED"
  + import "server-only";
  + import {and,eq,inArray} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
- TPO Requests FIXED-ON-MAIN source contracts; DB acceptance separate > TPO-requests-verification-09 preserves its source contract

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Student number:'
  - Expected
  + Received
  - Student number:
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- TPO Requests FIXED-ON-MAIN source contracts; DB acceptance separate > TPO-requests-verification-10 preserves its source contract

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Decided by:'
  - Expected
  + Received
  - Decided by:
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```
- TPO Requests FIXED-ON-MAIN source contracts; DB acceptance separate > TPO-requests-verification-25 preserves its source contract

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one'
  - Expected
  + Received
  - Review one by one
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```

## tests/unit/chat12-round34-profile-readiness.test.ts (1 failing)
- TPO-students-31 exposes a per-student readiness note and eligibility provenance without inventing prep test averages

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain '"Prep %","Not recorded"'
  - Expected
  + Received
  - "Prep %","Not recorded"
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```

## tests/unit/chat12-tpo-company-view-service-permissions.test.ts (1 failing)
- TPO-BREAK-company-service-08 scoped company directory reads and redaction > denies foreign college and does not probe optional CRM tables or any records

  ```
  AssertionError: expected [Function] to throw error including 'PERMISSION_DENIED' but got 'Missing permission: placements.manage'
  Expected: "PERMISSION_DENIED"
  Received: "Missing permission: placements.manage"
  ```

## tests/unit/chat13-academic-page-copy.test.ts (1 failing)
- Super Admin Academic Setup page copy > SA-academics-people-02 shows the legacy no-college guidance without exposing the six-step strip

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Select a college to continue'
  - Expected
  + Received
  - Select a college to continue
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
  ```

## tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts (1 failing)
- SA-FACULTY-CSV-17 prevent stale bulk onboarding after replacement file > guards against invalid replacement files, out-of-order File.text and double confirm

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain 'setCsv("");setResults([]);setError(""…'
  - Expected
  + Received
  - setCsv("");setResults([]);setError("");setFilename(file?.name??"")
  + "use client";
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
  ```
