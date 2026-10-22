# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat4-superadmin-tenant-route-guards.test.ts (1 failing)
- Super Admin tenant API authenticated routes, origin and validation > SA-colleges-sessions-API-01 revoked or replayed session commands require same-origin and explicit confirmation

  ```
  AssertionError: expected { revoked: 3, ok: true, …(2) } to deeply equal { revoked: 3 }
  - Expected
  + Received
  {
  +   "ok": true,
  +   "partial": false,
  +   "refreshSessions": true,
  "revoked": 3,
  ```

## tests/unit/chat5-tpo-second-third-page-journeys.test.ts (1 failing)
- chat-5 second-third TPO page journeys > UX-TPO-DRIVE-STOP-37 provides 44px return actions and explicit blocked-state messages on both previews

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="status"'
  - Expected
  + Received
  - role="status"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```

## tests/unit/chat6-college-placement-verified-pipeline.test.ts (3 failing)
- College Admin placement pipeline verified parity > COL-placements-01 supports transition guards and per-row/bulk Reinstate/Move

  ```
  AssertionError: expected [ 'OFFERED' ] to have a length of +0 but got 1
  - Expected
  + Received
  - 0
  + 1
  ```
- College Admin placement pipeline verified parity > COL-placements-04 schedules and changes college interview outcomes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Schedule and notify'
  - Expected
  + Received
  - Schedule and notify
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import Link from "next/link";
  + import {useToast} from "@/components/ui/toast";
  ```
- College Admin placement pipeline verified parity > COL-placements-05 scopes applicant filters by source academic department program batch and stage

  ```
  AssertionError: expected 'import {CollegeDriveApplicationsSizeC…' to contain 'name="departmentId"'
  - Expected
  + Received
  - name="departmentId"
  + import {CollegeDriveApplicationsSizeControl} from "@/components/placements/college-drive-applications-size-control";
  + import { CollegeDriveApplicationsExport } from "@/components/college/college-drive-applications-export";
  + import Link from "next/link";
  + import { z } from "zod";
  ```

## tests/unit/chat6-final-sprint-rec-home-drives-08.test.ts (1 failing)
- Final sprint recruiter Today partial and fatal errors > REC-home-drives-08 partial failure preserves usable cards with a retry action

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'Some notifications or calendar events…'
  - Expected
  + Received
  - Some notifications or calendar events may be missing.
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import { Badge } from "@/components/ui/badge";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  ```

## tests/unit/chat6-superadmin-course-edit-copy-55.test.ts (1 failing)
- Super Admin courses legacy edit semantics > SA-academics-people-55 uses the legacy Course Name field and confirmation language while keeping immutable department

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain '{COLLEGE_COURSES_COPY.nameLabel}'
  - Expected
  + Received
  - {COLLEGE_COURSES_COPY.nameLabel}
  + "use client";
  +
  + import Link from "next/link";
  + import Image from "next/image";
  ```

## tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts (2 failing)
- Chat-6 tracker issue list parity > SA-placements-projects-106 bulk status changes preserve per-issue version guards and partial failure reporting

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Select this page'
  - Expected
  + Received
  - Select this page
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
- Chat-6 tracker issue list parity > SA-placements-projects-107 safely saves, applies and removes bounded browser-only filter presets

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'item.name.length<=60'
  - Expected
  + Received
  - item.name.length<=60
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Dialog } from "@/components/ui/dialog";
  ```
