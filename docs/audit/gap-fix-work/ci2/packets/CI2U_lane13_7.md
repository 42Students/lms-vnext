# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-recruiter-mail-inbound-service-byte-cap-08.test.ts (1 failing)
- chat-16 signed recruiter email internal service byte guard > HR-MAIL-INBOUND-BYTES-08 denies a valid signed JSON envelope padded past 20KB before DB

  ```
  AssertionError: promise rejected "TypeError: Cannot read properties of unde…" instead of resolving
  ❯ tests/unit/chat16-recruiter-mail-inbound-service-byte-cap-08.test.ts:26:75
  24|   expect(Buffer.byteLength(body)).toBe(20_001);
  25|   const signature=recruiterMailBridgeSignature(secret,body);
  26|   await expect(acceptAuthenticatedRecruiterEmailReply(body,signature,e…
  |                                                                           ^
  27|    .resolves.toEqual({accepted:false,replayed:false});
  28|   expect(getDb).not.toHaveBeenCalled();
  ```

## tests/unit/chat19-college-source-coverage.test.ts (23 failing)
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
  + import { CollegeSetupChecklist } from "@/components/admin/college-setup-checklist";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/assignments avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
  + import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
  + import {getCollegeAssignmentAuthoringCatalog} from "@/modules/courses/college-assignment-authoring-options";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/classes avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/companies avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { FilterBar } from "@/components/ui/filter-bar";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/contacts avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/contacts/[membershipId] avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { z } from "zod";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/faculty/[membershipId] avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import {and,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/groups/[groupId] avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DataTable } from "@/components/ui/data-table";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/hiring-dashboard avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- chat-19 all /college route entry point source coverage > UX-college-source-coverage-01 route /college/lecture-halls avoids banned native interactions, raw tables and low-contrast link utility

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- … 13 more in this file

## tests/unit/chat2-UX-tpo-scroll-motion-01.test.ts (5 failing)
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-01 spreadsheet retains sticky pinned columns, desktop cue and mobile row cards

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<ScrollCue axis="x" label="TPO spread…'
  - Expected
  + Received
  - <ScrollCue axis="x" label="TPO spreadsheet columns"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-03 bell notifications scroll in Drawer without a nested fixed-height list

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'aria-label={"Notifications, "+unread+…'
  - Expected
  + Received
  - aria-label={"Notifications, "+unread+" new"}
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {Drawer} from "@/components/ui/drawer";
  ```
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-05 company drive history uses DataTable and authorized job links

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain '<DataTable rows={visibleDrives}'
  - Expected
  + Received
  - <DataTable rows={visibleDrives}
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-06 academic import preview keeps row-level opt-in and match checks

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<DataTable rows={preview}'
  - Expected
  + Received
  - <DataTable rows={preview}
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- UX-tpo-scroll-motion: invisible scrollbars must never hide available content > UX-tpo-scroll-motion-07 nudge roster has a labelled keyboard-accessible vertical cue

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'viewportClassName="max-h-48 space-y-1"'
  - Expected
  + Received
  - viewportClassName="max-h-48 space-y-1"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat2-final-sprint-recruiter-calendar.test.ts (4 failing)
- Final sprint recruiter calendar verification > REC-calendar-messages-profile-03 includes actual round end and duration evidence rather than guessing a one-hour event

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'event.endsAt'
  - Expected
  + Received
  - event.endsAt
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- Final sprint recruiter calendar verification > REC-calendar-messages-profile-06 identifies the college for every multi-college calendar event

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
- Final sprint recruiter calendar verification > REC-calendar-messages-profile-03 independent final-sprint acceptance regression

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'eventTime(event.endsAt)'
  - Expected
  + Received
  - eventTime(event.endsAt)
  + import { DateInput } from "@/components/ui/date-input";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  ```
- Final sprint recruiter calendar verification > REC-calendar-messages-profile-06 independent final-sprint acceptance regression

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

## tests/unit/chat2-round-uncovered-pure-models.test.ts (1 failing)
- chat-2 round model uncovered behavioural boundaries > TPO-round-query-01 denies tenant injection and malformed pagination filters

  ```
  AssertionError: expected { …(3) } to deeply equal { …(2) }
  - Expected
  + Received
  {
  "jobId": "11111111-1111-4111-8111-111111111111",
  +   "page": 1,
  "roundId": "22222222-2222-4222-8222-222222222222",
  }
  ```

## tests/unit/chat2-tpo-last-third-runtime-settings-pages.test.tsx (6 failing)
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-02 shows empty state without converting empty rows into source-unavailable

  ```
  
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-04 keeps roster PII unrendered and exposes phone labels in the table

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-team-page-03 preserves partial-source warnings instead of displaying invented zero totals

  ```
  Error: [vitest] No "useRouter" export is defined on the "next/navigation" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("next/navigation"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-public-link-page-02 uses COLLEGE scope, legacy wording and safe empty link readiness

  ```
  AssertionError: expected '<div class="min-w-0 space-y-5"><heade…' to contain 'min-h-11'
  Expected: "min-h-11"
  Received: "<div class="min-w-0 space-y-5"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-public-link-page-03 retains a visible retry signal if link storage is unavailable

  ```
  AssertionError: expected '<div class="min-w-0 space-y-5"><heade…' to contain 'Couldn\'t load the public link'
  Expected: "Couldn't load the public link"
  Received: "<div class="min-w-0 space-y-5"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[--lms-page-hea
  ```
- chat-2 TPO last-third runtime settings pages > TPO-settings-pages-04 propagate data faults to route error boundaries instead of rendering raw stack traces

  ```
  AssertionError: promise resolved "{ …(10) }" instead of rejecting
  - Expected
  + Received
  - Error {
  -   "message": "rejected promise",
  + <div
  +   className="min-w-0 space-y-5"
  + >
  ```
