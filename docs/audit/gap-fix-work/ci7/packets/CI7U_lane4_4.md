# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-attendance-source-round5.test.ts (1 failing)
- chat-11 faculty attendance gap closure verification > FAC-attendance-grades-09 shows marked and unmarked session counts with monthly report tiles

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain '["Students",'
  - Expected
  + Received
  - ["Students",
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/learner-learning-misc-gap-closure.test.ts (6 failing)
- Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-14 assignment load error distinguishes network failure from empty results

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Button onClick={reset}>Retry</Button>'
  - Expected
  + Received
  - <Button onClick={reset}>Retry</Button>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { LEARNER_BACK_TO_COURSES } from "@/modules/courses/learner-course-copy-model";
  +
  ```
- Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-20 leaving an attempt asks for a guarded confirmation dialog

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'confirmVariant="danger" confirmLabel=…'
  - Expected
  + Received
  - confirmVariant="danger" confirmLabel="Leave quiz"
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Drawer} from "@/components/ui/drawer";
  + import {isSafeInternalHref} from "@/lib/safe-internal-href";
  ```
- Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-32 schedule header has Today and Next summaries with tooltips

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'nextEvent?'
  - Expected
  + Received
  - nextEvent?
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```
- Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-33 route-level network failures and week emptiness have safe, distinct legacy wording

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'No scheduled classes this week.'
  - Expected
  + Received
  - No scheduled classes this week.
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```
- Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-36 attendance report restores legacy four column labels

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'header:"Status"'
  - Expected
  + Received
  - header:"Status"
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  ```
- Learner Learning Misc legacy gap evidence > LEARNER-learning-misc-38 attendance distinguishes unselected course, no month records and load error

  ```
  AssertionError: expected '"use client";\n\nimport { Disclosure …' to contain 'deliveryId ? "No attendance records" …'
  - Expected
  + Received
  - deliveryId ? "No attendance records" : "Select a course"
  + "use client";
  +
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  ```

## tests/unit/projects-mentor-attention-risk-chat14.test.ts (1 failing)
- chat-14 mentor attention risk and workflow policies > requires the legacy 150% average and three extra assignments for overload

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/tpo-audit-actor-display.test.ts (1 failing)
- TPO-settings-audit-90 actor column > returns the display name without exposing internal UUIDs

  ```
  AssertionError: expected 'System' to be 'System / unknown' // Object.is equality
  Expected: "System / unknown"
  Received: "System"
  ```
