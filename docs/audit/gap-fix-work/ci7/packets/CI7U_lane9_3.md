# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat6-faculty-assessments-gap-closure.test.ts (4 failing)
- chat-6 Faculty assessments verified gap closure > FAC-assessments-06 single-click grade save and publication

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Grade saved and published to the lear…'
  - Expected
  + Received
  - Grade saved and published to the learner.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-23 grade pending and graded points wording

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Grade pending'
  - Expected
  + Received
  - Grade pending
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-25 NOT-A-GAP legacy overview fields now shown

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Course: {item.courseName}'
  - Expected
  + Received
  - Course: {item.courseName}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-26 NOT-A-GAP zero-submission draft review supported

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No submissions yet. Publish this assi…'
  - Expected
  + Received
  - No submissions yet. Publish this assignment
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/chat7-courses-weak-export-boundaries.test.ts (1 failing)
- chat-7 weak export boundaries: calendar exactness, rollout flags, scoped CSV and formula safety > COURSES-WEAK-EXPORT-04 keeps export URL inside college assessment endpoint without untrusted page/extra keys

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat9-calendar-partial-recovery.test.ts (1 failing)
- TPO calendar partial-data recovery > TPO-calendar-reports-22 keeps a successful primary calendar visible when auxiliary counts fail

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'needsWindow?overdue.length:"Unavailab…'
  - Expected
  + Received
  - needsWindow?overdue.length:"Unavailable"
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```

## tests/unit/chat9-tpo-calendar-draft-and-mobile.test.ts (3 failing)
- TPO calendar graceful interactions > TPO-calendar-reports-21 guards in-progress follow-ups against cancel Escape reload and internal route navigation

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Discard this unfinished follow-up?'
  - Expected
  + Received
  - Discard this unfinished follow-up?
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```
- TPO calendar graceful interactions > TPO-calendar-reports-25 returns keyboard focus to the activated hour after Escape, cancel or successful create

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'onKeyDown={event=>{if(event.key==="Es…'
  - Expected
  + Received
  - onKeyDown={event=>{if(event.key==="Escape")
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- TPO calendar graceful interactions > TPO-calendar-reports-14 defaults desktop to Week and mobile to Agenda without displaying the wide grid on phones

  ```
  AssertionError: expected 'import {TpoWeekHourCalendar} from "@/…' to contain 'hidden overflow-x-auto'
  - Expected
  + Received
  - hidden overflow-x-auto
  + import {TpoWeekHourCalendar} from "@/components/placements/tpo-week-hour-calendar";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  + import Link from "next/link";
  +
  ```
