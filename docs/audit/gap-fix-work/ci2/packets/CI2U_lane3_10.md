# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-assessment-discussion-policy-matrix.test.ts (1 failing)
- COURSES-LEARNER-DISCUSSIONS-02 learner discussion draft and scoped response > rejects empty, oversized or double-submitted drafts regardless of click/keyboard origin

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-legacy-faculty-courses-copy.test.ts (1 failing)
- Faculty My Courses and course tab copy from dev legacy > uses exact My Courses heading in both normal and error states

  ```
  AssertionError: expected [ 'title="My Courses"', …(2) ] to have a length of 2 but got 3
  - Expected
  + Received
  - 2
  + 3
  ```

## tests/unit/chat7-round3-mentor-legacy-urls.test.ts (2 failing)
- chat-7 mentor versioned workflow and legacy link parsing > MEN-projects-meetings-R06 has a zero-release recovery state

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sprints yet. Add the sprints'
  - Expected
  + Received
  - No sprints yet. Add the sprints
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-7 mentor versioned workflow and legacy link parsing > MEN-projects-meetings-R08 keeps live mentor search controls

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'onInput={mentor?liveRefresh:undefined}'
  - Expected
  + Received
  - onInput={mentor?liveRefresh:undefined}
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat9-admin-activity-export-copy.test.ts (1 failing)
- legacy Super Admin and College Admin Activity Log export button > uses exact Export button copy while retaining both scoped export endpoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '            Export\n          </a>'
  - Expected
  + Received
  -             Export
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {
  ```

## tests/unit/chat9-final-TPO-campaigns-public-03.test.ts (1 failing)
- chat-9 final sprint > TPO-campaigns-public-03 verifies the implemented contract

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'Provider acceptance does not prove re…'
  - Expected
  + Received
  - Provider acceptance does not prove recipient delivery.
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```

## tests/unit/chat9-round9-recruiter-settings.test.ts (2 failing)
- chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-56 only extends a persisted active recruiter grant after explicit confirmation and expectedVersion

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'setNotice("Access extended")'
  - Expected
  + Received
  - setNotice("Access extended")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import {EmptyState} from "@/components/ui/empty-state";
  ```
- chat-9 round9 TPO recruiter and communication settings > TPO-settings-audit-57 preserves historical expiry and displays designation, verification and removal rather than a false live session

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Access & verification'
  - Expected
  + Received
  - Access & verification
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```
