# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-projects-round2-gap-closure.test.ts (3 failing)
- learner/projects round-two gap verification > LEARNER-projects-04 supports legacy Active In progress Ready and Blocked status choices

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' to contain 'query.status==="IN_PROGRESS"'
  - Expected
  + Received
  - query.status==="IN_PROGRESS"
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- learner/projects round-two gap verification > LEARNER-projects-09 retains Projects as the list heading and the real workspace title

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'title={workspace.project.title}'
  - Expected
  + Received
  - title={workspace.project.title}
  + import { EmptyState } from "@/components/ui/empty-state";
  + import Link from "next/link";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- learner/projects round-two gap verification > LEARNER-projects-21 shows project team role explanation and roster count

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

## tests/unit/notification-providers.test.ts (2 failing)
- Exotel SMS provider > fails closed without credentials, with a bad number or a bad code

  ```
  AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
  Received:
  1st vi.fn() call:
  Array [
  "https://api.exotel.com/v1/Accounts/42students1/Sms/send.json",
  Object {
  "body": URLSearchParams {},
  "headers": Headers {},
  ```
- ZeptoMail provider > sends the OTP template with the legacy merge fields

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/public-auth-chooser-graceful-gap.test.ts (2 failing)
- public account chooser and failure handling > PUB-auth-public-08 restores last used active college as radio default

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain 'setSelectedId(memberships.some'
  - Expected
  + Received
  - setSelectedId(memberships.some
  + "use client";
  +
  + import {
  +   useEffect,
  ```
- public account chooser and failure handling > GR-91 retry and recovery buttons are keyboard-accessible

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'focus-visible'
  - Expected
  + Received
  - focus-visible
  + "use client";
  +
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/recruiter-home-drives-chat7-r7.test.ts (2 failing)
- chat-7 recruiter home and drives round 7 > REC-home-drives-34 confirms the audited source behavior

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '← Back to Drives'
  - Expected
  + Received
  - ← Back to Drives
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- chat-7 recruiter home and drives round 7 > REC-home-drives-50 confirms the audited source behavior

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Reply by'
  - Expected
  + Received
  - Reply by
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/unit/super-admin-organizations-empty.test.ts (2 failing)
- Super Admin organization directory > has a scoped empty state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'organizations.length===0'
  - Expected
  + Received
  - organizations.length===0
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```
- Super Admin organization directory > does not expose create form without permission

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'canCreate ? <section'
  - Expected
  + Received
  - canCreate ? <section
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { OrganizationActions } from "@/components/admin/organization-actions";
  + import {TenantRestoreAction} from "@/components/admin/tenant-restore-action";
  ```

## tests/unit/tpo-batches-53-chat5.test.ts (1 failing)
- TPO batch-specific placement rules > TPO-batches-53 persists strict batch overrides without altering registration lifecycle

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'getCollegePlacementRules'
  - Expected
  + Received
  - getCollegePlacementRules
  + import {PageHeader} from "@/components/ui/page-header";
  + import {batchRuleDate} from "@/modules/placements/tpo-batch-labels-model";
  + import {TpoBatchRuleEditor} from "@/components/tpo/tpo-batch-rule-editor";
  + import {tpoBatchRuleOverridesSchema} from "@/modules/placements/tpo-batch-rules-model";
  ```

## tests/unit/tpo-drive-workspace-r06-chat5.test.ts (1 failing)
- TPO drive draft cancellation parity > TPO-drive-workspace-R06 can cancel drafts with audited preview while published drives respect season

  ```
  AssertionError: expected 'import "server-only";\nimport { and, …' to contain 'job.status === "DRAFT" ||'
  - Expected
  + Received
  - job.status === "DRAFT" ||
  + import "server-only";
  + import { and, count, eq, inArray, sql } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  + import {placementDriveSelections} from "@/db/schema/placement-drive-selections";
  ```

## tests/unit/tpo-recruiter-invite-policy.test.ts (1 failing)
- W05 recruiter invite token and privacy policy > expires at exactly day 7, fails closed for future-issued or invalid-date token

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```
