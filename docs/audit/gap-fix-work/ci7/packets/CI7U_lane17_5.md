# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ux-admin-chat9-cross-audit-second.test.ts (3 failing)
- UX cross-audit /admin second third (chat-9) > UX-admin-lecture-halls-03 keeps every action visible on a phone and preserves failed drafts

  ```
  AssertionError: expected '"use client";\n\nimport { useRouter }…' to contain 'setFormError("Could not save the hall…'
  - Expected
  + Received
  - setFormError("Could not save the hall. Check your connection and retry.")
  + "use client";
  +
  + import { useRouter } from "next/navigation";
  + import Link from "next/link";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-analytics-02 shows missing-college help before invoking scoped services

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'caption="Company hiring report"'
  - Expected
  + Received
  - caption="Company hiring report"
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
  ```
- UX cross-audit /admin second third (chat-9) > UX-admin-placements-calendar-02 all calendar chips/events meet phone size and high contrast focus

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'md:min-h-9'
  - Expected
  + Received
  - md:min-h-9
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
