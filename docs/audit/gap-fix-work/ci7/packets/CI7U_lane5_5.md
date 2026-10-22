# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-notifications-history-chat2.test.ts (2 failing)
- TPO Notifications history and refresh legacy fidelity > TPO-inbox-team-65 restores All (n), Latest n and legacy empty-state labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'allLabel={nextHref?"Latest "+items.le…'
  - Expected
  + Received
  - allLabel={nextHref?"Latest "+items.length:"All ("+items.length+")"}
  + import Link from "next/link";
  + import {TpoNotificationRefresh} from "@/components/tpo/tpo-notification-refresh";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- TPO Notifications history and refresh legacy fidelity > TPO-inbox-team-67 treats notifications over thirty days as read and keeps older-unread hints

  ```
  AssertionError: expected null to be an instance of Date
  ❯ tests/unit/tpo-notifications-history-chat2.test.ts:19:5
  17|   expect(now.getTime()-cutoff.getTime()).toBe(30*86400000);
  18|   expect(tpoEffectiveReadAt(null,new Date("2099-01-01T00:00:00.000Z"),…
  19|    .toBeInstanceOf(Date);
  |     ^
  20|   expect(tpoEffectiveReadAt(null,new Date("2099-12-30T00:00:00.000Z"),…
  21|   const page=src("src/app/(authenticated)/tpo/notifications/page.tsx");
  ```

## tests/unit/ux-chat14-mentor-quality-04c.test.ts (3 failing)
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-resources-directory-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-review-overview-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-risk-readiness-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
