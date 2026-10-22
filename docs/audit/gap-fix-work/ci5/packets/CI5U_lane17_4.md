# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-final-named-gap-verification.test.ts (1 failing)
- chat-9 final named gap source acceptance > COL-academic-setup-21 is NOT-A-GAP: departments are sorted, searchable and pageable with a result count

  ```
  AssertionError: expected [ 'Zoology', 'Biology', 'Physics' ] to deeply equal [ 'Biology', 'Physics', 'Zoology' ]
  - Expected
  + Received
  [
  +   "Zoology",
  "Biology",
  "Physics",
  -   "Zoology",
  ```

## tests/unit/chat9-super-admin-exact-page-copy.test.ts (2 failing)
- Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > dashboard/page.tsx uses the exact title case

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Overview"'
  - Expected
  + Received
  - title="Overview"
  + import Link from "next/link";
  + import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
  + import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
  + import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
  ```
- Super Admin exact dev-legacy per-page title strings (legacy-copy-B) > admin/audit/page.tsx uses the exact title case

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Activity Log"'
  - Expected
  + Received
  - title="Activity Log"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import ActivityPage from "@/app/(authenticated)/activity/page";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```

## tests/unit/college-academic-setup-round5-gap-verification.test.ts (4 failing)
- chat-11 college academic page parity round five > COL-academic-setup-23 derives optional program code and preserves 1–10 integer year duration and editable department

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'deriveSuperAdminProgramCode(name)'
  - Expected
  + Received
  - deriveSuperAdminProgramCode(name)
  + "use client";
  +
  + import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
  + import { usePathname, useRouter } from "next/navigation";
  ```
- chat-11 college academic page parity round five > COL-academic-setup-29 disables dependent batch removal with explicit student and class counts

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Move or remove its ${row.activeSectio…'
  - Expected
  + Received
  - Move or remove its ${row.activeSections} classes and ${row.activeEnrolledLearners} students before deleting.
  + "use client";
  + import { Button } from "@/components/ui/button";
  +
  + import { useEffect, useState, useTransition, type FormEvent } from "react";
  ```
- chat-11 college academic page parity round five > COL-academic-setup-32 launches a selected class schedule from its list row

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'defaultSectionId={classId}'
  - Expected
  + Received
  - defaultSectionId={classId}
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeRecurringRouteModal } from "./route-modal";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-11 college academic page parity round five > COL-academic-setup-39 uses Export CSV labels and keeps intentional capped server export

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain 'Export CSV'
  - Expected
  + Received
  - Export CSV
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/college-mentor-round7-gap-verification.test.ts (1 failing)
- chat-11 college and mentor interaction contracts > COL-academic-setup-19 retains owner-approved archive and dependency blocking

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useRef,\…' to contain 'Retry delete'
  - Expected
  + Received
  - Retry delete
  + "use client";
  +
  + import {
  +   useRef,
  ```

## tests/unit/faculty-profile-error-model.test.ts (1 failing)
- Faculty profile optimistic conflict recovery > offers explicit reload only for a verified stale version

  ```
  AssertionError: expected 'Profile was updated elsewhere. Please…' to contain 'Reload'
  Expected: "Reload"
  Received: "Profile was updated elsewhere. Please refresh and try again."
  ```

## tests/unit/hr-recruiter-exhaustive-chat15-01.test.ts (1 failing)
- HR recruiter exhaustive policy boundaries chat-15 > HR-autoapproval cannot bypass an unverified recruiter grant

  ```
  AssertionError: expected { autoApprove: true, …(1) } to deeply equal { autoApprove: true, …(1) }
  - Expected
  + Received
  {
  "autoApprove": true,
  -   "reason": "TRUSTED_DOMAIN",
  +   "reason": "TRUSTED_COMPANY",
  }
  ```

## tests/unit/learner-course-tab-route-model.test.ts (1 failing)
- learner course tab routes > rejects nested, unknown, and empty tab paths

  ```
  AssertionError: expected 'home' to be null
  - Expected:
  null
  + Received:
  "home"
  ```

## tests/unit/learner-placements-chat7-hero-priority.test.ts (1 failing)
- learner placements next-action hero > LEARNER-placements-05 reads accepted offers from scoped server source

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'acceptedOffer={offerRows?offerRows.so…'
  - Expected
  + Received
  - acceptedOffer={offerRows?offerRows.some(row=>row.offer.status==="ACCEPTED"):null}
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```
