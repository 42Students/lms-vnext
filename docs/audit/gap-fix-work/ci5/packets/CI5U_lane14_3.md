# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-super-admin-tenant-route-audit.test.ts (3 failing)
- chat-4 Super Admin tenant audit: every college admin route scopes reads and actions > subdomain/page.tsx checks caller scope before presenting college-specific operations

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { Suspense } from "react";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-4 Super Admin tenant audit: every college admin route scopes reads and actions > verification queue refuses duplicated filters instead of interpreting a forged first value

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import Link from "next/link";
  + import {eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {profileVerificationSettings} from "@/db/schema/profile-verification";
  ```
- chat-4 Super Admin tenant audit: every college admin route scopes reads and actions > admin session list and revocation preserve capped results and explicit target

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'listCollegeAdminHistory(await getCurr…'
  - Expected
  + Received
  - listCollegeAdminHistory(await getCurrentRequestContext(),collegeId,userId,page)
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  ```

## tests/unit/chat5-tpo-closure-ux-boundary.test.ts (2 failing)
- chat-5 TPO drive closure and correction journeys > PLACEMENTS-CANCEL-WAIT-34 requires settling pending waitlist reservations before cancellation

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'if(pendingPromotions>0)'
  - Expected
  + Received
  - if(pendingPromotions>0)
  + import "server-only";
  + import { and, count, eq, inArray, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
  ```
- chat-5 TPO drive closure and correction journeys > UX-PLACEMENTS-JOINING-23 retains correction evidence and confirmation while preventing duplicate updates

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-cross-page-verification-round4.test.ts (6 failing)
- chat-6 cross-page gap source verification > SA-academics-people-68 filters course progress by course and batch with legacy completion guidance

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'SuperAdminLearningFilterFields'
  - Expected
  + Received
  - SuperAdminLearningFilterFields
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import {Input} from "@/components/ui/input";
  + import Link from "next/link";
  ```
- chat-6 cross-page gap source verification > COL-placements-20 provides drive-scoped interview scheduling, statuses and calendar download

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'getCollegeRoundSlotAppointments(conte…'
  - Expected
  + Received
  - getCollegeRoundSlotAppointments(context,jobId)
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ErrorState } from "@/components/ui/error-state";
  + import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
  ```
- chat-6 cross-page gap source verification > SA-academics-people-72 shows resource editing and archive confirmation without raw API errors

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'transition("ARCHIVE")'
  - Expected
  + Received
  - transition("ARCHIVE")
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Dialog } from "@/components/ui/dialog";
  + import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";
  ```
- chat-6 cross-page gap source verification > COL-placements-26 exposes a persisted Hired count and Mark Hired action without inferring joining

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'funnel.totals.HIRED'
  - Expected
  + Received
  - funnel.totals.HIRED
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- chat-6 cross-page gap source verification > SA-academics-people-72 guards unsaved resource changes and uses legacy resource confirmations

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discard resource changes?'
  - Expected
  + Received
  - Discard resource changes?
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { Dialog } from "@/components/ui/dialog";
  + import { LessonResourceMaterialsControl } from "@/components/courses/lesson-resource-materials-control";
  ```
- chat-6 cross-page gap source verification > SA-academics-people-79 renders selected-college faculty and student overview metrics from scoped directory counts

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'peopleFilters?await Promise.all(['
  - Expected
  + Received
  - peopleFilters?await Promise.all([
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/chat6-student-csv-and-legacy-copy-round12.test.ts (1 failing)
- Super Admin student CSV lifecycle > SA-academics-people-95 scopes import writes and history to the selected active college, with same-origin checked API

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'No bulk imports on file for this coll…'
  - Expected
  + Received
  - No bulk imports on file for this college.
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts (1 failing)
- Chat-6 tracker issue list parity > SA-placements-projects-107 safely saves, applies and removes bounded browser-only filter presets

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'item.filters.length<=500'
  - Expected
  + Received
  - item.filters.length<=500
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Dialog } from "@/components/ui/dialog";
  ```

## tests/unit/chat7-learner-course-file-embargo.test.ts (1 failing)
- LEARNER-COURSE-FILE-EMBARGO-01 private course file read boundary > returns a private object key only after scoped learner authorization

  ```
  AssertionError: expected null to be 'courses/tenant/lesson/resource.pdf' // Object.is equality
  - Expected:
  "courses/tenant/lesson/resource.pdf"
  + Received:
  null
  ```

## tests/unit/chat7-quiz-draft-embargo-security.test.ts (1 failing)
- IIT Dharwad learner quiz draft, release and stale-tab safety > LEARNER-QUIZ-EMBARGO-01 requires closure, explicit release and elapsed due time before showing answer keys

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat7-superadmin-progress-roster-security.test.ts (2 failing)
- SA-academics-people-67 selected-college learner progress hardening > SA-academics-people-67 fetches a sentinel row before marking the 500-row export/page as truncated

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to match /limit\s+501\s*`\)/
  - Expected:
  /limit\s+501\s*`\)/
  + Received:
  "import \"server-only\";
  import {and,eq,sql} from \"drizzle-orm\";
  import {colleges,courses,courseOfferings,courseSectionDeliveries,departments,sections} from \"@/db/schema\";
  import {assertPersistedPlatformPermission} from \"@/modules/permissions/persisted-actor\";
  ```
- SA-academics-people-67 selected-college learner progress hardening > SA-academics-people-67 restricts each learner's item denominator to active delivery audience

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'row.videos+"/"+row.totalVideos'
  - Expected
  + Received
  - row.videos+"/"+row.totalVideos
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {and,asc,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
