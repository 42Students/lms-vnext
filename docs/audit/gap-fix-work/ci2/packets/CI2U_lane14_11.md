# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/college-assessment-aggregate-model.test.ts (1 failing)
- College Admin assignment and quiz aggregate model > labels only actual shared or section-specific authoring scope

  ```
  AssertionError: expected 'All eligible sections' to be 'Shared offering' // Object.is equality
  Expected: "Shared offering"
  Received: "All eligible sections"
  ```

## tests/unit/college-mentor-round7-gap-verification.test.ts (1 failing)
- chat-11 college and mentor interaction contracts > COL-academic-setup-19 retains owner-approved archive and dependency blocking

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'Move or remove its programs, courses,…'
  - Expected
  + Received
  - Move or remove its programs, courses, faculty before deleting.
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/faculty-courses-chat7-r7.test.ts (1 failing)
- chat-7 faculty courses round 7 > FAC-courses-R06 confirms the audited source behavior

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discussion refresh failed.'
  - Expected
  + Received
  - Discussion refresh failed.
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  +
  ```

## tests/unit/graceful-core-edge-regressions.test.ts (1 failing)
- chat-14 graceful shared-layer edge regression audit > GR-62 flushes the current draft during pagehide and before leaving

  ```
  AssertionError: expected '"use client";\n\n/**\n * GR-60: const…' to contain 'if (cleared.current || !dirtyRef.curr…'
  - Expected
  + Received
  - if (cleared.current || !dirtyRef.current) return;
  + "use client";
  +
  + /**
  +  * GR-60: const { draft, setDraft, restored, clearDraft, dirty } =
  ```

## tests/unit/learner-assessment-due-buckets-source.test.ts (1 failing)
- Learner assessment due bucket page wiring > keeps canonical Assessments page authorized and mobile-friendly

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'sm:grid-cols-3'
  - Expected
  + Received
  - sm:grid-cols-3
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  +
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
