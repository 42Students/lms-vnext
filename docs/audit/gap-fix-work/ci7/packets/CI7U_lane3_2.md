# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-messaging-provider-history-contract-16.test.ts (1 failing)
- chat-16 campaign provider and aggregate history export boundaries > MESSAGING-EXOTEL-ACCEPT-16 requires real SID and affirmative provider state

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat2-ledger-tpo-round-result.test.ts (1 failing)
- TPO-drive-workspace-37/40/42 placement round lifecycle ledger > locks reordering for finished drives and every round with execution artifacts

  ```
  AssertionError: expected 'The order is locked because this driv…' to contain 'two rounds'
  Expected: "two rounds"
  Received: "The order is locked because this drive has ended."
  ```

## tests/unit/chat4-college-academics-people-weak-area.test.ts (1 failing)
- College academics/people weak-area behavioural ledger > COL-academics-CSV-01 uses neutralized formula cells, fixed field order, declared row cap and recorded data only

  ```
  AssertionError: expected '\ufeff"id","batchName","programId","c…' to contain 'Active learner enrollments'
  - Expected
  + Received
  - Active learner enrollments
  + ﻿"id","batchName","programId","currentSemester","academicYear","students","status","startDate","endDate"
  + "","'=IMPORTXML(1)","","","","0","ACTIVE","",""
  + "EXPORT TRUNCATED","Only the first 1000 matching records were exported. Narrow your filters."
  ```

## tests/unit/chat4-superadmin-college-subpages-role-audit.test.ts (1 failing)
- Super Admin college and tenant subpage threat and state audit > SA-COL-AUDIT-01 branding requires Super Admin scope and validates college before fetching stored URLs

  ```
  AssertionError: expected 'import { notFound } from "next/naviga…' to contain 'if (!branding) notFound()'
  - Expected
  + Received
  - if (!branding) notFound()
  + import { notFound } from "next/navigation";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {ErrorState} from "@/components/ui/error-state";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  ```
