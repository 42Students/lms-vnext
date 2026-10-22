# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-mail-http-boundaries-16.test.ts (4 failing)
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-INBOUND-HTTP-02 bounds raw webhook bytes before any HMAC verification

  ```
  AssertionError: expected { error: 'INVALID_BODY', …(3) } to deeply equal { error: 'INVALID_BODY' }
  - Expected
  + Received
  {
  +   "action": "QUARANTINE_AND_NOTIFY_OPERATIONS",
  "error": "INVALID_BODY",
  +   "outcome": "STORED",
  +   "retryable": false,
  ```
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-INBOUND-HTTP-04 reports successful replay truthfully and returns no-cache headers

  ```
  AssertionError: expected { Object (accepted, replayed, ...) } to deeply equal { accepted: true, replayed: true }
  - Expected
  + Received
  {
  "accepted": true,
  +   "outcome": "DUPLICATE",
  "replayed": true,
  }
  ```
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-WORKER-HTTP-07 schedules only after a valid worker secret and denies false send receipts

  ```
  AssertionError: expected { skipped: true, …(2) } to deeply equal { Object (examined, sent, ...) }
  - Expected
  + Received
  {
  -   "enabled": true,
  -   "examined": 2,
  -   "sent": 0,
  +   "reason": "STARTUP_GRACE",
  ```
- chat-16 authenticated recruiter email inbound/worker HTTP boundaries > REC-WORKER-HTTP-08 avoids provider secret leakage if the authorized worker fails

  ```
  AssertionError: expected 200 to be 503 // Object.is equality
  - Expected
  + Received
  - 503
  + 200
  ```

## tests/unit/chat19-college-cross-audit.test.ts (11 failing)
- chat-19 college UX cross-audit > COL-XA-08 accepts defaults and bounded, user-visible URL filters

  ```
  AssertionError: expected { Object (view, page, ...) } to deeply equal { Object (view, page, ...) }
  - Expected
  + Received
  {
  "page": 1,
  -   "pageSize": 25,
  -   "view": "cards",
  +   "pageSize": 20,
  ```
- chat-19 college UX cross-audit > COL-XA-08 rejects malformed or hostile project list filters: {"pageSize":"20000"}

  ```
  
  ```
- chat-19 college UX cross-audit > COL-XA-08 rejects malformed or hostile project list filters: {"pageSize":"-1"}

  ```
  
  ```
- chat-19 college UX cross-audit > COL-XA-08 rejects malformed or hostile project list filters: {"status":"OTHER_COLLEGE"}

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- chat-19 college UX cross-audit > COL-XA-09 keeps workspaces visible when optional template labels fail

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listProjectAdminSnapshots(context, co…'
  - Expected
  + Received
  - listProjectAdminSnapshots(context, collegeId, query)
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- chat-19 college UX cross-audit > COL-XA-07 exposes roster fields and class-move controls in mobile cards

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'empty={<p className="text-sm text-mut…'
  - Expected
  + Received
  - empty={<p className="text-sm text-muted-foreground">No matching students.</p>}
  + import Link from "next/link";
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { notFound, redirect } from "next/navigation";
  + import { and, eq, ilike, or } from "drizzle-orm";
  ```
- chat-19 college UX cross-audit > COL-XA-11 uses mobile cards with labelled elective allocation checkboxes

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'empty={<p'
  - Expected
  + Received
  - empty={<p
  + "use server";
  + import Link from "next/link";
  + import { redirect, notFound } from "next/navigation";
  + import { and, asc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
  ```
- chat-19 college UX cross-audit > COL-XA-13 keeps each faculty assignment field and both guarded actions in mobile cards

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'key: "period"'
  - Expected
  + Received
  - key: "period"
  + import Link from "next/link";
  + import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
  + import { Alert } from "@/components/ui/alert";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-19 college UX cross-audit > COL-XA-15 keeps elective roster actions, state and join time visible on phones

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'required /> Confirm removal'
  - Expected
  + Received
  - required /> Confirm removal
  + "use server";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
  ```
- chat-19 college UX cross-audit > COL-XA-16 stale or malformed elective and membership identifiers fail safely

  ```
  AssertionError: expected '"use server";\nimport Link from "next…' to contain 'eq(electiveSlots.collegeId, context.m…'
  - Expected
  + Received
  - eq(electiveSlots.collegeId, context.membership.collegeId)
  + "use server";
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { and, count, eq, ilike, isNull, or, sql } from "drizzle-orm";
  ```
- … 1 more in this file

## tests/unit/chat2-UX-tpo-overlay-01.test.ts (4 failing)
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-01 student panel uses Drawer focus isolation and sticky next/previous actions

  ```
  AssertionError: expected '"use client";\nimport {Button} from "…' to contain 'title={"Student panel for "+student.d…'
  - Expected
  + Received
  - title={"Student panel for "+student.displayName}
  + "use client";
  + import {Button} from "@/components/ui/button";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-02 notice composer uses native shared modal behavior

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Dialog open={open} onOpenChange={set…'
  - Expected
  + Received
  - <Dialog open={open} onOpenChange={setOpen} title={title}>
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useState,type ReactNode} from "react";
  + import {Dialog} from "@/components/ui/dialog";
  ```
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay-05 bell opens a named Drawer and exposes retry paths

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Drawer open={open} onOpenChange={cha…'
  - Expected
  + Received
  - <Drawer open={open} onOpenChange={changeOpen}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-overlay: focus-safe mobile and desktop workflows > UX-tpo-overlay primitive contracts isolate focus, lock background and restore opener

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat2-final-sprint-calendar-inbox-a.test.ts (3 failing)
- Final sprint recruiter calendar and inbox parity — group A > REC-calendar-messages-profile-03 shows scheduled start and end in IST when available

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'event.endsAt ? ` to ${eventTime(event…'
  - Expected
  + Received
  - event.endsAt ? ` to ${eventTime(event.endsAt)}`
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- Final sprint recruiter calendar and inbox parity — group A > REC-calendar-messages-profile-06 shows per-event college identity in multi-college calendar

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'College: {event.collegeName}'
  - Expected
  + Received
  - College: {event.collegeName}
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- Final sprint recruiter calendar and inbox parity — group A > REC-calendar-messages-profile-09 keeps unread and conversation count, general-chat summary and search copy

  ```
  AssertionError: expected 'import inboxStyles from "@/components…' to contain 'unread across '
  - Expected
  + Received
  - unread across
  + import inboxStyles from "@/components/hr/recruiter-conversations-legacy.module.css";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Tabs } from "@/components/ui/tabs";
  ```

## tests/unit/chat2-recruiter-profile-and-lead-parity.test.ts (1 failing)
- Recruiter legacy profile and lead company parity > REC-calendar-messages-profile-28 uses exact profile titles and help text

  ```
  AssertionError: expected 'import { DataTable } from "@/componen…' to contain 'Manage your recruiter details.'
  - Expected
  + Received
  - Manage your recruiter details.
  + import { DataTable } from "@/components/ui/data-table";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  + import { z } from "zod";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat2-tpo-last-third-report-failures-joining-runtime.test.tsx (1 failing)
- chat-2 last-third failure and joining outcome report pages > TPO-joining-05 distinguishes pending or unrecorded acceptance from did-not-join events

  ```
  AssertionError: expected '<div data-tpo-presentation-report="tr…' to contain 'sm:grid-cols-2'
  Expected: "sm:grid-cols-2"
  Received: "<div data-tpo-presentation-report="true" class="min-w-0 space-y-4"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header
  ```
