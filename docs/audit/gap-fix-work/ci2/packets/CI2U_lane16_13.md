# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-batches-chat5-next-round.test.ts (5 failing)
- TPO Batches next-round source and behavioral gap closure > TPO-batches-52 displays learner decision, source and five registration choices as human terms

  ```
  AssertionError: expected 'import {Button} from "@/components/ui…' to contain 'batchRegistrationLabel(s.registration…'
  - Expected
  + Received
  - batchRegistrationLabel(s.registration.choice)
  + import {Button} from "@/components/ui/button";
  + import {Disclosure} from "@/components/ui/disclosure";
  + import {Badge} from "@/components/ui/badge";
  + import {DataTable} from "@/components/ui/data-table";
  ```
- TPO Batches next-round source and behavioral gap closure > TPO-batches-40 uses the expected legacy import heading and confirm button

  ```
  AssertionError: expected '"use client";\nimport { Tabs } from "…' to contain '>Confirm matched decisions</button>'
  - Expected
  + Received
  - >Confirm matched decisions</button>
  + "use client";
  + import { Tabs } from "@/components/ui/tabs";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
- TPO Batches next-round source and behavioral gap closure > GR-04 GR-30 GR-32 prevent raw errors and double submissions in batch decision editor

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Textarea} from "@/components/ui/textarea";
  + import {Select} from "@/components/ui/select";
  ```
- TPO Batches next-round source and behavioral gap closure > TPO-batches-50 has a complete keyboard-safe loading and recovery state

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'aria-busy="true"'
  - Expected
  + Received
  - aria-busy="true"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  + export default function Loading(){return <div className="min-w-0 space-y-4"><PageHeader title="Batch students"/><GracefulPageLoading label="Loading batch students" shape="directory"/></div>}
  +
  ```
- TPO Batches next-round source and behavioral gap closure > GR-35 GR-90 avoids native confirmation and exposes an alert for failed batch undo

  ```
  AssertionError: expected '"use client";\nimport { Checkbox } fr…' to contain 'type="checkbox"'
  - Expected
  + Received
  - type="checkbox"
  + "use client";
  + import { Checkbox } from "@/components/ui/checkbox";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
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

## tests/unit/tpo-team-workload-chat2.test.ts (2 failing)
- Team workload sorting > TPO-inbox-team-31 uses only scoped OPEN ask records for real per-person workload

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'workloadByMember.get(member.membershi…'
  - Expected
  + Received
  - workloadByMember.get(member.membershipId)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```
- Team workload sorting > TPO-inbox-team-22 exposes ask status in People without fabricating work for other colleges

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain '"Overdue first"'
  - Expected
  + Received
  - "Overdue first"
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-chat14-hr-02.test.ts (2 failing)
- chat-14 HR UX rollout batch 02 > UX-hr-hr-drives-jobId-rounds-editor-remove-roundId-01 guards recruiter responsive page source

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'min-w-0 max-w-full'
  - Expected
  + Received
  - min-w-0 max-w-full
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {notFound,redirect} from "next/navigation";
  + import {z} from "zod";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- chat-14 HR UX rollout batch 02 > UX-hr-hr-placements-jobs-jobId-01 guards recruiter responsive page source

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<DataTable'
  - Expected
  + Received
  - <DataTable
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```

## tests/ux-playbook-primitives.test.tsx (3 failing)
- UX playbook shared behaviour > UX-PLAYBOOK-05 exposes mobile cards and semantic desktop table

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'sm:table-row'
  Expected: "sm:table-row"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
- UX playbook shared behaviour > RV-05 B-02 keeps hidden fields in More details without audited column mapping

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'More details'
  Expected: "More details"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
- UX playbook shared behaviour > RV-05 B-02 requires positive per-row detail authority to hide a field

  ```
  AssertionError: expected '<div data-slot="data-table" class="mi…' to contain 'More details'
  Expected: "More details"
  Received: "<div data-slot="data-table" class="min-w-0"><div data-slot="scroll-cue" data-axis="x" data-scroll-start="false" data-scroll-end="false" class="relative min-w-0 min-w-0 md:rounded-[var(--lms-radius-md)] md:border md:border-[var(--lms-canvas-border)]"><div tabindex="-1" class="min-w-0 overf
  ```
