# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-workspaces-new-01.test.ts (2 failing)
- /college/projects/workspaces/new UX > UX-college-projects-workspaces-new-01 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'No published Project template is assi…'
  - Expected
  + Received
  - No published Project template is assigned to this college.
  + import {redirect} from "next/navigation";
  + /** Retain team-creation bookmarks; the canonical create page now offers
  +  * single, team and cohort workspace modes side by side.
  +  */
  ```
- /college/projects/workspaces/new UX > UX-college-projects-workspaces-new-02 preserves the new accessible state and responsive contract

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'href="/college/projects/templates"'
  - Expected
  + Received
  - href="/college/projects/templates"
  + import {redirect} from "next/navigation";
  + /** Retain team-creation bookmarks; the canonical create page now offers
  +  * single, team and cohort workspace modes side by side.
  +  */
  ```

## tests/unit/UX-courses-progress-report-tables-01.test.ts (2 failing)
- UX-courses-progress-report-tables-01 > college learner progress offers a scroll-cued shared table with measured progress and explicit empty state

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'aria-label={row.name+" progress"}'
  - Expected
  + Received
  - aria-label={row.name+" progress"}
  + "use client";
  + import Link from "next/link";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
- UX-courses-progress-report-tables-01 > faculty grade report retains score, timestamp, search and pagination on one responsive DataTable

  ```
  AssertionError: expected '"use client";\nimport {EmptyState} fr…' to contain 'rows={result.rows}'
  - Expected
  + Received
  - rows={result.rows}
  + "use client";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {useMemo,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/UX-mentor-all-pages-scope-02.test.ts (2 failing)
- UX-mentor-all-pages-scope-02 mentor page-state and scope coverage > loads /mentor via its scoped service and preserves its distinct UI state

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Projects could not be loaded'
  - Expected
  + Received
  - Projects could not be loaded
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
- UX-mentor-all-pages-scope-02 mentor page-state and scope coverage > loads /mentor/projects/[projectId]/timeline via its scoped service and preserves its distinct UI state

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'No matching registered Releases'
  - Expected
  + Received
  - No matching registered Releases
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  +
  ```

## tests/unit/UX-public-landing-coverage-02.test.ts (5 failing)
- chat-16 public route responsive and accessible state coverage > UX-enterprises-02 keeps labelled shared hero, navigation and a usable demo action

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Public navigation"'
  - Expected
  + Received
  - aria-label="Public navigation"
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import type { ReactNode } from "react";
  + import type { Metadata } from "next";
  ```
- chat-16 public route responsive and accessible state coverage > UX-universities-02 keeps labelled shared hero, navigation and a usable demo action

  ```
  AssertionError: expected 'import {MarketingLayout,MarketingHero…' to contain '<MarketingLayout>'
  - Expected
  + Received
  - <MarketingLayout>
  + import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta,marketingPageMetadata} from "@/components/marketing/marketing-layout";
  + const title="For Universities — 42 LMS";
  + const description="Develop employable graduates: evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness.";
  + // Legacy AI-only claims are intentionally retired. Layout/card/badge cardinality
  ```
- chat-16 public route responsive and accessible state coverage > UX-platform-02 keeps labelled shared hero, navigation and a usable demo action

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain '<MarketingLayout>'
  - Expected
  + Received
  - <MarketingLayout>
  + import type { Metadata } from "next";
  + import {
  +   MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta,
  + } from "@/components/marketing/marketing-layout";
  ```
- chat-16 public route responsive and accessible state coverage > UX-request-demo-02 is keyboard reachable and does not collect unprotected form data

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'href="mailto:'
  - Expected
  + Received
  - href="mailto:
  + import type { Metadata } from "next";
  + import { MarketingLayout } from "@/components/marketing/marketing-layout";
  +
  + const SITE = "https://42lms.com";
  ```
- chat-16 public route responsive and accessible state coverage > UX-company-share-token-02 retains selected-column filtering and nonleaking failure state

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'type="text" required inputMode="numer…'
  - Expected
  + Received
  - type="text" required inputMode="numeric"
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```

## tests/unit/UX-teacher-courses-deliveryid-coursetab-coverage-01.test.ts (1 failing)
- UX-teacher-courses-deliveryid-coursetab-01 /teacher/courses/[deliveryId]/[...courseTab] enforces page access and feedback contracts

  ```
  AssertionError: expected 'import { redirect,notFound } from "ne…' to contain 'redirect(facultyCourseTabHref(deliver…'
  - Expected
  + Received
  - redirect(facultyCourseTabHref(deliveryId, "home"))
  + import { redirect,notFound } from "next/navigation";
  + import {z} from "zod";
  + import {Banner} from "@/components/ui/banner";
  + import Link from "next/link";
  ```

## tests/unit/UX-teacher-profile-teaching-coverage-01.test.ts (1 failing)
- UX-teacher-profile-teaching-01 /teacher/profile/teaching keeps access and honest feedback

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' to contain '<PageHeader eyebrow="Faculty · Self P…'
  - Expected
  + Received
  - <PageHeader eyebrow="Faculty · Self Profile" title="Current teaching assignments"
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
