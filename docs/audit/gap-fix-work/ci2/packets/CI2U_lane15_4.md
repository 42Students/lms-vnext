# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-tpo-audit-actors-03.test.ts (1 failing)
- UX-tpo-audit-actors-03 > uses shared controls without changing legacy labels or authorized data

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '<Button type="submit">Apply filters</…'
  - Expected
  + Received
  - <Button type="submit">Apply filters</Button>
  + import { DateInput } from "@/components/ui/date-input";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/UX-tpo-companies-companyid-contact-log-05.test.ts (1 failing)
- UX-tpo-companies-companyid-contact-log-05 > uses one mobile-first shared DataTable with the original honest empty state

  ```
  AssertionError: expected 'import {DataTable} from "@/components…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + import {DataTable} from "@/components/ui/data-table";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/UX-tpo-placements-jobs-jobid-applicants-pipeline-01.test.ts (1 failing)
- UX-tpo-placements-jobs-jobid-applicants-pipeline-01 /tpo/placements/jobs/[jobId]/applicants-pipeline > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```

## tests/unit/auth-origin.test.ts (1 failing)
- auth same-origin guard > accepts the public origin behind a trusted proxy

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat11-final-TPO-settings-audit-95.test.ts (1 failing)
- TPO audit entity navigation > TPO-settings-audit-95 retains scoped audit source subject and only projects validated links

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'href={row.entityHref}'
  - Expected
  + Received
  - href={row.entityHref}
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat11-tpo-config-validation.test.ts (1 failing)
- TPO-settings-audit-CONFIG-01 canonical config and date inputs > allows bounded multilingual job-type names, not markup/newlines or oversized fields

  ```
  AssertionError: ఇంటర్న్: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
