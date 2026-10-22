# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-unsubmitted-navigation.test.ts (1 failing)
- IIT Dharwad Projects: unsubmitted page never loses its filters > PROJ-BREAK-submissions-41 the unsubmitted tab does not depend on summary or other delivery results

  ```
  AssertionError: expected '"use client";\nimport { useCallback, …' to contain 'filterView?"?view=NOT_SUBMITTED":"?"'
  - Expected
  + Received
  - filterView?"?view=NOT_SUBMITTED":"?"
  + "use client";
  + import { useCallback, useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```

## tests/unit/chat11-learner-projects-list-round3.test.ts (1 failing)
- chat-11 learner Projects legacy list behavior > COL-academic-setup-24 retains program form reset and valid page size persistence choices

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'options={[10,25,50,100]}'
  - Expected
  + Received
  - options={[10,25,50,100]}
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```
