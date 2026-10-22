# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat2-unconfirmed-inbox-decisions.test.ts (1 failing)
- TPO inbox ambiguous legacy behaviours resolved by safer policy > TPO-inbox-team-11 fails visibly when recruiter conversations are missing instead of presenting notifications as conversations

  ```
  AssertionError: expected 'import { TpoTeamMessagesDirectory } f…' to contain 'Recruiter conversations are temporari…'
  - Expected
  + Received
  - Recruiter conversations are temporarily unavailable
  + import { TpoTeamMessagesDirectory } from "@/components/tpo/tpo-team-messages-directory";
  + import Link from "next/link";
  + import {TpoRecruiterMessageReply} from "@/components/tpo/tpo-recruiter-message-reply";
  + import {getTpoRecruiterThreadDetail} from "@/modules/placements/tpo-recruiter-thread-detail-service";
  ```

## tests/unit/chat3-people-metrics-round14.test.ts (1 failing)
- COL-people-13 directory information without fabricated private data > COL-people-13 renders Active/Suspended while refusing to invent online presence

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Not tracked'
  - Expected
  + Received
  - Not tracked
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Input } from "@/components/ui/input";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-college-academic-people-gap-closure.test.ts (3 failing)
- chat-4 College academic and people gap closure > COL-courses-content-R01 keeps context for the next teaching assignment

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Created ${successes} teaching assignm…'
  - Expected
  + Received
  - Created ${successes} teaching assignments for this class.
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
- chat-4 College academic and people gap closure > COL-academic-setup-R05 bounds semesters and mapping credits

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
- chat-4 College academic and people gap closure > COL-academic-setup-R03 links the required academic-period setup from guides and empty states

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '<Link href="/college/academics"'
  - Expected
  + Received
  - <Link href="/college/academics"
  + "use client";
  + import { Button } from "@/components/ui/button";
  +
  + import { useEffect, useState, useTransition, type FormEvent } from "react";
  ```

## tests/unit/chat4-college-placements-r01-directory.test.ts (2 failing)
- COL-placements-R01 college directory and export behavior > COL-placements-R01 scopes company listing and both CSV routes to college admin

  ```
  AssertionError: expected 'import {NextResponse} from "next/serv…' to contain 'listCollegeCompanyDirectory(await get…'
  - Expected
  + Received
  - listCollegeCompanyDirectory(await getCurrentRequestContext()
  + import {NextResponse} from "next/server";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {apiErrorResponse} from "@/lib/api-error";
  + import {parseCollegeCompaniesQuery} from "@/modules/placements/college-company-directory-model";
  ```
- COL-placements-R01 college directory and export behavior > COL-placements-R01 shows filters, factual drive activity and export actions

  ```
  AssertionError: expected '"use client";\n\nimport { useRef, use…' to contain 'Drives: {item.drives}'
  - Expected
  + Received
  - Drives: {item.drives}
  + "use client";
  +
  + import { useRef, useState } from "react";
  + import Link from "next/link";
  ```

## tests/unit/chat4-final-sprint-tpo-recruiters-b.test.ts (4 failing)
- chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-26 offers typed interactions and constrained call outcomes

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Log activity'
  - Expected
  + Received
  - Log activity
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
- chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-27 rejects past follow-ups and exposes quick scheduling choices

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '["Tomorrow",1]'
  - Expected
  + Received
  - ["Tomorrow",1]
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
- chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-29 renders safe missing-record responses, recovery and loading surfaces

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Dialog open={editing}'
  - Expected
  + Received
  - <Dialog open={editing}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { Banner } from "@/components/ui/banner";
  ```
- chat-4 final sprint TPO recruiter gaps B > TPO-recruiters-37 provides keyboard equivalents for inaccessible board dragging and focus-managed dialogs

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Dialog open={adding}'
  - Expected
  + Received
  - <Dialog open={adding}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat4-superadmin-college-one-canvas-audit.test.ts (4 failing)
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-01 directories have one page surface and unboxed search controls

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'flex flex-wrap items-end gap-3 border…'
  - Expected
  + Received
  - flex flex-wrap items-end gap-3 border-t border-border pt-4
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-02 tenant detail preserves archived states and scope-safe setup links on the same canvas

  ```
  AssertionError: expected 'import Link from "next/link";\n\nimpo…' to contain 'className="grid gap-4 border-t border…'
  - Expected
  + Received
  - className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2"
  + import Link from "next/link";
  +
  + import { collegeIdSchema } from "@/modules/colleges/validation";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-03 administrator directory keeps its role actions and empties without a nested card

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="College administrator dir…'
  - Expected
  + Received
  - aria-label="College administrator directory" className="border-t border-border pt-4"
  + import Link from "next/link";
  + import {DataTable} from "@/components/ui/data-table";
  + import {Tabs} from "@/components/ui/tabs";
  + import {Alert} from "@/components/ui/alert";
  ```
- Super Admin colleges/organizations canvas and page states > UX-COL-ONE-CANVAS-04 readiness separates major sections with dividers, never hiding unknown evidence

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'aria-label="Must fix before launch" c…'
  - Expected
  + Received
  - aria-label="Must fix before launch" className="min-w-0 space-y-3 border-t border-border pt-5"
  + import {Button} from "@/components/ui/button";
  + import {Select} from "@/components/ui/select";
  + import Link from "next/link";
  + import {parseSuperAdminReadinessParams,visibleReadinessChecks} from "@/modules/colleges/admin-readiness-filter";
  ```
