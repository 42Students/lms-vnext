# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-43-chat5.test.ts (1 failing)
- TPO learner override parity > TPO-batches-43 shows the exact six private ineligibility reasons and guarded Undo

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '>Other</button>'
  - Expected
  + Received
  - >Other</button>
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
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

## tests/unit/tpo-team-legacy-people-chat2.test.ts (2 failing)
- TPO People roster legacy copy > TPO-inbox-team-37 stops representing historical drive-day coordinators as permanent team members

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.roles.includes("TPO_ADMIN")'
  - Expected
  + Received
  - member.roles.includes("TPO_ADMIN")
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- TPO People roster legacy copy > TPO-inbox-team-32 keeps the number of displayed team members consistent with the filtered roster

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'sortTpoPeople(activeTeam.map(member=>…'
  - Expected
  + Received
  - sortTpoPeople(activeTeam.map(member=>({
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-chat9-scroll-motion.test.ts (8 failing)
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-01 /admin/projects/templates/[templateId]/versions/[versionId] comparison is keyboard scrollable with a vertical edge

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain '[mask-image:linear-gradient(to_bottom…'
  - Expected
  + Received
  - [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-02 /admin/settings high-impact confirmation and outcome lists use named, bounded scroll regions

  ```
  AssertionError: expected undefined to be 2 // Object.is equality
  - Expected:
  2
  + Received:
  undefined
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-03 /admin/students import history dialog and table respect dvh and horizontal scroll cues

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain '100dvh-2rem'
  - Expected
  + Received
  - 100dvh-2rem
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-05 /admin/projects/templates/[templateId]/resources shared subview tables reveal more columns

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import {desc,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-07 /admin/projects/workspaces/new creator preflight and results have vertical cues

  ```
  AssertionError: expected 1 to be 2 // Object.is equality
  - Expected
  + Received
  - 2
  + 1
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-08 /admin/projects/templates/[templateId] tab strip peeks to its remaining links

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'aria-label="Project template sections"'
  - Expected
  + Received
  - aria-label="Project template sections"
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import {
  +   TEMPLATE_SUBVIEW_TABS,
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-10 all audited custom cues avoid hardcoded duration and animation of layout size

  ```
  AssertionError: expected '@import "tailwindcss";\n@source not "…' to contain '--lms-motion-base: 200ms'
  - Expected
  + Received
  - --lms-motion-base: 200ms
  + @import "tailwindcss";
  + @source not "../../docs";
  + @source not "../../scripts";
  + @source not "../../tests";
  ```
- chat-9 last-third scroll and motion: hidden scrollbars require visible cues > UX-admin-scroll-motion-12 /admin/students bulk selection gives 25 learners a scroll cue and full touch targets

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```

## tests/unit/w03-db07-source-contract.test.ts (1 failing)
- W03 DB07 staged schema/source-contract (NOT SQL replay) > keeps each staged child constrained to the same project as its parent

  ```
  AssertionError: expected '/**\n * W03 DB07 schema candidates. M…' to contain 'name:"project_resource_audit_project_…'
  - Expected
  + Received
  - name:"project_resource_audit_project_fk"
  + /**
  +  * W03 DB07 schema candidates. Meeting/resource audits promoted by 0196;
  +  * run against live endpoints or assume tables exist until W01 registers/replays
  +  * the corresponding Drizzle migration and verifies composite tenant/project FKs.
  ```
