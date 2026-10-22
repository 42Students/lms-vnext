# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/tpo-drive-workspace-72-chat5.test.ts (1 failing)
- TPO drive mobile action layout > TPO-drive-workspace-72 renders collapsed mobile Actions and responsive applicant cards

  ```
  AssertionError: expected 'import { Dropdown } from "@/component…' to contain 'aria-label="Drive actions"'
  - Expected
  + Received
  - aria-label="Drive actions"
  + import { Dropdown } from "@/components/ui/dropdown";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import Link from "next/link";
  + import type { ReactNode } from "react";
  ```

## tests/unit/tpo-notifications-history-chat2.test.ts (2 failing)
- TPO Notifications history and refresh legacy fidelity > TPO-inbox-team-65 restores All (n), Latest n and legacy empty-state labels

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'allLabel={nextHref?"Latest "+items.le…'
  - Expected
  + Received
  - allLabel={nextHref?"Latest "+items.length:"All ("+items.length+")"}
  + import Link from "next/link";
  + import {TpoNotificationRefresh} from "@/components/tpo/tpo-notification-refresh";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- TPO Notifications history and refresh legacy fidelity > TPO-inbox-team-67 treats notifications over thirty days as read and keeps older-unread hints

  ```
  AssertionError: expected null to be an instance of Date
  ❯ tests/unit/tpo-notifications-history-chat2.test.ts:19:5
  17|   expect(now.getTime()-cutoff.getTime()).toBe(30*86400000);
  18|   expect(tpoEffectiveReadAt(null,new Date("2099-01-01T00:00:00.000Z"),…
  19|    .toBeInstanceOf(Date);
  |     ^
  20|   expect(tpoEffectiveReadAt(null,new Date("2099-12-30T00:00:00.000Z"),…
  21|   const page=src("src/app/(authenticated)/tpo/notifications/page.tsx");
  ```

## tests/unit/tpo-team-person-context-chat2.test.ts (1 failing)
- TPO team conversation and person context > TPO-inbox-team-31 shows You only for the active roster membership

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'member.membershipId===context.members…'
  - Expected
  + Received
  - member.membershipId===context.membership?.id
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/ux-admin-loading-recovery.test.ts (3 failing)
- UX-admin-classes-03 bounded loading

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import {PageHeader} from "@/components/ui/page-header";
  + /** Legacy Classes & Sections list loading: eight rows and eight columns. */
  + export default function Loading(){
  +  return <div className="min-w-0 space-y-6" role="status" aria-busy="true" aria-live="polite">
  ```
- UX-admin-companies-03 bounded loading

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'GracefulPageLoading'
  - Expected
  + Received
  - GracefulPageLoading
  + import {PageHeader} from "@/components/ui/page-header";
  + import {Skeleton} from "@/components/ui/skeleton";
  +
  + /** Legacy company directory: initial table skeleton rather than blocking the shell. */
  ```
- UX-admin-colleges-collegeId-branding-03 bounded loading

  ```
  AssertionError: expected 'import { GracefulPageLoading } from "…' to contain 'label="Loading branding preview…"'
  - Expected
  + Received
  - label="Loading branding preview…"
  + import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
  + import { PageHeader } from "@/components/ui/page-header";
  +
  + export default function CollegeBrandingPreviewLoading() {
  ```

## tests/unit/w03-project-admin-audit.test.ts (3 failing)
- W03 project admin audit parity contract > keeps both legacy account audit routes behind the Projects nav

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain '["/audit", "Audit"]'
  - Expected
  + Received
  - ["/audit", "Audit"]
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```
- W03 project admin audit parity contract > reads only PROJECTS activity and preserves legacy-style audit filters

  ```
  AssertionError: expected 'import { getCurrentRequestContext } f…' to contain 'parseProjectAdminAuditQuery(searchPar…'
  - Expected
  + Received
  - parseProjectAdminAuditQuery(searchParams)
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {type ReactNode} from "react";
  + import {ProjectAuditRefreshButton} from "@/components/projects/project-audit-filters";
  + import {StatusBadge} from "@/components/ui/status-badge";
  ```
- W03 project admin audit parity contract > requires college scope except for explicitly authorized global Super Admin template audit

  ```
  AssertionError: expected 'import { isSuperAdmin } from "@/modul…' to contain 'Select a college scope'
  - Expected
  + Received
  - Select a college scope
  + import { isSuperAdmin } from "@/modules/identity/context";
  + import { ErrorState } from "@/components/ui/error-state";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ProjectAdminAuditPage } from "@/components/projects/project-admin-audit-page";
  ```
