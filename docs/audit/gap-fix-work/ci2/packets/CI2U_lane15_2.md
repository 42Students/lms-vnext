# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat9-admin-semester-mappings-page.test.tsx (3 failing)
- Super Admin last-third Semester–Course Mapping guarded journeys > UX-admin-semester-courses-33 missing selected college shows correct next step without reading mapping data

  ```
  AssertionError: expected 'Semester–Course Mapping Define the cu…' to contain 'Select a college to continue'
  Expected: "Select a college to continue"
  Received: "Semester–Course Mapping Define the curriculum for each semester and spot courses that still need faculty coverage. Select a college to manage Semester–Course Mapping.  Choose an Organization + College in the header above. The mapping editor is disabled until a college is selected."
  ```
- Super Admin last-third Semester–Course Mapping guarded journeys > UX-admin-semester-courses-34 editor dependency failure preserves authorized mapping directory

  ```
  AssertionError: expected 'Semester–Course Mapping Define the cu…' to contain 'Semester mapping editor is temporaril…'
  Expected: "Semester mapping editor is temporarily unavailable."
  Received: "Semester–Course Mapping Define the curriculum for each semester and spot courses that still need faculty coverage."
  ```
- Super Admin last-third Semester–Course Mapping guarded journeys > UX-admin-semester-courses-35 healthy read still exposes the authorized mapping editor

  ```
  TypeError: Cannot read properties of undefined (reading 'map')
  ❯ Module.SuperAdminSemesterCourseMappingPage src/app/(authenticated)/admin/semester-courses/page.tsx:52:17
  50|     </div>
  51|    </Banner>:null}
  52|    {curriculum?.lookupFailures.map(name=><Banner key={name} tone="warn…
  |                 ^
  53|     <div className="flex flex-wrap items-center gap-3">
  54|      <span>Could not load {name}. Other semester mapping information r…
  ```

## tests/unit/PROJ-BREAK-chat9-sa-student-lookup-recovery.test.tsx (3 failing)
- Super Admin last-third student placement lookup: URL safety and role scope > SA-placements-student-lookup-01 valid normalized search preserves one scoped lookup

  ```
  Error: [vitest] No "suggestCollegePlacementLearners" export is defined on the "@/modules/placements/college-placement-student-lookup-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/placements/college-placement-student-lookup-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- Super Admin last-third student placement lookup: URL safety and role scope > SA-placements-student-lookup-02 invalid long, duplicate, whitespace-only and short GET never reach DB

  ```
  AssertionError: expected '/admin/placements Student placement l…' to contain 'Invalid student search'
  Expected: "Invalid student search"
  Received: "/admin/placements Student placement lookup Look up a student’s placement status Enter 2 to 150 characters in a single search. Search results are scoped to the selected college. Analytics /admin/placements/analytics"
  ```
- Super Admin last-third student placement lookup: URL safety and role scope > SA-placements-student-lookup-03 unscoped administrator cannot search learner records

  ```
  AssertionError: expected '/admin/placements Student placement l…' to contain 'Select a college to continue'
  Expected: "Select a college to continue"
  Received: "/admin/placements Student placement lookup Look up a student’s placement status Choose a college in the header above to look up student placements. Analytics /admin/placements/analytics"
  ```

## tests/unit/UX-SPILL-chat19-tpo-request-responsive.test.tsx (2 failing)
- UX-SPILL-TPO-CLIP-02: request mobile cards retain selection and full fields > exposes candidate identity, company, request state and selectable row in accessible phone cards

  ```
  AssertionError: expected '<section aria-label="Request row tool…' to contain 'More details'
  - Expected
  + Received
  - More details
  + <section aria-label="Request row tools" class="space-y-2 border-y border-[var(--lms-canvas-border)] py-3"><p class="text-sm font-semibold">Select and copy request rows</p><p role="status" aria-live="polite" class="text-xs">0 selected of 1 on this page.</p><div class="flex flex-wrap gap-3"><label c
  ```
- UX-SPILL-TPO-CLIP-02: request mobile cards retain selection and full fields > keeps sorting, chooser and reset controls keyboard-focusable and 44px tall

  ```
  AssertionError: expected '<section aria-label="Request row tool…' to match /<summary[^>]*min-h-11[^>]*>Ch…/summary>
  - Expected:
  /<summary[^>]*min-h-11[^>]*>Choose columns<\/summary>/
  + Received:
  "<section aria-label=\"Request row tools\" class=\"space-y-2 border-y border-[var(--lms-canvas-border)] py-3\"><p class=\"text-sm font-semibold\">Select and copy request rows</p><p role=\"status\" aria-live=\"polite\" class=\"text-xs\">0 selected of 1 on this page.</p><div class=\"flex flex-wrap gap
  ```

## tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts (3 failing)
- chat-16 public/auth redirect pages handle expired sessions and wrong roles > UX-e2e-superadmin-login-01 never offers a privileged e2e bypass

  ```
  AssertionError: expected [Function] to throw an error
  - Expected:
  null
  + Received:
  undefined
  ```
- chat-16 public/auth redirect pages handle expired sessions and wrong roles > UX-superadmin-login-16 keeps legacy privileged bookmarks on the explicit first-party OTP path

  ```
  AssertionError: expected "vi.fn()" to be called once with arguments: [ '/login' ]
  Received:
  1st vi.fn() call:
  [
  -   "/login",
  +   "/login?legacy=superadmin",
  ]
  Number of calls: 1
  ```
- chat-16 public/auth redirect pages handle expired sessions and wrong roles > UX-privacy-policy-01 links the stable, existing static policy without an auth request

  ```
  AssertionError: expected 'Privacy Policy | 42LMS' to be 'Privacy | 42LMS' // Object.is equality
  Expected: "Privacy | 42LMS"
  Received: "Privacy Policy | 42LMS"
  ```

## tests/unit/UX-college-college-contacts-membership-id-01.test.ts (1 failing)
- UX-college-college-contacts-membership-id-01 verifies scoped responsive details

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'overflow-x-clip'
  - Expected
  + Received
  - overflow-x-clip
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { z } from "zod";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-college-college-people-01.test.ts (1 failing)
- UX-college-college-people-01 ensures route-safe responsive navigation

  ```
  AssertionError: expected 'import CollegeContactsPage from "../c…' to contain 'redirect("/college/contacts")'
  - Expected
  + Received
  - redirect("/college/contacts")
  + import CollegeContactsPage from "../contacts/page";
  +
  + /** Keep the historical /college-admin/people destination on the canonical
  +  * college workspace URL. The old shared directory maps to role-specific
  ```
