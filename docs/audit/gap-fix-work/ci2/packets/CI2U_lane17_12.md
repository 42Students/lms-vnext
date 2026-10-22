# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-dashboard-parity.test.ts (1 failing)
- Learner placement dashboard route wiring > shows separate scheduled/attention and empty/error loading states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Placement snapshot'
  - Expected
  + Received
  - Placement snapshot
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```

## tests/unit/mentor-projects-meetings-chat7-acceptance.test.ts (2 failing)
- Mentor Projects meeting and board acceptance > MEN-projects-meetings-26 preserves the reviewed mentor surface

  ```
  AssertionError: expected '"use client";\nimport { button } from…' to contain 'past meetings / meeting history'
  - Expected
  + Received
  - past meetings / meeting history
  + "use client";
  + import { button } from "@/components/ui/button";
  + import {useeffect,usestate} from "react";
  +
  ```
- Mentor Projects meeting and board acceptance > MEN-projects-meetings-34 preserves the reviewed mentor surface

  ```
  AssertionError: expected '"use client";\n\nimport { usestate } …' to contain 'ships in release'
  - Expected
  + Received
  - ships in release
  + "use client";
  +
  + import { usestate } from "react";
  + import { select } from "@/components/ui/select";
  ```

## tests/unit/projects-mentor-attention-risk-chat14.test.ts (2 failing)
- chat-14 mentor attention risk and workflow policies > calculates overload above 150% of nonnegative per-mentor average

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- chat-14 mentor attention risk and workflow policies > never rounds unfinished sprint progress to 100 percent

  ```
  AssertionError: expected { total: 1000, completed: 999, …(3) } to deeply equal { total: 1000, completed: 999, …(3) }
  - Expected
  + Received
  {
  "blocked": 0,
  "completed": 999,
  -   "completionPercent": 99,
  +   "completionPercent": 100,
  ```

## tests/unit/recruiter-calendar-model.test.ts (1 failing)
- recruiter calendar projection > reuses Monday-first week and shared month and agenda windows

  ```
  AssertionError: expected '2026-10-11' to be '2026-10-12' // Object.is equality
  Expected: "2026-10-12"
  Received: "2026-10-11"
  ```

## tests/unit/sa-tenants-modules-15-bulk-import.test.ts (3 failing)
- SA-tenants-modules-15 bulk college CSV > parses header, quoted commas and escaped quotes

  ```
  Error: Row 2: college code must use 3–63 letters, numbers or hyphens.
  ❯ src/modules/colleges/bulk-import-model.ts:76:11
  74|   }
  75|   if(!/^[A-Za-z0-9-]{3,63}$/.test(code))
  76|     throw Error("Row "+line+": college code must use 3–63 letters, num…
  |           ^
  77|   return {line,name,code,city:v(2)||null,state:v(3)||null,country:v(4)…
  78|  });
  ```
- SA-tenants-modules-15 bulk college CSV > parses five-column CSV without headers

  ```
  Error: Row 1: college code must use 3–63 letters, numbers or hyphens.
  ❯ src/modules/colleges/bulk-import-model.ts:76:11
  74|   }
  75|   if(!/^[A-Za-z0-9-]{3,63}$/.test(code))
  76|     throw Error("Row "+line+": college code must use 3–63 letters, num…
  |           ^
  77|   return {line,name,code,city:v(2)||null,state:v(3)||null,country:v(4)…
  78|  });
  ```
- SA-tenants-modules-15 bulk college CSV > rejects duplicates and oversize inputs before writing

  ```
  AssertionError: expected [Function] to throw error matching /Duplicate/ but got 'Row 2: duplicate college code abc (fi…'
  - Expected:
  /Duplicate/
  + Received:
  "Row 2: duplicate college code abc (first used on line 1)."
  ```

## tests/unit/super-admin-template-directory-model.test.ts (1 failing)
- Super Admin template catalogue filters > retains filters in internal next-page route

  ```
  AssertionError: expected 5 to be 3 // Object.is equality
  - Expected
  + Received
  - 3
  + 5
  ```
