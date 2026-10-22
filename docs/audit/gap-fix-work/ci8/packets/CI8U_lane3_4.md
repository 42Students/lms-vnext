# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-projects-contracts-round8.test.ts (1 failing)
- chat9 college projects scope and persistence contracts > COL-projects-07 enforces a mentor for ACTIVE creation and permits scoped class roster choices

  ```
  AssertionError: expected '"use client";\n\nimport { type FormEv…' to contain ']).slice(0,500)'
  - Expected
  + Received
  - ]).slice(0,500)
  + "use client";
  +
  + import { type FormEvent, useEffect, useRef, useState } from "react";
  + import { useRouter } from "next/navigation";
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
