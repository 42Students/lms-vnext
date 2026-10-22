# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-tpo-home-secondary-revalidation.test.ts (1 failing)
- chat-4 TPO home revalidation > TPO-home-32 supplies company-scoped recruiter lead and drive actions plus follow-up

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '<TpoTopbarNewMenu'
  - Expected
  + Received
  - <TpoTopbarNewMenu
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { canOpenTpoWorkspace, hasTpoTooling } from "@/modules/placements/tpo-workspace-access-model";
  + import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
  ```

## tests/unit/chat5-ux-tpo-middle-third.test.ts (16 failing)
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-applicants-applicationid-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-applications-export-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-change-requests-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasMembershipRole} from "@/modules/identity/context";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-drive-day-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-offers-offerid-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-share-audit-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-jobs-jobid-shortlist-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-placements-lifecycle-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-profile-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-5 UX /tpo middle-third route coverage (43–84) > UX-tpo-recruiters-leadid-01 keeps the original route while applying safe responsive controls and recovery

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to match /<h1[^>]*>\{lead\.name\}<\/h1>/h1>
  - Expected:
  /<h1[^>]*>\{lead\.name\}<\/h1>/
  + Received:
  "\"use client\";
  import { PageHeader } from \"@/components/ui/page-header\";
  import { GracefulPageLoading } from \"@/components/ui/graceful-page-loading\";
  import { Banner } from \"@/components/ui/banner\";
  ```
- … 6 more in this file

## tests/unit/chat6-college-placements-round2-verified.test.ts (3 failing)
- College placement verified operational parity > COL-placements-11 retention report and college student placement lookup are accessible

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain 'collegeApplicationRetentionCutoff(new…'
  - Expected
  + Received
  - collegeApplicationRetentionCutoff(new Date())
  + import "server-only";
  + import {and,count,desc,eq,inArray,lt,notExists,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships,placementApplications,placementApplicationScreenings,
  ```
- College placement verified operational parity > COL-placements-13 drive settings support draft edit reopen and impact-preview archive

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' to contain 'View delete impact'
  - Expected
  + Received
  - View delete impact
  + "use client";
  + import {useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {apiFetch} from "@/lib/api-fetch";
  ```
- College placement verified operational parity > COL-placements-17 analytics provide department program batch date funnel company and export

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'Export CSV'
  - Expected
  + Received
  - Export CSV
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Input } from "@/components/ui/input";
  + import { StatTile } from "@/components/ui/stat-tile";
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-r05.test.ts (1 failing)
- Final sprint recruiter applicant review accessibility > REC-home-drives-R05 traps focus in the native Drawer and closes with Escape before restoring the opener

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain '<dialog ref={ref} data-slot="drawer"'
  - Expected
  + Received
  - <dialog ref={ref} data-slot="drawer"
  + "use client";
  +
  + import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-superadmin-faculty-assignment-copy-103.test.ts (1 failing)
- Super Admin faculty assignment copy and audited removal > SA-academics-people-103 shows the faculty assignment legacy heading, creation and current assignments labels

  ```
  AssertionError: expected 'import {and,eq,isNull,sql} from "driz…' to contain 'Current teaching assignments'
  - Expected
  + Received
  - Current teaching assignments
  + import {and,eq,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {courseTeachingAssignments,courseSectionDeliveries,courseOfferings,courses,departments} from "@/db/schema";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/chat6-tracker-log-scope-policy.test.ts (1 failing)
- 42 Tracker secure log access policy > SA-placements-projects-118 NOT-A-GAP manager password bypass is disallowed by OD-27; log access remains Super Admin scoped

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'if (!isSuperAdmin(context)) redirect'
  - Expected
  + Received
  - if (!isSuperAdmin(context)) redirect
  + import Link from "next/link";
  + import type { Metadata } from "next";
  + import { Tabs } from "@/components/ui/tabs";
  +
  ```
