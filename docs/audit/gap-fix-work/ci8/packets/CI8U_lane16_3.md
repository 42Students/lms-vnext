# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-admin-write-safety-guards.test.ts (1 failing)
- GR-31 + GR-09 Super Admin write safety > SA-tenants-branding-01 prevents rapid duplicate writes and retains unsaved branding after network failure

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'disabled={saving}'
  - Expected
  + Received
  - disabled={saving}
  + "use client";
  +
  + import { useEffect, useRef, useState, useTransition } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat7-superadmin-content-live-datetime-parity.test.ts (1 failing)
- SA-academics-people-58 live meeting IST/UTC calendar integrity > rejects invalid date before calling the content PATCH endpoint and keeps the user's edit open

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'className="min-h-11'
  - Expected
  + Received
  - className="min-h-11
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Dialog } from "@/components/ui/dialog";
  + import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";
  ```
