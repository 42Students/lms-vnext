# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/HR-BREAK-chat19-notifications-page.test.ts (11 failing)
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"collegeId":"../admin"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"collegeId":"invalid"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":"0"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":"100000000"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":"1.5"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"q":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"unreadOnly":"neither"} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"collegeId":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"page":["1","2"]} renders recoverable error without reading a tenant inbox

  ```
  
  ```
- HR-BREAK-chat19-notifications-page: recruiter-scoped page behavior > invalid filter {"q":["A","B"]} renders recoverable error without reading a tenant inbox

  ```
  AssertionError: expected [] to include '/hr/notifications'
  ❯ tests/unit/HR-BREAK-chat19-notifications-page.test.ts:66:25
  64|   const output=await view(raw);
  65|   expect(renderText(output)).toContain("Invalid inbox filter");
  66|   expect(links(output)).toContain("/hr/notifications");
  |                         ^
  67|   expect(m.notifications).not.toHaveBeenCalled();
  68|  });
  ```
- … 1 more in this file

## tests/unit/PROJ-BREAK-chat9-admin-view-filter-boundary.test.ts (1 failing)
- IIT Dharwad Projects: strict snapshot filter contract preserves cards and list > PROJ-BREAK-ux-22 college page projects away view before service but preserves user-selected tabs

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'q: query.q, status: query.status, pag…'
  - Expected
  + Received
  - q: query.q, status: query.status, page: query.page, pageSize: query.pageSize
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/UX-chat15-hr-tracker-pages-07.test.ts (1 failing)
- UX-HR-PAGES-07: recruiter and tracker page role, error and alias contracts > UX-TRACKER-ERROR-06: ordinary reporters never see migration flags or server configuration

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'context.user.platformStatus !== "ACTI…'
  - Expected
  + Received
  - context.user.platformStatus !== "ACTIVE"
  + import { Banner } from "@/components/ui/banner";
  + import { ErrorState } from "@/components/ui/error-state";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-courses-attendance-overlays-01.test.ts (1 failing)
- UX-courses-attendance-overlay-foundation-01 > UX-courses-faculty-quiz-review-01 preserves its accessible Dialog and relevant state/action

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'assessment list'
  - Expected
  + Received
  - assessment list
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  + import {useEffect,useRef,useState} from "react";
  ```

## tests/unit/UX-teacher-profile-teaching-coverage-01.test.ts (1 failing)
- UX-teacher-profile-teaching-01 /teacher/profile/teaching keeps access and honest feedback

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain '<PageHeader eyebrow="Faculty · Self P…'
  - Expected
  + Received
  - <PageHeader eyebrow="Faculty · Self Profile" title="Current teaching assignments"
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/chat11-college-project-summary-state.test.ts (1 failing)
- PROJ-BREAK-COL-SUMMARY-01 College Admin project editing > locks and rechecks the persisted college before CAS, writes audit and sends after transaction event

  ```
  AssertionError: expected 4444 to be less than 1479
  ❯ tests/unit/chat11-college-project-summary-state.test.ts:72:17
  70|   const stale=service.indexOf("PROJECT_SUBMISSION_CONFLICT");
  71|   expect(archived).toBeLessThan(retry);
  72|   expect(retry).toBeLessThan(stale);
  |                 ^
  73|   expect(service).toContain("collegeProjectStatusChangeAllowed(row.sta…
  74|   expect(service).toContain("eq(departments.collegeId,scope.collegeId)…
  ```

## tests/unit/chat12-grid-columns-round3.test.ts (1 failing)
- chat-12 Students responsive grid and column preference > TPO-students-51 keeps mobile row actions always visible while preserving filters

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGrid integratedWorkspace mobileAc…'
  - Expected
  + Received
  - <TpoGrid integratedWorkspace mobileActionsCollapsible defaultVisibleKeys=
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat13-admin-ui-placements-tenant-matrix.test.ts (1 failing)
- SA-ADMIN-PLACEMENT-SERVICE-MATRIX-01 all Super Admin placement directories respect selected college > checks the role and scoped college before querying super-admin-hiring-report-service.ts

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'requireSuperAdminSelectedCollege(cont…'
  - Expected
  + Received
  - requireSuperAdminSelectedCollege(context,"placements.read")
  + import "server-only";
  + import {and,asc,eq,exists,gte,ilike,lt,or,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {
  ```
