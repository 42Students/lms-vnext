# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-calendar-company-pages.test.ts (1 failing)
- HR-BREAK-chat19-calendar-company: account-deny and stable navigation > no grants provides clear company access recovery without roster/drive reads

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { user: { …(4) }, …(2) }, null ]
  Received:
  1st vi.fn() call:
  @@ -23,6 +23,7 @@
  "platformStatus": "ACTIVE",
  "systemRoles": [],
  },
  },
  ```

## tests/unit/PROJ-BREAK-chat9-admin-unsubmitted-service.test.ts (1 failing)
- IIT Dharwad Projects Admin unsubmitted workspaces service permissions and pagination > PROJ-BREAK-submissions-42 filters both count and page by actual workspace status without resurrecting archives

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/UX-admin-scroll-motion-chat6.test.ts (3 failing)
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-06 drive action menu has vertical fade, focusable bounded region and narrow-phone hint (src/components/placements/placement-drive-workspace.tsx)

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'tabIndex={detail.notes.length>3?0:und…'
  - Expected
  + Received
  - tabIndex={detail.notes.length>3?0:undefined}
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-08 inbound-mail Drawer uses the audited native body with guarded status and accessible message (src/components/admin/inbound-mail-list.tsx)

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Plain text message'
  - Expected
  + Received
  - Plain text message
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import Link from "next/link";
  + import {useRouter} from "next/navigation";
  ```
- UX admin scroll and motion after invisible scrollbar owner decision > UX-admin-scroll-motion-20 application notes Drawer scroll is labelled, masked and keyboard reachable

  ```
  AssertionError: expected '"use client";\nimport {Dialog} from "…' to contain 'tabIndex={0}'
  - Expected
  + Received
  - tabIndex={0}
  + "use client";
  + import {Dialog} from "@/components/ui/dialog";
  + import {ConfirmDialog} from "@/components/ui/confirm-dialog";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/UX-college-projects-01.test.ts (2 failing)
- /college/projects UX > UX-college-projects-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Project workspace tools"'
  - Expected
  + Received
  - aria-label="Project workspace tools"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- /college/projects UX > UX-college-projects-02 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Workspace display and arc…'
  - Expected
  + Received
  - aria-label="Workspace display and archive"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/UX-teacher-native-font-shared-round8.test.ts (5 failing)
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-01 uses shared controls with mobile-safe 16px and touch targets

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'max-[767px]:text-[16px]'
  - Expected
  + Received
  - max-[767px]:text-[16px]
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-02 uses shared controls with mobile-safe 16px and touch targets

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'max-[767px]:text-[16px]'
  - Expected
  + Received
  - max-[767px]:text-[16px]
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-03 uses shared controls with mobile-safe 16px and touch targets

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'max-[767px]:text-[16px]'
  - Expected
  + Received
  - max-[767px]:text-[16px]
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-04 uses shared controls with mobile-safe 16px and touch targets

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'max-[767px]:text-[16px]'
  - Expected
  + Received
  - max-[767px]:text-[16px]
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  ```
- Faculty reporter and shared control font size > UX-teacher-native-font-shared-05 uses shared controls with mobile-safe 16px and touch targets

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' to contain 'max-[767px]:text-[16px]'
  - Expected
  + Received
  - max-[767px]:text-[16px]
  + import { Badge } from "@/components/ui/badge";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import {FacultyCourseCover} from "./faculty-course-cover";
  ```

## tests/unit/api-origin-guard.test.ts (1 failing)
- state-changing API routes > every POST/PUT/PATCH/DELETE handler checks the request origin

  ```
  AssertionError: Handlers that change state without a same-origin check:
  src/app/api/courses/lesson-contents/[contentId]/materials/files/[materialId]/route.ts POST
  src/app/api/courses/lesson-contents/[contentId]/materials/files/[materialId]/route.ts DELETE
  src/app/api/courses/lesson-contents/[contentId]/materials/files/[materialId]/route.ts PATCH
  src/app/api/courses/quizzes/[quizId]/results/route.ts PATCH
  src/app/api/courses/quizzes/[quizId]/route.ts PUT
  src/app/api/internal/inbound-mail/route.ts POST
  src/app/api/internal/notifications/release/route.ts POST
  ```

## tests/unit/chat12-filter-chips-mobile-round5.test.ts (1 failing)
- chat12 mobile filters and chips > TPO-students-51 exposes an accessible mobile filter disclosure and bottom sheet

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

## tests/unit/chat13-admin-first-third-audit.test.ts (12 failing)
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-academics requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { isSuperAdmin } from \"@/modules/identity/context\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-announcements requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {MetricBar} from \"@/components/ui/metric-bar\";
  import chartStyles from \"@/components/placements/report-bar-chart.module.css\";
  import {Select} from \"@/components/ui/select\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-audit requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import Link from \"next/link\";
  import {redirect} from \"next/navigation\";
  import ActivityPage from \"@/app/(authenticated)/activity/page\";
  import {getCurrentRequestContext} from \"@/auth/request-context\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-batch-promotion requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Checkbox} from "@/components/…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Checkbox} from \"@/components/ui/checkbox\";
  import {Button} from \"@/components/ui/button\";
  import {Select} from \"@/components/ui/select\";
  import {Input} from \"@/components/ui/input\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-colleges requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {inArray,sql} from \"drizzle-orm\";
  import {getDb} from \"@/db/client\";
  import {collegeMemberships} from \"@/db/schema\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-colleges-[collegeId]-subdomain requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import { Suspense } from \"react\";
  import { notFound } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { PageHeader } from \"@/components/ui/page-header\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-companies requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import {Button} from \"@/components/ui/button\";
  import {DataTable,type DataTableColumn} from \"@/components/ui/data-table\";
  import {Banner} from \"@/components/ui/banner\";
  import type {AdminCompanyRow} from \"@/modules/placements/admin-company-directory-model\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-departments requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import { AcademicSetupSteps } from "@…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import { AcademicSetupSteps } from \"@/components/admin/academic-setup-steps\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { DepartmentCreateForm } from \"@/components/admin/department-create-form\";
  import { DepartmentDirectory } from \"@/components/admin/department-directory\";
  ```
- chat-13 Super Admin /admin first-third route source audit > UX-admin-first--admin-hr requires authenticated context and no raw unresponsive tables

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' not to match /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  - Expected:
  /(?<![\w:-])min-h-(?:7|8|9|10)(?!\d)/
  + Received:
  "import { redirect } from \"next/navigation\";
  import Link from \"next/link\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { SuperAdminHrAccounts } from \"@/components/admin/super-admin-hr-accounts\";
  ```
- chat-13 Super Admin /admin first-third route source audit > SA-ADMIN-FIRST-02 requires selected college scope before academic workspaces are loaded

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'title="Select a college scope"'
  - Expected
  + Received
  - title="Select a college scope"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- … 2 more in this file
