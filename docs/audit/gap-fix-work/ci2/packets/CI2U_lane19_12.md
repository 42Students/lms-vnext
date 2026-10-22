# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-round2-source-contracts.test.ts (11 failing)
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
- Chat-7 learner placement verified-closure source contracts > LEARNER-placements-37 source behavior or reviewed disposition

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'Join online round'
  - Expected
  + Received
  - Join online round
  + import { Tabs } from "@/components/ui/tabs";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { AuthorizationError } from "@/modules/permissions/policy";
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
- … 1 more in this file

## tests/unit/mentor-resource-audit-create.test.ts (1 failing)
- keeps create resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"CREATE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```

## tests/unit/projects-phase2-exact-tabs.test.ts (1 failing)
- Phase2 exact legacy Projects labels + single tab strip > has one workspace-level Admin tab strip, not the list-level strip too

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'ProjectAdminNav'
  - Expected
  + Received
  - ProjectAdminNav
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {isSuperAdmin} from "@/modules/identity/context";
  ```

## tests/unit/recruiter-chat14-message-email-bridge-contract.test.ts (1 failing)
- REC-calendar-messages-profile-R01 mail bridge deployment and scope > REC-calendar-messages-profile-R01 persists reminder cooldown and reply token hashes only after provider success

  ```
  AssertionError: expected 'import "server-only";\nimport {create…' to contain 'if(!accepted)return false'
  - Expected
  + Received
  - if(!accepted)return false
  + import "server-only";
  + import {createHash} from "node:crypto";
  + import {and,count,desc,eq,isNull,lt,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```

## tests/unit/sa-tenants-modules-24-branding-activity.test.ts (1 failing)
- SA-tenants-modules-24 puts the branding event in the same mutation transaction

  ```
  AssertionError: expected 'import { and, eq, sql } from "drizzle…' to match /metadata:\s*\{\s*version:\s*row\.vers…/
  - Expected:
  /metadata:\s*\{\s*version:\s*row\.version\s*\}/
  + Received:
  "import { and, eq, sql } from \"drizzle-orm\";
  import { getDb } from \"@/db/client\";
  import { collegeBranding, colleges } from \"@/db/schema\";
  import {isSuperAdmin,type RequestContext} from \"@/modules/identity/context\";
  ```

## tests/unit/super-admin-tracker-active-route-guards.test.ts (1 failing)
- DB10 tracker Super Admin active account route fences > checks an active actor before trackerAdminRuntimeEnabled() in src/app/(authenticated)/tracker/issues/…

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to match /platformStatus\s*!==\s*"ACTIVE"/
  - Expected:
  /platformStatus\s*!==\s*"ACTIVE"/
  + Received:
  "import Link from \"next/link\";
  import { redirect } from \"next/navigation\";
  import { getCurrentRequestContext } from \"@/auth/request-context\";
  import { TrackerAdminNav } from \"@/components/tracker/tracker-admin-nav\";
  ```
