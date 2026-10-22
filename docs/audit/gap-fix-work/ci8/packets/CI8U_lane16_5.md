# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-notice-round4-verification.test.ts (1 failing)
- TPO placement announcement round-4 evidence > TPO-inbox-team-58 enforces title 200 and message 8000 on create and edit

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'max(200)'
  - Expected
  + Received
  - max(200)
  + import "server-only";
  + import {and,eq,isNull} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
