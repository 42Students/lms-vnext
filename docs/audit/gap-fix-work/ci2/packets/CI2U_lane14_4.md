# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-audit-actors-02.test.ts (1 failing)
- UX-tpo-audit-actors-02 > renders a shared responsive DataTable with explicit legacy empty copy and authorized rows

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + import { DateInput } from "@/components/ui/date-input";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/UX-tpo-companies-companyid-contact-log-01.test.ts (1 failing)
- UX-tpo-companies-companyid-contact-log-01 /tpo/companies/[companyId]/contact-log > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import {DataTable} from \"@/components/ui/data-table\";
  import {Disclosure} from \"@/components/ui/disclosure\";
  import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  ```

## tests/unit/UX-tpo-placements-jobs-jobid-about-01.test.ts (1 failing)
- UX-tpo-placements-jobs-jobid-about-01 /tpo/placements/jobs/[jobId]/about > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {DataTable} from "@/components/ui/data-table";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  ```

## tests/unit/auth-login-service.test.ts (1 failing)
- auth config > resolves platform hosts without needing AUTH_SECRET

  ```
  AssertionError: expected [ '127.0.0.1', '[::1]', 'localhost' ] to deeply equal [ '127.0.0.1', 'localhost' ]
  - Expected
  + Received
  [
  "127.0.0.1",
  +   "[::1]",
  "localhost",
  ]
  ```

## tests/unit/chat11-final-TPO-settings-audit-60.test.ts (1 failing)
- TPO recruiter grant final sprint export > TPO-settings-audit-60 preserves scoped CSV headers, privacy and the recruiters filename

  ```
  AssertionError: expected 'import { gridExportFilename } from "@…' to contain 'filename="recruiters.csv"'
  - Expected
  + Received
  - filename="recruiters.csv"
  + import { gridExportFilename } from "@/modules/placements/grid-export-filename";
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {apiErrorResponse} from "@/lib/api-error";
  ```

## tests/unit/chat11-tpo-communication-adversarial.test.ts (3 failing)
- TPO-settings-audit-CAS-01 section changes are validated and idempotent > TPO-settings-audit-REVOKE-01 rechecks live staff role and session in the write transaction

  ```
  AssertionError: expected 1833 to be greater than 3659
  ❯ tests/unit/chat11-tpo-communication-adversarial.test.ts:58:25
  56|   const version=source.indexOf("tpoCommunicationUpdateAlreadyApplied(c…
  57|   expect(collegeLock).toBeGreaterThan(0);
  58|   expect(authorization).toBeGreaterThan(collegeLock);
  |                         ^
  59|   expect(authorization).toBeLessThan(version);
  60|   expect(source).toContain("organizationId:college.organizationId");
  ```
- TPO-settings-audit-PREP-02 threshold preference retries > blocks immediate duplicate actions, preserves the accepted version and renders safe errors

  ```
  AssertionError: expected '"use client";\nimport {useRouter} fro…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {useRouter} from "next/navigation";
  + import {useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```
- TPO-settings-audit-EMAIL-01 graceful, duplicate-safe optional email controls > latches synchronously, maps known statuses, never renders an untrusted API error

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import {useRouter} from "next/navigation";
  + import {useRef,useState} from "react";
  ```
