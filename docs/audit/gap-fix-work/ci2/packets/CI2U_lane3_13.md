# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/t-s2-08-publication-navigation.test.ts (1 failing)
- T-S2-08 public publishing remains a scoped TPO setting > keeps the new setting reachable

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/tpo-confirmed-round-result.test.ts (1 failing)
- confirmed TPO round results > never equates a staged result to an applied result

  ```
  AssertionError: expected 'Pass' to contain 'Shortlisted'
  Expected: "Shortlisted"
  Received: "Pass"
  ```

## tests/unit/tpo-home-31-new-followup.test.ts (1 failing)
- TPO-home-31 quick-create follow-up modal > uses the pre-existing scoped leads and calendar follow-up routes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain '"/api/placements/tpo/leads?collegeId=…'
  - Expected
  + Received
  - "/api/placements/tpo/leads?collegeId="+encodeURIComponent(collegeId)
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/tpo-spreadsheet-mounted-surfaces.test.ts (1 failing)
- TPO spreadsheet mounted on authorized Students and Applications > mounts real reusable grid and URL filter panel on both canonical TPO pages

  ```
  AssertionError: expected '"use client";\nimport {Checkbox} from…' to contain '<TpoGridFilterPanel'
  - Expected
  + Received
  - <TpoGridFilterPanel
  + "use client";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/ux-admin-chat9-batch-02.test.ts (3 failing)
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import { Badge } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Badge } from "@/components/ui/badge";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-template-id-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import Link from "next/link";
  +
  + import { ProjectsServiceError } from "@/modules/projects/errors";
  ```
- chat-9 last-third admin UX rollout, batch 02 > UX-admin-projects-templates-template-id-colleges-01 preserves verified shared UX contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { resolveTemplateCollegeLegacyId, TemplateCollegeReadError } from "@/modules/projects/template-college-availability-service";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```

## tests/unit/ux-chat7-final-six.test.ts (5 failing)
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-learn-learn-projects-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import { z } from "zod";\nimport Link…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { z } from "zod";
  + import Link from "next/link";
  + import { Banner } from "@/components/ui/banner";
  + import { redirect } from "next/navigation";
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-learn-learn-projects-projectId-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import { getProjectActivityPage } fro…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { getProjectActivityPage } from "@/modules/projects/activity-service";
  + import { parseLearnerProjectActivityFilters } from "@/modules/projects/learner-project-activity-filter-model";
  + import { LearnerProjectActivity } from "@/components/projects/learner-project-activity";
  + import { notFound, redirect } from "next/navigation";
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-quiz-quiz-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import Link from "next/link";
  + import type { Metadata, Viewport } from "next";
  + export const metadata: Metadata = { title: "42Learn <-> Quiz", icons: {icon:"/assets/images/legacy-42lms-logo.svg"} };
  + export const viewport: Viewport = { viewportFit:"cover" };
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-dashboard-dashboard-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {getSuperAdminCollegeAtGlance} from "@/modules/colleges/admin-college-at-glance-service";
  + import {CollegeAtGlancePanel} from "@/components/admin/college-at-glance-panel";
  + import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
  ```
- Signed-off UX rollout: learner, quiz, dashboard, notifications > UX-notifications-notifications-01 preserves real route and accessible states

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { NotificationList, type NotificationListItem } from "@/components/activity/notification-list";
  + import { NotificationToolbar } from "@/components/activity/notification-toolbar";
  ```
