# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-placements-retention-and-joining-followups.test.ts (2 failing)
- PLACEMENTS-RETENTION-01 read-only application retention boundary > uses exactly the 180-day lookback and refuses malformed clocks

  ```
  AssertionError: expected 365 to be 180 // Object.is equality
  - Expected
  + Received
  - 180
  + 365
  ```
- PLACEMENTS-RETENTION-01 read-only application retention boundary > PLACEMENTS-RETENTION-02 keeps every old row college scoped and read-only in the persisted report

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

## tests/unit/chat6-faculty-evidence-r01-r02-27-r05-r07.test.ts (1 failing)
- chat-6 faculty audit evidence verified from current source > FAC-assessments-R07 reveals exact learner-score rows when a quiz distribution bucket expands

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<details key={bucket.label}'
  - Expected
  + Received
  - <details key={bucket.label}
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
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

## tests/unit/chat6-superadmin-people-parity-verified.test.ts (2 failing)
- Super Admin legacy people roster verified gaps > SA-academics-people-104 People Directory exposes legacy All contacts Faculty and Students tabs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="People directory tabs"'
  - Expected
  + Received
  - aria-label="People directory tabs"
  + import Link from "next/link";
  + import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
  + import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Super Admin legacy people roster verified gaps > SA-academics-people-113 recruiter list shows status counts actions and terminate sessions drawer

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'statusSummary.archived'
  - Expected
  + Received
  - statusSummary.archived
  + "use client";
  +
  + import {
  +   useRef,
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
