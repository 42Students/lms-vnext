# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-navigation-contract.test.ts (2 failing)
- legacy College Admin full sidebar + group href contract > has the correct placements tabs and only one College Projects strip

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```
- legacy College Admin full sidebar + group href contract > links all six formerly orphaned pages from an authorized College page

  ```
  AssertionError: college/attendance/page.tsx: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat9-project-team-mentor-modal.test.ts (1 failing)
- College Admin workspace Team actions > COL-projects-15 offers a scoped mentor search and confirmed reassignment modal without changing member roles directly

  ```
  AssertionError: expected '"use client";\n\nimport {useRef,useSt…' to contain 'Confirm reassignment'
  - Expected
  + Received
  - Confirm reassignment
  + "use client";
  +
  + import {useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
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

## tests/unit/college-course-crud-guard.test.ts (1 failing)
- College course mutation strict boundaries > refuses unknown edit fields and empty changes

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/college-wording-copy.test.ts (2 failing)
- COL-academic-setup-18 departments > uses the exact legacy strings

  ```
  AssertionError: expected { …(11) } to match object { …(8) }
  (3 matching properties omitted from actual)
  - Expected
  + Received
  @@ -4,7 +4,7 @@
  "editTitle": "Edit Department",
  "existingTitle": "Existing Departments",
  "nameLabel": "Department Name",
  ```
- COL-academic-setup-11 semester course mapping > uses the exact legacy confirm and success wording

  ```
  AssertionError: expected '2 courses added to semester' to be 'Added 2 course(s) to this semester.' // Object.is equality
  Expected: "Added 2 course(s) to this semester."
  Received: "2 courses added to semester"
  ```

## tests/unit/faculty-report-students.test.ts (1 failing)
- Faculty PDF report name privacy > uses only a public display name and a neutral missing-name label

  ```
  AssertionError: expected 'Unknown student' to be 'Learner (name unavailable)' // Object.is equality
  Expected: "Learner (name unavailable)"
  Received: "Unknown student"
  ```

## tests/unit/learner-application-url-model.test.ts (1 failing)
- own application URL navigation > restores committed filters and resets pagination

  ```
  AssertionError: expected { q: 'developer', view: 'all', …(4) } to match object { q: 'developer', …(4) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "applicationId": "81818181-8181-4818-8818-818181818181",
  "page": 1,
  "q": "developer",
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
