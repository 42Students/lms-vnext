# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts (1 failing)
- chat-7 learner assessment and discussion guard exhaustive source-model coverage > UX-course-tab-route-06 denies unexpected tab descendants and unlisted route slugs

  ```
  AssertionError: expected 'roadmap' to be null
  - Expected:
  null
  + Received:
  "roadmap"
  ```

## tests/unit/chat7-round2-mentor-03.test.ts (1 failing)
- chat-7 mentor overview evidence > MEN-projects-meetings-24 team card with explainer and count

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'See who is assigned, what role they p…'
  - Expected
  + Received
  - See who is assigned, what role they play
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```

## tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts (6 failing)
- Super Admin assessment export service scoped pagination > SA-academics-people-64/65 rejects duplicate, foreign-tenant, invalid status and assignment-only result filters before reading

  ```
  AssertionError: expected 403 to be 400 // Object.is equality
  - Expected
  + Received
  - 400
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 passes the acting session and selected assignment filters to the authorized reader

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-65 never drops quiz results filters as later pages are read

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:49:21
  47|  it("SA-academics-people-65 never drops quiz results filters as later …
  48|   state.reader.mockImplementation(async (_context,_kind,query)=>{
  49|    const page=query.page as number;
  |                     ^
  50|    return {items:[row(page)],total:2,totalPages:2};
  51|   });
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records

  ```
  AssertionError: expected 403 to be 200 // Object.is equality
  - Expected
  + Received
  - 200
  + 403
  ```
- Super Admin assessment export service scoped pagination > SA-academics-people-64 hard caps CSV at 500 rows and explicitly marks omitted records

  ```
  TypeError: Cannot read properties of undefined (reading 'page')
  ❯ tests/unit/chat7-superadmin-learning-export-service-behavior.test.ts:66:51
  64|  it("SA-academics-people-64 hard caps CSV at 500 rows and explicitly m…
  65|   state.reader.mockImplementation(async (_context,_kind,query)=>({
  66|    items:Array.from({length:25},(_,i)=>row((query.page-1)*25+i)),
  |                                                   ^
  67|    total:501,totalPages:21,
  68|   }));
  ```

## tests/unit/chat9-college-projects-template-catalogue.test.ts (2 failing)
- chat-9 College Projects template catalogue > COL-projects-16 counts all template sections, filters on the server and exports only visible rows

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="search"'
  - Expected
  + Received
  - role="search"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- chat-9 College Projects template catalogue > COL-projects-08 renders template tags in both list and cards without introducing a new status

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'item.templateTitle ? "Template: " + i…'
  - Expected
  + Received
  - item.templateTitle ? "Template: " + item.templateTitle
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "./project-workspace-readiness.module.css";
  + import Link from "next/link";
  + import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
  ```

## tests/unit/chat9-round6-project-risk-audit.test.ts (2 failing)
- College Projects risk and activity acceptance > COL-projects-18 enables admin resource change/search without overriding mentor Activity feed

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'All resource changes'
  - Expected
  + Received
  - All resource changes
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```
- College Projects risk and activity acceptance > COL-projects-23 ensures ten-tab workspace navigation is keyboard-scrollable at narrow widths

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'aria-label="Project workspace section…'
  - Expected
  + Received
  - aria-label="Project workspace sections"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
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
