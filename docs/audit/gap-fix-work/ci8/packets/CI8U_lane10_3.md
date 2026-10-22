# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-tpo-second-third-page-journeys.test.ts (1 failing)
- chat-5 second-third TPO page journeys > UX-TPO-DRIVE-STOP-37 provides 44px return actions and explicit blocked-state messages on both previews

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'hasMembershipRole(context,"TPO")'
  - Expected
  + Received
  - hasMembershipRole(context,"TPO")
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```

## tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts (1 failing)
- Chat-6 tracker issue list parity > SA-placements-projects-106 bulk status changes preserve per-issue version guards and partial failure reporting

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
