# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/inbound-mail-message-model.test.ts (1 failing)
- inbound mail search > rejects unknown filters and unbounded pages

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/learner-schedule-parity.test.ts (1 failing)
- learner class schedule parity surface > keeps the dedicated learner calendar route and shell destination

  ```
  AssertionError: expected '"use client";\nimport { Input } from …' to contain 'aria-label="Next upcoming classes"'
  - Expected
  + Received
  - aria-label="Next upcoming classes"
  + "use client";
  + import { Input } from "@/components/ui/input";
  + import { CalendarGrid } from "@/components/ui/calendar-grid";
  + import calendarStyles from "@/components/placements/legacy-calendar-theme.module.css";
  ```

## tests/unit/sa-tenants-modules-20-primary-domain-transition.test.ts (1 failing)
- SA-tenants-modules-20 clears any former primary before promoting managed address

  ```
  AssertionError: expected 'if(current){\n   await tx.update(tena…' to contain 'eq(tenantDomains.isPrimary,true)'
  - Expected
  + Received
  - eq(tenantDomains.isPrimary,true)
  + if(current){
  +    await tx.update(tenantDomains).set({
  +     deletedAt:now,isPrimary:false,isVerified:false,verificationToken:null,
  +     updatedAt:now,lastCheckResult:"MANAGED_RETIRED",
  ```

## tests/unit/tpo-drives-chat-3-round4.test.ts (7 failing)
- chat-3 Drives round 4 > TPO-drives-04 review-first default and persistent badge counts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-current={data.view===view?"page"…'
  - Expected
  + Received
  - aria-current={data.view===view?"page":undefined}
  + import Link from "next/link";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-3 Drives round 4 > TPO-drives-49 non-editable drive points to safe clone recovery

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'This drive is not editable'
  - Expected
  + Received
  - This drive is not editable
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
- chat-3 Drives round 4 > TPO-drives-R03 preflight shows nonblocking rounds and eligibility warnings

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'No eligibility rules set - every regi…'
  - Expected
  + Received
  - No eligibility rules set - every registered student will see this drive
  + "use client";
  +
  + import {
  +   useState,
  ```
- chat-3 Drives round 4 > TPO-drives-26 Create drive now provides a scoped clone-past picker

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain '<TpoDriveCloneAction jobId={job.id}'
  - Expected
  + Received
  - <TpoDriveCloneAction jobId={job.id}
  + import { Disclosure } from "@/components/ui/disclosure";
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  ```
- chat-3 Drives round 4 > TPO-drives-22 creation and edit wording matches the familiar drive actions

  ```
  AssertionError: expected 'import { Disclosure } from "@/compone…' to contain 'Back to drives'
  - Expected
  + Received
  - Back to drives
  + import { Disclosure } from "@/components/ui/disclosure";
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import {and,desc,eq,inArray,isNull,sql} from "drizzle-orm";
  ```
- chat-3 Drives round 4 > GR-04 TPO-drives-22 edit action never surfaces a raw API error code

  ```
  AssertionError: expected '"use client";\nimport { DateInput } f…' to contain 'await apiFetch('
  - Expected
  + Received
  - await apiFetch(
  + "use client";
  + import { DateInput } from "@/components/ui/date-input";
  + import type {getTpoDriveEditState} from "@/modules/placements/tpo-drive-edit-service";
  + import { Textarea } from "@/components/ui/textarea";
  ```
- chat-3 Drives round 4 > TPO-drives-49 closed drive has immutable explanation, clone path and retriable read boundary

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'This drive is closed: nothing here ca…'
  - Expected
  + Received
  - This drive is closed: nothing here can be changed.
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  ```
