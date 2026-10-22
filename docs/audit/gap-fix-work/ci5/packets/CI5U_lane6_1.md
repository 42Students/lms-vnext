# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat15-tracker-audit-page-58.test.ts (2 failing)
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > reads only after admin authorization and exposes an explicit empty result

  ```
  AssertionError: expected [] to have a length of 1 but got +0
  - Expected
  + Received
  - 1
  + 0
  ```
- HR-TRACKER-PAGE-58: admin-only findings route resilient states > preserves the persisted finding's id and authorized detail link

  ```
  TypeError: Cannot read properties of undefined (reading 'props')
  ❯ tests/unit/HR-BREAK-chat15-tracker-audit-page-58.test.ts:112:22
  110|   const tables=allNodes(result).filter(n=>
  111|    (n.props as {caption?:string}).caption==="Independent audit finding…
  112|   expect((tables[0]!.props as {rows:unknown[]}).rows).toEqual([item]);
  |                      ^
  113|   expect(mocks.list).toHaveBeenCalledTimes(1);
  114|  });
  ```

## tests/unit/PROJ-BREAK-chat9-admin-scoped-directory-states.test.tsx (1 failing)
- Super Admin last-third shared scoped directories: no false empties or leaked errors > UX-admin-directory-106 legitimate empty list remains a distinct zero-state

  ```
  AssertionError: expected 'Registered Students Scoped list Stude…' to contain '0 matching records'
  Expected: "0 matching records"
  Received: "Registered Students Scoped list Students 0 Active 0 Suspended 0 Visible now 0 Search Status Any status Active Suspended Ended Filter Rows per page 0 of 0 students  · showing  0 – 0  · page  1  of  1"
  ```

## tests/unit/UX-admin-cross-chat-12-touch-contrast.test.ts (1 failing)
- UX-admin first third delegated touch and contrast audits > src/components/academics/academics-section-page.tsx

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { notFound } from "next/navigation";
  + import { ZodError } from "zod";
  + import { AcademicsServiceError } from "@/modules/academics/errors";
  ```

## tests/unit/UX-college-placements-jobs-jobId-overview-01.test.ts (2 failing)
- /college/placements/jobs/[jobId]/overview UX > UX-college-placements-jobs-overview-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<StatTile key={name}'
  - Expected
  + Received
  - <StatTile key={name}
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- /college/placements/jobs/[jobId]/overview UX > UX-college-placements-jobs-overview-02 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'View hired candidates'
  - Expected
  + Received
  - View hired candidates
  + import Link from "next/link";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { Alert } from "@/components/ui/alert";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```

## tests/unit/UX-teacher-native-font-16px-round7.test.ts (8 failing)
- Faculty native controls preserve readable mobile fonts > UX-teacher-calendar-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { DateInput } from \"@/components/ui/date-input\";
  import { Select } from \"@/components/ui/select\";
  import {Button} from \"@/components/ui/button\";
  import {Disclosure} from \"@/components/ui/disclosure\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-contacts-contactsTab-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { Select } from "@/components/…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { Select } from \"@/components/ui/select\";
  import { Button } from \"@/components/ui/button\";
  import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-courses-deliveryId-assessment-health-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { Select } from "@/components/…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { Select } from \"@/components/ui/select\";
  import {Button} from \"@/components/ui/button\";
  import Link from \"next/link\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-courses-deliveryId-discussion-history-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { Pagination } from \"@/components/ui/pagination\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Badge } from \"@/components/ui/badge\";
  import { Select } from \"@/components/ui/select\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-courses-deliveryId-gradebook-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { Pagination } from \"@/components/ui/pagination\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import { Input } from \"@/components/ui/input\";
  import {Button} from \"@/components/ui/button\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-courses-deliveryId-reports-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import Link from \"next/link\";
  import { Select } from \"@/components/ui/select\";
  import { Button } from \"@/components/ui/button\";
  import { PageHeader } from \"@/components/ui/page-header\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-live-classes-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { Pagination } from \"@/components/ui/pagination\";
  import { Disclosure } from \"@/components/ui/disclosure\";
  import Link from \"next/link\";
  import { ThirdPartyLink } from \"@/components/ui/third-party-link\";
  ```
- Faculty native controls preserve readable mobile fonts > UX-teacher-profile-teaching-03 keeps accessible shared field typography across breakpoints

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' not to match /<(?:input|select|textarea)\b(?![^>]*…/i
  - Expected:
  /<(?:input|select|textarea)\b(?![^>]*type="hidden")/i
  + Received:
  "import { Input } from \"@/components/ui/input\";
  import {Button} from \"@/components/ui/button\";
  import Link from \"next/link\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  ```

## tests/unit/UX-verification-education-table-chat17.test.ts (1 failing)
- UX-UNOWNED-TABLE-06 private verification education grid > displays only five bounded, permitted fields with legacy fallback copy

  ```
  AssertionError: expected { id: '5', …(5) } to match object { id: '5', institution: '—', …(3) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "id": "5",
  "institution": "—",
  -   "marks": "—",
  ```

## tests/unit/chat12-company-depth-round6.test.ts (1 failing)
- Chat12 company depth and URL filters > TPO-students-51 keeps roster actions always visible on phone

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel fields={filters} …'
  - Expected
  + Received
  - <TpoGridFilterPanel fields={filters} mobileSheet/>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat13-admin-drive-deadline-boundary.test.ts (1 failing)
- SA-ADMIN-DRIVE-04 Super Admin drive expiry boundary > treats an exact deadline as expired and preserves status before it

  ```
  AssertionError: expected 'Open' to be 'Expired' // Object.is equality
  Expected: "Expired"
  Received: "Open"
  ```
