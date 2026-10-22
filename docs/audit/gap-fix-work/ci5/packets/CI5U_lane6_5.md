# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-round2-source-contracts.test.ts (10 failing)
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-10 source behavior or reviewed disposition

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Placement snapshot"'
  - Expected
  + Received
  - aria-label="Placement snapshot"
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-14 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'Search by title, company, location…'
  - Expected
  + Received
  - Search by title, company, location…
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-18 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\n\nimport { useCallback…' to contain 'All published drives summary'
  - Expected
  + Received
  - All published drives summary
  + "use client";
  +
  + import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
  + import {Disclosure} from "@/components/ui/disclosure";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-29 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'learnerWithdrawalMode'
  - Expected
  + Received
  - learnerWithdrawalMode
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-32 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'placeholder="Search company or role"'
  - Expected
  + Received
  - placeholder="Search company or role"
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-36 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\nimport { DateInput } f…' to contain 'Can\'t make it? Ask to reschedule'
  - Expected
  + Received
  - Can't make it? Ask to reschedule
  + "use client";
  + import { DateInput } from "@/components/ui/date-input";
  + import { Textarea } from "@/components/ui/textarea";
  + import { Select } from "@/components/ui/select";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-38 source behavior or reviewed disposition

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain '["coming","Coming up"]'
  - Expected
  + Received
  - ["coming","Coming up"]
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-44 source behavior or reviewed disposition

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'Need more time? Send a request to the…'
  - Expected
  + Received
  - Need more time? Send a request to the placement cell
  + import { Pagination } from "@/components/ui/pagination";
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-47 source behavior or reviewed disposition

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain '>Updated</span>'
  - Expected
  + Received
  - >Updated</span>
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-R05 source behavior or reviewed disposition

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'learnerWithdrawalMode'
  - Expected
  + Received
  - learnerWithdrawalMode
  + "use client";
  +
  + import Link from "next/link";
  + import { useCallback, useEffect, useRef, useState } from "react";
  ```

## tests/unit/mentor-resource-audit-update.test.ts (1 failing)
- keeps update resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"UPDATE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```

## tests/unit/projects-phase2-task-comments-contract.test.ts (1 failing)
- PR-S2-04 registered comments > scopes comments to project and task in a composite FK and real transaction

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'scope.access==="OBSERVER"'
  - Expected
  + Received
  - scope.access==="OBSERVER"
  + import "server-only";
  + import {and,asc,eq,inArray,isNull,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {activityEvents,projectInstances,projectTaskComments,projectTasks,projectMembers,collegeMemberships,users} from "@/db/schema";
  ```

## tests/unit/recruiter-company-team-scope.test.ts (2 failing)
- W05 recruiter company college scope > HR-TEAM-REVOKE-32 revalidates persisted recruiter and grant before disclosing colleagues

  ```
  AssertionError: expected 5898 to be less than -1
  ❯ tests/unit/recruiter-company-team-scope.test.ts:98:8
  96|     ])expect(scopeQuery).toContain(check);
  97|     expect(source.indexOf('if (!company) throw new AuthorizationError'…
  98|       .toBeLessThan(source.indexOf("const team = await db"));
  |        ^
  99|   });
  100|
  ```
- W05 recruiter company college scope > HR-TEAM-RECIPIENT-45 returns only verified and unexpired colleague contact grants

  ```
  AssertionError: expected '\n' to contain 'eq(placementRecruiterCollegeGrants.co…'
  - Expected
  + Received
  - eq(placementRecruiterCollegeGrants.companyRelationshipId, company.relationshipId)
  +
  +
  ```

## tests/unit/super-admin-colleges-navigation-parity.test.ts (2 failing)
- College setup links across responsive views > renders scoped tenant setup links in desktop and mobile

  ```
  AssertionError: expected 0 to be greater than or equal to 1
  ❯ tests/unit/super-admin-colleges-navigation-parity.test.ts:6:51
  4| describe("College setup links across responsive views",()=>{
  5|  it("renders scoped tenant setup links in desktop and mobile",()=>{
  6|   expect((src.match(/Tenant setup/g)||[]).length).toBeGreaterThanOrEqu…
  |                                                   ^
  7|   expect(src).toContain('mobilePriority: "action"');
  8|   expect(src).toContain("<DataTable columns={columns} rows={visible}");
  ```
- College setup links across responsive views > has both branding and readiness in mobile cards

  ```
  AssertionError: expected ',\n    header: "Actions",\n    classN…' to contain 'Tenant setup'
  - Expected
  + Received
  - Tenant setup
  + ,
  +     header: "Actions",
  +     className: "text-right",
  +     cell: (college) => (
  ```

## tests/unit/tpo-batches-25-chat5.test.ts (1 failing)
- TPO batch decision success and undo action > TPO-batches-25 displays server-issued Undo for saved learner and whole batch decisions

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain '<TpoBatchInlineDecision membershipId=…'
  - Expected
  + Received
  - <TpoBatchInlineDecision membershipId={s.membershipId} batchId={batchId}
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```

## tests/unit/tpo-drive-offer-register.test.ts (2 failing)
- offer register > counts versions, filters status and avoids invented joining

  ```
  AssertionError: expected { all: 3, selected: +0, …(7) } to deeply equal { Object (all, issued, ...) }
  - Expected
  + Received
  {
  "accepted": 2,
  "all": 3,
  "declined": 0,
  +   "expired": 0,
  ```
- offer register > exports matching versions with formula-safe names and explicit truncation

  ```
  AssertionError: expected +0 to be 5000 // Object.is equality
  - Expected
  + Received
  - 5000
  + 0
  ```

## tests/unit/tpo-notice-round4-verification.test.ts (4 failing)
- TPO placement announcement round-4 evidence > TPO-inbox-team-45 shows the audience count and guards zero recipients during compose

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '<TpoNoticeScheduleControls minDateTim…'
  - Expected
  + Received
  - <TpoNoticeScheduleControls minDateTime={formMinDateTime} count={audience?.potentiallyVisibleMemberships??null}
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```
- TPO placement announcement round-4 evidence > TPO-inbox-team-50 has the legacy modal and paired optional button input

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
- TPO placement announcement round-4 evidence > TPO-inbox-team-55 never echoes raw validation codes into the form

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```
- TPO placement announcement round-4 evidence > TPO-inbox-team-58 enforces title 200 and message 8000 on create and edit

  ```
  AssertionError: expected 'import "server-only";\nimport {z} fro…' to contain 'max(8000)'
  - Expected
  + Received
  - max(8000)
  + import "server-only";
  + import {z} from "zod";
  + import {placementTpoNoticeAudiences,placementTpoNoticeRecipients} from "@/db/schema/placement-tpo-notice-audiences";
  + import {freezeTpoNoticeRecipients} from "./tpo-notice-audience-snapshot-model";
  ```
