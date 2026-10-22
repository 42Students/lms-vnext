# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-profile-page.test.ts (1 failing)
- HR-BREAK-chat19-profile-page: active recruiter reads and session denial > HR-BREAK-PROFILE-IDENTITY-10 rejects mismatched recruiter identity before profile and grant reads

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT' but got 'Cannot destructure property \'searchP…'
  Expected: "REDIRECT"
  Received: "Cannot destructure property 'searchParams' of 'undefined' as it is undefined."
  ```

## tests/unit/UX-activity-index-01.test.ts (1 failing)
- UX-activity-index-01 Activity Log > UX-activity-index-02 uses shared, accessible mobile-safe filter controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<Card as="article"'
  - Expected
  + Received
  - <Card as="article"
  + import Link from "next/link";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Fragment,type ReactNode} from "react";
  + import { StatusBadge } from "@/components/ui/status-badge";
  ```

## tests/unit/chat11-final-SA-tenants-modules-R01.test.ts (1 failing)
- Super Admin control-page overview final sprint > SA-tenants-modules-R01 restores all three header-card contracts with truthful bounded counters

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'getModuleAccessOverviewMetrics(contex…'
  - Expected
  + Received
  - getModuleAccessOverviewMetrics(context,result.items.map(item=>item.id))
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Banner } from "@/components/ui/banner";
  ```

## tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts (1 failing)
- SA-FACULTY-CSV-17 prevent stale bulk onboarding after replacement file > guards against invalid replacement files, out-of-order File.text and double confirm

  ```
  AssertionError: expected '"use client";\nimport { useRef, useSt…' to contain '||!allowed())return'
  - Expected
  + Received
  - ||!allowed())return
  + "use client";
  + import { useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { parseFacultyBulkCsv } from "@/modules/people/faculty-bulk-import-model";
  ```
