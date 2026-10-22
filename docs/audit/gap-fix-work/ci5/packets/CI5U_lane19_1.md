# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts (1 failing)
- Super Admin colleges/organizations/tenants adversarial audit > SA-colleges-tenants-BREAK-02 selected-college scope cannot enumerate every organization

  ```
  AssertionError: expected 'if(selected?.collegeId){\n    require…' to contain 'eq(colleges.id, selected.collegeId)'
  - Expected
  + Received
  - eq(colleges.id, selected.collegeId)
  + if(selected?.collegeId){
  +     requirePermission(context,"organization.read",{
  +      organizationId:selectedOrganizationId,collegeId:selected.collegeId,
  +     });
  ```

## tests/unit/PROJ-BREAK-chat9-template-directory-page.test.tsx (1 failing)
- Super Admin Projects template directory graceful page states > PROJ-BREAK-ux-33 valid empty catalogue uses the correct empty state

  ```
  AssertionError: expected 'Project templates A single catalog ev…' to contain 'No templates match your filters'
  Expected: "No templates match your filters"
  Received: "Project templates A single catalog every college draws from — college-admin can use these but not edit them. Search title or slug Lifecycle status All statuses Draft Published Archived Filter Templates Export CSV downloads project-templates.csv (Title, Version, Lifecycle, Summary) for the
  ```

## tests/unit/UX-college-college-contacts-membership-id-01.test.ts (1 failing)
- UX-college-college-contacts-membership-id-01 verifies scoped responsive details

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { z } from "zod";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/UX-mentor-all-pages-scope-02.test.ts (1 failing)
- UX-mentor-all-pages-scope-02 mentor page-state and scope coverage > loads /mentor via its scoped service and preserves its distinct UI state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to match /@\/components\/(?:ui|proje…/components\
  - Expected:
  /@\/components\/(?:ui|projects|activity)/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { resolveOptionalModuleAccess } from \"@/modules/module-access/service\";
  ```

## tests/unit/UX-tpo-notifications-01.test.ts (1 failing)
- UX-tpo-notifications-01 /tpo/notifications > preserves legacy UI and signed-off phone and contrast contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to match /min-h-(?:9|10)\b/
  - Expected:
  /min-h-(?:9|10)\b/
  + Received:
  "import Link from \"next/link\";
  import {TpoNotificationRefresh} from \"@/components/tpo/tpo-notification-refresh\";
  import { redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  ```

## tests/unit/chat11-super-admin-tenant-route-guard.test.ts (1 failing)
- SA-tenants-modules-SEC-01: never render admin filter recovery before authorization > authenticates every route before handling hostile and repeated query parameters

  ```
  AssertionError: src/app/(authenticated)/admin/module-access/page.tsx: expected -1 to be greater than -1
  ❯ tests/unit/chat11-super-admin-tenant-route-guard.test.ts:60:22
  58|    const noSpace=source.indexOf("if(!parsed)");
  59|    const recovery=[invalid,invalidNoSpace,whitespace,noSpace].filter(i…
  60|    expect(auth,file).toBeGreaterThan(-1);
  |                      ^
  61|    expect(recovery.length,file).toBeGreaterThan(0);
  62|    expect(auth,file).toBeLessThan(Math.min(...recovery));
  ```

## tests/unit/chat12-tpo-safe-export.test.ts (1 failing)
- chat-12 TPO export failure protection > GR-90 / GR-91 offers announced inline export failures and keyboard retry

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'focus-visible:ring-2'
  - Expected
  + Received
  - focus-visible:ring-2
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import {useRef,useState} from "react";
  ```

## tests/unit/chat13-placements-admin-coverage-registry.test.ts (1 failing)
- SA-ADMIN-LEDGER-01 every dedicated placement-admin/report module has an explicit coverage record > enumerates every admin, Super Admin, report and platform-policy file without silently omitting new entrypoints

  ```
  AssertionError: expected [ …(4) ] to deeply equal []
  - Expected
  + Received
  - []
  + [
  +   "admin-drive-settings-date-model.ts",
  +   "super-admin-calendar-appointment-directory.ts",
  +   "super-admin-drive-attention-service.ts",
  ```
