# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-round2-legacy-navigation.test.ts (2 failing)
- Learner Placements legacy request/nav surfaces > LEARNER-placements-46 links announcements and personal updates separately

  ```
  AssertionError: expected 'import { Banner } from "@/components/…' to contain 'href="#college-notices"'
  - Expected
  + Received
  - href="#college-notices"
  + import { Banner } from "@/components/ui/banner";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  ```
- Learner Placements legacy request/nav surfaces > LEARNER-placements-55 provides all three anchored placement cell sections

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'id="registration"'
  - Expected
  + Received
  - id="registration"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/mentor-resource-audit-create.test.ts (1 failing)
- keeps create resource audit inside the project transaction with safe metadata

  ```
  AssertionError: expected '{"projectId":"project-a","resourceId"…' not to contain 'Reference'
  Expected: "Reference"
  Received: "{"projectId":"project-a","resourceId":"resource-a","resourceKey":"resource-a","actionType":"CREATE","beforeJson":null,"afterJson":{"title":"Reference =unsafe","sequence":null,"required":null,"visibility":null,"resourceType":null,"status":null,"pinned":null,"legacyResourceKind":null,"url":
  ```

## tests/unit/projects-phase2-restore-action.test.ts (1 failing)
- PR-S2-10 archived project recovery action > wires an optimistic timestamp-bearing restoration from admin summary

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'if (status === "ARCHIVED")'
  - Expected
  + Received
  - if (status === "ARCHIVED")
  + "use client";
  + import {useEffect,useRef,useState} from "react";
  + import {useRouter} from "next/navigation";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/recruiter-chat14-unconfirmed-decisions.test.ts (2 failing)
- chat-14 UNCONFIRMED recruiter owner decisions > REC-home-drives-09 treats pending invitations as unverified until an OTP-secured join

  ```
  AssertionError: expected 'import { recruiterAccessMonthsOrDefau…' to contain 'if (grant && grant.status === "REVOKE…'
  - Expected
  + Received
  - if (grant && grant.status === "REVOKED")
  + import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
  + import "server-only";
  +
  + import { createHash } from "node:crypto";
  ```
- chat-14 UNCONFIRMED recruiter owner decisions > REC-calendar-messages-profile-46 reuses verified existing-account join and never silently auto-accepts

  ```
  AssertionError: expected 'import { recruiterAccessMonthsOrDefau…' to contain 'outcome = "ALREADY_JOINED"'
  - Expected
  + Received
  - outcome = "ALREADY_JOINED"
  + import { recruiterAccessMonthsOrDefault } from "@/modules/placements/recruiter-access-defaults";
  + import "server-only";
  +
  + import { createHash } from "node:crypto";
  ```

## tests/unit/super-admin-colleges-empty-state.test.ts (1 failing)
- Super Admin college empty state > uses the authorized collection rather than a global unscoped count

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'q ? "No colleges match your search" :…'
  - Expected
  + Received
  - q ? "No colleges match your search" : "No active colleges in this scope"
  + import {Button} from "@/components/ui/button";
  + import {inArray,sql} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {collegeMemberships} from "@/db/schema";
  ```

## tests/unit/tpo-audit-actor-display.test.ts (1 failing)
- TPO-settings-audit-90 actor column > returns the display name without exposing internal UUIDs

  ```
  AssertionError: expected 'System' to be 'System / unknown' // Object.is equality
  Expected: "System / unknown"
  Received: "System"
  ```

## tests/unit/tpo-drive-next-step-model.test.ts (2 failing)
- TPO-drive-workspace-02 next step > prioritizes staged results before pending requests, sharing and closing

  ```
  AssertionError: expected 'Review 4 request(s)' to be 'Review and apply 6 result(s)' // Object.is equality
  Expected: "Review and apply 6 result(s)"
  Received: "Review 4 request(s)"
  ```
- TPO-drive-workspace-02 next step > does not invent shortlist or request counts when unavailable

  ```
  AssertionError: expected 'No action needed' to be 'Applicants' // Object.is equality
  Expected: "Applicants"
  Received: "No action needed"
  ```

## tests/unit/tpo-notice-audience-round4.test.ts (2 failing)
- TPO notice audience selection and graceful preview > TPO-inbox-team-44 chooses actual college-scoped batch branch and published-drive IDs, not typed UUIDs by default

  ```
  AssertionError: expected 'import "server-only";\nimport {and,as…' to contain 'eq(placementJobs.status,"PUBLISHED")'
  - Expected
  + Received
  - eq(placementJobs.status,"PUBLISHED")
  + import "server-only";
  + import {and,asc,eq,inArray,isNull} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  + import {cohorts,departments,placementJobs,programs} from "@/db/schema";
  ```
- TPO notice audience selection and graceful preview > TPO-inbox-team-45 keeps live preview and zero-recipient guards while using truthful student reach

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain '"Goes to "+audience.potentiallyVisibl…'
  - Expected
  + Received
  - "Goes to "+audience.potentiallyVisibleMemberships+" students
  + import { DateInput } from "@/components/ui/date-input";
  + import { Tabs } from "@/components/ui/tabs";
  + import {StatusBadge} from "@/components/ui/status-badge";
  + import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
  ```
