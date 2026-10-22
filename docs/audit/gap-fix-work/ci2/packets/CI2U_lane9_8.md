# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-tpo-round-contracts-break-11.test.ts (1 failing)
- TPO-BREAK-round-contracts-11 validation and state evidence, no tenant or rank guessing > retains legacy round decisions, honest attendance states and formula-safe CSV export

  ```
  AssertionError: expected { PASS: 'Pass', …(3) } to deeply equal { …(4) }
  - Expected
  + Received
  {
  -   "ABSENT": "Absent from round",
  -   "FAIL": "Not selected in this round",
  -   "HOLD": "On hold / waitlisted",
  -   "PASS": "Shortlisted for next round",
  ```

## tests/unit/chat3-faculty-gradebook-bounded-report-batch.test.ts (1 failing)
- FAC-GRADEBOOK-SCALE-02 bounded published grade read throughput > preserves assessment ordering while up to six report reads finish out of order

  ```
  AssertionError: expected 5 to be 6 // Object.is equality
  - Expected
  + Received
  - 6
  + 5
  ```

## tests/unit/chat3-tenant-public-verified-round13.test.ts (5 failing)
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-05 searchable college scope also warns when all colleges are shown

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'search.trim() && visibleColleges.leng…'
  - Expected
  + Received
  - search.trim() && visibleColleges.length===0
  + "use client";
  +
  + import {useEffect,useState,useTransition} from "react";
  + import {useRouter} from "next/navigation";
  ```
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-13 college directory supports search by organization, count and pages

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'Search college, code, city or organiz…'
  - Expected
  + Received
  - Search college, code, city or organization
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-06 has two scoped URL-persisted tenant setup steps

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'tenantSetupTab(query.tab,id!==null)'
  - Expected
  + Received
  - tenantSetupTab(query.tab,id!==null)
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import Link from "next/link";
  + import {notFound} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-17 has a college-scoped administrator creation and lifecycle workspace

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'View history'
  - Expected
  + Received
  - View history
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Alert} from "@/components/ui/alert";
  ```
- Chat-3 owner-backed tenant/public gap dispositions > SA-tenants-modules-19 retains college-scoped activity read and authorized CSV without a duplicate GET write

  ```
  AssertionError: expected 'import Link from "next/link";\n\nimpo…' to contain 'href={`/activity?collegeId=${encodeUR…'
  - Expected
  + Received
  - href={`/activity?collegeId=${encodeURIComponent(item.id)}`}
  + import Link from "next/link";
  +
  + import { collegeIdSchema } from "@/modules/colleges/validation";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```

## tests/unit/chat4-college-export-signin-ledger.test.ts (1 failing)
- College/tenant exhaustive coverage slice: exports and sign-in policy > SA-tenants-signin-READ-01 public read never accepts request-body tenant IDs and refuses corrupt policy

  ```
  AssertionError: expected 'import "server-only";\nimport {eq,sql…' to contain 'if(!collegeId)return "EMAIL_AND_PHONE…'
  - Expected
  + Received
  - if(!collegeId)return "EMAIL_AND_PHONE" as const
  + import "server-only";
  + import {eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeSigninPolicies} from "@/db/schema/college-signin";
  ```

## tests/unit/chat4-college-ux-round3.test.ts (5 failing)
- Chat-4 college UX round 3 > UX-college-batches-01 adds safe narrow-screen affordances

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import {isSuperAdmin} from "@/modules/identity/context";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 college UX round 3 > UX-college-branding-01 adds safe narrow-screen affordances

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeBrandingForm } from "@/components/admin/college-branding-form";
  + import { CollegeLogoUploader } from "@/components/admin/college-logo-uploader";
  ```
- Chat-4 college UX round 3 > UX-college-classes-01 adds safe narrow-screen affordances

  ```
  AssertionError: expected 'import { collegeDirectoryValidationMe…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { collegeDirectoryValidationMessage } from "@/modules/academics/college-directory-validation";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeStructureDirectory } from "@/components/academics/college-structure-directory";
  ```
- Chat-4 college UX round 3 > UX-college-classes-recurring-preview-01 adds safe narrow-screen affordances

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeRecurringRouteModal } from "./route-modal";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Chat-4 college UX round 3 > UX-college-college-profile-01 adds safe narrow-screen affordances

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeContactProfileForm } from "@/components/colleges/college-contact-profile-form";
  ```

## tests/unit/chat4-super-admin-colleges-bulk-csv-hardening.test.ts (1 failing)
- Super Admin colleges bulk CSV adversarial parser > SA-colleges-bulk-input-03 enforces 200 rows, no case-variant duplicate codes, required names and correct lengths

  ```
  Error: Row 2: college code must use 3–63 letters, numbers or hyphens.
  ❯ src/modules/colleges/bulk-import-model.ts:76:11
  74|   }
  75|   if(!/^[A-Za-z0-9-]{3,63}$/.test(code))
  76|     throw Error("Row "+line+": college code must use 3–63 letters, num…
  |           ^
  77|   return {line,name,code,city:v(2)||null,state:v(3)||null,country:v(4)…
  78|  });
  ```
