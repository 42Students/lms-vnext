# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-overlays-01.test.ts (7 failing)
- UX-college-overlays-01 college dialog behavior > college-faculty-reassign-action delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-faculty-schedule-reassign delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-offering-metadata-action delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-person-audit-modal delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-person-edit-action delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-person-profile-overview-modal delegates accessible modal focus/Escape/backdrop to shared Dialog

  ```
  
  ```
- UX-college-overlays-01 college dialog behavior > college-student-import-history delegates accessible modal focus/Escape/backdrop to shared Dialog

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

## tests/unit/UX-college-role-directory-mobile-chat17.test.ts (1 failing)
- UX-UNOWNED-DENSE-GRID-10 college role directory mobile/desktop parity > keeps row-level private actions and membership status available without desktop table on phones

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'className="space-y-3 p-3 md:hidden"'
  - Expected
  + Received
  - className="space-y-3 p-3 md:hidden"
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-coverage-closure-leftovers-chat17.test.ts (2 failing)
- UX-coverage-closure-leftovers-chat17 — legacy boundaries and private data > UX-/mentor/courses-coverage-02 preserves its permission, routing and recovery contract

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/mentor")'
  - Expected
  + Received
  - redirect("/mentor")
  + import {redirect} from "next/navigation";
  +
  + /** MEN-projects-meetings-74: legacy mentor bookmark compatibility. */
  + export default function MentorLegacyRedirect(){
  ```
- UX-coverage-closure-leftovers-chat17 — legacy boundaries and private data > UX-/tracker/mine/[publicId]-coverage-02 preserves its permission, routing and recovery contract

  ```
  AssertionError: expected 'import {notFound,redirect} from "next…' not to match /target\s*=\s*["']_blank["']/
  - Expected:
  /target\s*=\s*["']_blank["']/
  + Received:
  "import {notFound,redirect} from \"next/navigation\";
  import {getCurrentRequestContext} from \"@/auth/request-context\";
  import {PageHeader} from \"@/components/ui/page-header\";
  import {PageBackLink} from \"@/components/ui/page-back-link\";
  ```

## tests/unit/UX-mentor-cross-editor-mobile-01.test.ts (1 failing)
- UX-mentor-cross-F04 keeps mobile editors 16px and ties reschedule errors to inputs

  ```
  AssertionError: expected '"use client";\nimport {useId,useState…' to contain 'text-base focus-visible:outline-2'
  - Expected
  + Received
  - text-base focus-visible:outline-2
  + "use client";
  + import {useId,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-recruiter-colleges-01.test.ts (1 failing)
- UX-recruiter-colleges-01 > preserves role-safe navigation, exact route copy and accessible shared surface

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'redirect("/hr/home")'
  - Expected
  + Received
  - redirect("/hr/home")
  + import {redirect} from "next/navigation";
  + /** Legacy college selector returns to recruiter Today; access selection stays scoped there. */
  + export default function RecruiterColleges(){redirect("/recruiter/home");}
  +
  ```

## tests/unit/UX-teacher-courses-deliveryid-students-coverage-01.test.ts (1 failing)
- UX-teacher-courses-deliveryid-students-01 /teacher/courses/[deliveryId]/students keeps page scope and true states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<PageHeader\n        eyebrow="Faculty…'
  - Expected
  + Received
  - <PageHeader
  -         eyebrow="Faculty · Course"
  -         title="Students"
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  ```
