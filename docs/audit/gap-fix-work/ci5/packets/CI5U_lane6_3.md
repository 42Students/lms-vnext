# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-independent-findings-filters.test.ts (1 failing)
- SA-tenants-modules-48 persisted board filter states > SA-tenants-modules-48 calculates counts from SQL-scoped full matches, not one displayed page

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'const facetsWhere=and(searchPredicate…'
  - Expected
  + Received
  - const facetsWhere=and(searchPredicate,areaPredicate
  + import "server-only";
  + import {and,asc,count,desc,eq,ilike,inArray,or,sql,type SQL} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {db10AuditFindings,db10AuditFindingEvents,db10AuditFindingSyncs,db10AuditFindingFiles} from "@/db/schema/db10-audit-findings.draft";
  ```

## tests/unit/chat5-final-faculty-courses-a.test.ts (4 failing)
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-02 keeps an accessible non-upload initial fallback while real thumbnail persistence remains unavailable

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'import Image from "next/image"'
  - Expected
  + Received
  - import Image from "next/image"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-07 debounces course search and immediately submits assigned-period, section and role filters via scoped GET

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'placeholder="Course, code, Section or…'
  - Expected
  + Received
  - placeholder="Course, code, Section or academic period"
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-10 collapses the lesson blueprint into accessible native accordions with the first lesson initially expanded

  ```
  AssertionError: expected 'import { StatTile } from "@/component…' to contain 'open={selectedLessonId?true:lessonInd…'
  - Expected
  + Received
  - open={selectedLessonId?true:lessonIndex===0?true:undefined}
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Badge } from "@/components/ui/badge";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- chat-5 final sprint faculty course list and core lesson contracts > FAC-courses-28 renders contacts and missing-roll copy, sorted roster, and an authorized avatar preview fallback

  ```
  AssertionError: expected '"use client";\n\nimport { useMemo, us…' to contain 'aria-label={"Preview avatar for "+nam…'
  - Expected
  + Received
  - aria-label={"Preview avatar for "+nameOf(learner)}
  + "use client";
  +
  + import { useMemo, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat6-auth-devices-http-role-journey.test.ts (4 failing)
- AUTH-sessions-10 device list and revocation HTTP hostile journeys > AUTH-sessions-10 GET binds to persisted signed-in identity, flags only current device, and blocks caches

  ```
  AssertionError: expected { devices: [ { …(9) }, { …(9) } ] } to deeply equal { devices: [ { …(7) }, { …(7) } ] }
  - Expected
  + Received
  @@ -4,19 +4,23 @@
  "createdAt": "2099-01-01T12:00:00.000Z",
  "current": true,
  "deviceName": "Current laptop",
  "expiresAt": "2099-01-01T12:00:00.000Z",
  ```
- AUTH-sessions-10 device list and revocation HTTP hostile journeys > AUTH-sessions-10 bulk revoke forwards only caller identity/current device and reports zero-row retries truthfully

  ```
  AssertionError: expected { ok: true, revoked: 2, …(5) } to deeply equal { ok: true, revoked: 2 }
  - Expected
  + Received
  {
  +   "currentExcluded": true,
  +   "currentSessionRevoked": false,
  +   "message": "Other sessions revoked",
  "ok": true,
  ```
- AUTH-sessions-10 device list and revocation HTTP hostile journeys > AUTH-sessions-10 guessed foreign device does not become a success even when its UUID is syntactically valid

  ```
  AssertionError: expected { error: 'SESSION_NOT_FOUND', …(1) } to deeply equal { error: 'SESSION_NOT_FOUND' }
  - Expected
  + Received
  {
  "error": "SESSION_NOT_FOUND",
  +   "message": "Session not found",
  }
  ```
- AUTH-sessions-10 device list and revocation HTTP hostile journeys > AUTH-sessions-10 an owned device is revoked and a simultaneous database outage cannot claim success

  ```
  AssertionError: expected { Object (ok, message) } to deeply equal { ok: true }
  - Expected
  + Received
  {
  +   "message": "Session revoked",
  "ok": true,
  }
  ```

## tests/unit/chat6-friendly-fetch-adoption.test.ts (2 failing)
- Chat 6 friendly fetch adoption > GR-32 chat-6 edit forms keep draft state and show shared conflict message

  ```
  AssertionError: expected '/**\n * Shared, client-safe message c…' to contain 'This changed while you were working.'
  - Expected
  + Received
  - This changed while you were working.
  + /**
  +  * Shared, client-safe message catalog. Usage:
  +  *   friendlyApiError({ status: response.status, code: body.error, network: false })
  +  *   // Display only this text, never the provider or API code.
  ```
- Chat 6 friendly fetch adoption > GR-90 chat-6 inline fetch failures have alert semantics

  ```
  AssertionError: expected '"use client";\nimport { Textarea } fr…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```

## tests/unit/chat6-superadmin-middle-lessons-role-25.test.tsx (1 failing)
- SA-middle-lessons-25 scoped authoring role journey > authorized selected-college listing renders a meaningful empty state

  ```
  AssertionError: expected '<div class="min-w-0 space-y-4 md:spac…' to contain 'No lessons found'
  Expected: "No lessons found"
  Received: "<div class="min-w-0 space-y-4 md:space-y-6"><header data-slot="page-header" class="mb-2 flex w-full min-w-0 flex-col items-stretch gap-2 border-b border-[var(--lms-canvas-border)] pb-4 md:mb-4 md:flex-row md:items-start md:justify-between md:gap-6 [--lms-page-header-title-size:20px] md:[-
  ```

## tests/unit/chat7-final-sprint-superadmin-course-visibility.test.ts (1 failing)
- SA-academics-people-52/53 selected-course retry integrity > SA-academics-people-52 sends only failed courses on retry instead of reapplying successful changes

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain 'lessonId:row.lessonId,reason:safeCour…'
  - Expected
  + Received
  - lessonId:row.lessonId,reason:safeCourseVisibilityFailure(error)
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat7-legacy-faculty-uploaded-file-copy.test.ts (1 failing)
- Faculty submitted attachment viewer exact legacy copy > provides exact Uploaded File and Open file copy

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Unable to load this submitted file'
  - Expected
  + Received
  - Unable to load this submitted file
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { PageLoading } from "@/components/ui/page-loading";
  ```

## tests/unit/chat7-superadmin-course-authoring-break.test.ts (1 failing)
- SA-academics-people-58 GR-COURSES-TENANT-02 authoring, stale tabs and content sanitization > switching acting college invalidates previous lesson and safely selects only current authorized lessons

  ```
  AssertionError: expected '"use client";\nimport { useState } fr…' to contain 'resolveSuperAdminAuthoringLesson(less…'
  - Expected
  + Received
  - resolveSuperAdminAuthoringLesson(lessons,lessonId)
  + "use client";
  + import { useState } from "react";
  + import { useRouter } from "next/navigation";
  + import { Button } from "@/components/ui/button";
  ```
