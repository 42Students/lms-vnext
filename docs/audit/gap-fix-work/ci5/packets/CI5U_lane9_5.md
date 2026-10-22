# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-projects-gap-verification.test.ts (5 failing)
- learner/projects verified gap closure > LEARNER-projects-03 blocks are labelled and linked to Board blocked tasks

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain '?tab=board&taskStatus=BLOCKED'
  - Expected
  + Received
  - ?tab=board&taskStatus=BLOCKED
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- learner/projects verified gap closure > LEARNER-projects-04 maps legacy status labels and exposes blocked attention

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain 'query.attention!=="BLOCKED"'
  - Expected
  + Received
  - query.attention!=="BLOCKED"
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- learner/projects verified gap closure > LEARNER-projects-10 archived learner workspace has exact read-only copy

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'This workspace is archived, so it is …'
  - Expected
  + Received
  - This workspace is archived, so it is read-only.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner/projects verified gap closure > LEARNER-projects-16 Overview uses legacy learner section names

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain '"Project team"'
  - Expected
  + Received
  - "Project team"
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner/projects verified gap closure > LEARNER-projects-30 comments validate nonempty note and expose comment kind

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useS…' to contain 'if(!body.trim())return;'
  - Expected
  + Received
  - if(!body.trim())return;
  + "use client";
  + import {useEffect,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/module-access.test.ts (1 failing)
- optional module access resolution > resolves Placements through the same specificity and lock chain as other modules

  ```
  AssertionError: expected { enabled: true, …(3) } to match object { enabled: true, …(2) }
  (1 matching property omitted from actual)
  - Expected
  + Received
  {
  "enabled": true,
  -   "level": "MEMBERSHIP",
  -   "locked": true,
  ```

## tests/unit/pub-auth-public-42-rollback.test.ts (1 failing)
- PUB-auth-public-42 failed identity and grant steps must roll back > does not commit new user/profile after an invalid post-identity state

  ```
  AssertionError: expected 'import "server-only";\nimport {create…' to contain 'if(!profile||profile.companyId!==rela…'
  - Expected
  + Received
  - if(!profile||profile.companyId!==relationship.companyId||profile.status!=="ACTIVE")
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  + import type {RequestContext} from "@/modules/identity/context";
  ```

## tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts (2 failing)
- chat-7 recruiter drive request legacy safety > REC-home-drives-27 matches the reviewed contract

  ```
  AssertionError: expected 'import { z } from "zod";\nimport { sa…' to contain 'rounds: z.array(round).max(12)'
  - Expected
  + Received
  - rounds: z.array(round).max(12)
  + import { z } from "zod";
  + import { safeRecruiterExternalLink } from "./recruiter-applicant-shared-links-model";
  +
  + export const hrDriveDraftQuerySchema = z.strictObject({
  ```
- chat-7 recruiter drive request legacy safety > REC-home-drives-32 matches the reviewed contract

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discard this drive draft?'
  - Expected
  + Received
  - Discard this drive draft?
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```

## tests/unit/super-admin-legacy-wording.test.ts (1 failing)
- Super Admin legacy label fixes that do not orphan pages (superAdminNavigationMenuFlat) > page headings use the legacy titles

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

## tests/unit/tpo-batches-48-final-chat5.test.ts (1 failing)
- TPO batch finished access and honest state > TPO-batches-48 enforces finished batch read-only on every decision entry point

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '!finished&&!s.ambiguous'
  - Expected
  + Received
  - !finished&&!s.ambiguous
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-drive-workspace-chat5-next-round.test.ts (2 failing)
- Drive Workspace next-round graceful action and mobile parity > TPO-drive-workspace-72 uses a keyboard-accessible mobile section picker with desktop tabs intact

  ```
  AssertionError: expected '"use client";\nimport { Dropdown } fr…' to contain 'sm:hidden'
  - Expected
  + Received
  - sm:hidden
  + "use client";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Select } from "@/components/ui/select";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- Drive Workspace next-round graceful action and mobile parity > GR-35 GR-90 GR-91 uses an explicit check and announced error for offer confirmations

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/tpo-recruiter-invite-message.test.ts (1 failing)
- TPO-recruiters-12 seven-day recruiter invitation message > shows preview, manual email draft, copy and guarded close

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'window.confirm'
  - Expected
  + Received
  - window.confirm
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
