# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-reassigned-tracker-parity.test.ts (1 failing)
- chat-16 reassigned tracker issue workflows > SA-placements-projects-106 selects page issues and performs authorized optimistic writes while retaining failed IDs

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Failed IDs:'
  - Expected
  + Received
  - Failed IDs:
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
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
