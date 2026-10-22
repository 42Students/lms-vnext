# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-college-project-bookmark-redirects.test.ts (1 failing)
- legacy College Admin workspace deep-link continuity > redirects stale Workspaces list bookmarks to the canonical list

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/college/projects")'
  - Expected
  + Received
  - redirect("/college/projects")
  + import { redirect } from "next/navigation";
  +
  + /** Preserve old Workspaces bookmarks and the selected project filter/tab context. */
  + export default async function LegacyCollegeWorkspacesRedirect({searchParams}:{
  ```

## tests/unit/chat9-round6-calendar-settings.test.ts (2 failing)
- chat-9 round 6 calendar and settings > TPO-calendar-reports-25 activates Move on a follow-up with Enter instead of navigating to a recruiter page

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'aria-label="Move recruiter follow-up"'
  - Expected
  + Received
  - aria-label="Move recruiter follow-up"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- chat-9 round 6 calendar and settings > TPO-settings-audit-03 uses the original Settings section names in the grouped navigation

  ```
  AssertionError: expected [ Array(5) ] to include 'Placement Rules'
  ❯ tests/unit/chat9-round6-calendar-settings.test.ts:28:20
  26|    // named Recruiters. Recruiter access remains the page heading only.
  27|    for(const text of ["Placement Rules","Recruiters","What Companies S…
  28|     expect(labels).toContain(text);
  |                    ^
  29|  });
  30|  it("TPO-settings-audit-13 shows the live offer-rules example and exac…
  ```

## tests/unit/chat9-tpo-calendar-validation-export.test.ts (1 failing)
- TPO calendar scheduling and accreditation export > TPO-calendar-reports-R03 exports student records without a WARNING pseudo-row

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```

## tests/unit/college-courses-content-gap-closure.test.ts (6 failing)
- College Courses & Content gap closure > COL-courses-content-03 visibility is not faked by an archived record label

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'courseVisibleToStudentsLabel(course.s…'
  - Expected
  + Received
  - courseVisibleToStudentsLabel(course.status)
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- College Courses & Content gap closure > COL-courses-content-08 offering detail displays Home/Syllabus and scoped teacher identities

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'aria-label="Course detail tabs"'
  - Expected
  + Received
  - aria-label="Course detail tabs"
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import {Alert} from "@/components/ui/alert";
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  ```
- College Courses & Content gap closure > COL-courses-content-09 section content selector never discloses student media links

  ```
  AssertionError: expected '"use client";\nimport {useRef} from "…' to contain 'does not reveal private video, file o…'
  - Expected
  + Received
  - does not reveal private video, file or meeting links
  + "use client";
  + import {useRef} from "react";
  + import type {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";
  + import { Select } from "@/components/ui/select";
  ```
- College Courses & Content gap closure > COL-courses-content-10 absent offering is a friendly page, load failure is distinct

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- College Courses & Content gap closure > COL-courses-content-11 Faculty Assignment form selects multiple courses by program, batch, class, semester and year

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Courses to Assign'
  - Expected
  + Received
  - Courses to Assign
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
- College Courses & Content gap closure > COL-courses-content-15 raw machine codes are not rendered in Course mutation errors

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'apiFetch<void>'
  - Expected
  + Received
  - apiFetch<void>
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/company-share-audit-columns-safety.test.ts (1 failing)
- public share service selects only preview-approved candidate identity fields

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'projectCompanyShareRows(records,grant…'
  - Expected
  + Received
  - projectCompanyShareRows(records,grant.selectedColumns)
  + import "server-only";
  + import {and,asc,count,eq,gt,ilike,inArray,isNull,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/faculty-schedule-editor-model.test.ts (2 failing)
- Faculty attendance schedule editor > round trips a stored instant into IST independently of the device

  ```
  Error: Cannot schedule a class in the past
  ❯ facultyScheduleInstants src/modules/attendance/faculty-schedule-editor-model.ts:27:11
  25|   // separate correction authority, never by relaxing create validatio…
  26|   if(!original&&new Date(startsAt).getTime()<Date.now())
  27|     throw new Error("Cannot schedule a class in the past");
  |           ^
  28|   if(new Date(endsAt).getTime()-new Date(startsAt).getTime()>12*60*60*…
  29|     throw new Error("A single class session cannot exceed 12 hours");
  ```
- Faculty attendance schedule editor > rejects missing, invalid and reversed session windows

  ```
  AssertionError: expected 'Cannot schedule a class in the past' to be null
  - Expected:
  null
  + Received:
  "Cannot schedule a class in the past"
  ```

## tests/unit/learner-application-url-recovery.test.ts (1 failing)
- recovers valid application filters without admitting duplicated or forged selectors

  ```
  AssertionError: expected 'all' to be 'completed' // Object.is equality
  Expected: "completed"
  Received: "all"
  ```

## tests/unit/learner-notice-sender-provenance.test.ts (1 failing)
- distinguishes persisted publisher and audience without inventing a TPO source

  ```
  AssertionError: expected { id: 'a', …(12) } to match object { senderLabel: 'Placement cell', …(1) }
  (11 matching properties omitted from actual)
  - Expected
  + Received
  {
  -   "audienceLabel": "College",
  +   "audienceLabel": null,
  "senderLabel": "Placement cell",
  ```
