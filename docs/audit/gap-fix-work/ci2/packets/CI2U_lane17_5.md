# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat12-filter-chips-mobile-round5.test.ts (2 failing)
- chat12 mobile filters and chips > TPO-students-24 displays removable filter chips with URL-preserving reset

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'aria-label="Active student filters"'
  - Expected
  + Received
  - aria-label="Active student filters"
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```
- chat12 mobile filters and chips > TPO-students-51 exposes an accessible mobile filter disclosure and bottom sheet

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain '<BottomSheet open={sheetOpen} onOpenC…'
  - Expected
  + Received
  - <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filter students">
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  ```

## tests/unit/chat12-round25-column-pin-width.test.ts (1 failing)
- TPO-students-39 remembers user-chosen column order visibility pinning and bounded resizing per browser

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'viewKey=storageKey?storageKey+":layou…'
  - Expected
  + Received
  - viewKey=storageKey?storageKey+":layout-v2":null
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChip} from "@/components/ui/filter-chip";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat12-tpo-companies-page-query-ssr.test.tsx (1 failing)
- UX-tpo-companies-duplicate-filters-01 SSR invalid, denied and legacy links > keeps the original unfiltered companies redirect, not an empty fabricated directory

  ```
  AssertionError: expected [Function] to throw error including 'REDIRECT_TO_/tpo/recruiters?view=comp…' but got 'Cannot read properties of undefined (…'
  Expected: "REDIRECT_TO_/tpo/recruiters?view=companies"
  Received: "Cannot read properties of undefined (reading 'page')"
  ```

## tests/unit/chat12-verification-round6-contracts.test.ts (3 failing)
- TPO verification round6 source regressions > TPO-requests-verification-25 current behavior covered

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Review one by one'
  - Expected
  + Received
  - Review one by one
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import {useRouter,useSearchParams} from "next/navigation";
  ```
- TPO verification round6 source regressions > TPO-requests-verification-27 current behavior covered

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'The student sees your reason'
  - Expected
  + Received
  - The student sees your reason
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```
- TPO verification round6 source regressions > TPO-requests-verification-29 current behavior covered

  ```
  AssertionError: expected '"use client";\nimport {apiFetch,Frien…' to contain 'Private supporting documents'
  - Expected
  + Received
  - Private supporting documents
  + "use client";
  + import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
  + import {useEffect,useState} from "react";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/chat13-company-domains-aliases.test.ts (2 failing)
- Global company domain and other-name curation > SA-placements-projects-27 normalizes email domains, rejects personal, college and malformed hosts

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'Keep at least one company domain.'
  - Expected
  + Received
  - Keep at least one company domain.
  + import "server-only";
  + import {and,asc,eq,ilike,inArray,ne} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
- Global company domain and other-name curation > SA-placements-projects-28 enforces canonical alias collision checks and name search

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'Other name conflicts with another com…'
  - Expected
  + Received
  - Other name conflicts with another company.
  + import "server-only";
  + import {and,asc,eq,ilike,inArray,ne} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/chat13-placement-admin-uncovered-services.test.ts (3 failing)
- Super Admin placements remaining service entrypoint checks > SA-COMPANY-COLLEGE-02 locks tenant-linked employer relationships and writes audit after a guarded state transition

  ```
  AssertionError: expected 'import "server-only";\nimport {and,co…' to contain '.for("update",{of:placementCompanyRel…'
  - Expected
  + Received
  - .for("update",{of:placementCompanyRelationships})
  + import "server-only";
  + import {and,count,eq,isNull} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementCompanies,placementCompanyRelationships,placementJobs} from "@/db/schema";
  ```
- Super Admin placements remaining service entrypoint checks > SA-COMPANY-EDIT-02 denies selected-college global mutations, stale versions and active duplicates

  ```
  AssertionError: expected 'import "server-only";\nimport {and,eq…' to contain '!isGlobalCompanyScope(context.adminSc…'
  - Expected
  + Received
  - !isGlobalCompanyScope(context.adminScope)
  + import "server-only";
  + import {and,eq,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  ```
- Super Admin placements remaining service entrypoint checks > SA-COMPANY-IDENTITIES-03 requires actual current global role and domain/alias uniqueness before writes

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'context.adminScope?.collegeId||contex…'
  - Expected
  + Received
  - context.adminScope?.collegeId||context.adminScope?.organizationId
  + import "server-only";
  + import {and,asc,eq,ilike,inArray,ne} from "drizzle-orm";
  + import {z} from "zod";
  + import {getDb} from "@/db/client";
  ```
