# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-bell-notification-ack-chat2.test.ts (1 failing)
- TPO notification click acknowledgement > TPO-inbox-team-64 and GR-71 only navigate after a successful bounded acknowledgement

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'if (acknowledged && openHref) router.…'
  - Expected
  + Received
  - if (acknowledged && openHref) router.push(openHref)
  + "use client";
  +
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
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
  + import { Textarea } from "@/components/ui/textarea";
  + import { Checkbox } from "@/components/ui/checkbox";
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

## tests/unit/tpo-secondary-nav-reachability.test.ts (1 failing)
- TPO exact sidebar groups and secondary route reachability > preserves companies as an Engage tab and keeps the ten legacy Settings sections

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/ui-color-parity.test.ts (2 failing)
- first UI batch color parity > does not introduce replacement Tailwind brand palettes

  ```
  AssertionError: expected 'import type { ComponentPropsWithRef }…' not to contain 'slate-'
  - Expected
  + Received
  - slate-
  + import type { ComponentPropsWithRef } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type ButtonProps = ComponentPropsWithRef<"button"> & {
  ```
- first UI batch color parity > uses the canonical LMS semantic token utilities

  ```
  AssertionError: expected 'import type { ComponentPropsWithRef }…' to contain 'bg-primary'
  - Expected
  + Received
  - bg-primary
  + import type { ComponentPropsWithRef } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type ButtonProps = ComponentPropsWithRef<"button"> & {
  ```

## tests/unit/ux-chat14-mentor-quality-04c.test.ts (5 failing)
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-meetings-meetingId-notes-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-resources-directory-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-review-completeness-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {EmptyState} from "@/components/ui/empty-state";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-review-overview-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04c > UX-mentor-projects-projectId-risk-readiness-02 checks accessible visible link text and controls

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
