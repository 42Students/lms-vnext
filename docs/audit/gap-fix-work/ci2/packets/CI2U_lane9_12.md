# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-placements-chat7-hero-priority.test.ts (1 failing)
- learner placements next-action hero > LEARNER-placements-05 reads accepted offers from scoped server source

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'acceptedOffer={offerRows?offerRows.so…'
  - Expected
  + Received
  - acceptedOffer={offerRows?offerRows.some(row=>row.offer.status==="ACCEPTED"):null}
  + import { Alert } from "@/components/ui/alert";
  + import Link from "next/link";
  + import {LearnerGeneralRequests} from "@/components/placements/learner-general-requests";
  + import {placementTableExists} from "@/modules/placements/staged-tables";
  ```

## tests/unit/mentor-activity-round4.test.ts (1 failing)
- chat-11 mentor activity and resource parity > MEN-projects-meetings-61 humanizes activity type, category and empties

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'No project activity yet. Task moves'
  - Expected
  + Received
  - No project activity yet. Task moves
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/placement-calendar-model.test.ts (4 failing)
- Placement calendar view windows > uses Monday-first week boundaries

  ```
  AssertionError: expected '2026-10-11' to be '2026-10-12' // Object.is equality
  Expected: "2026-10-12"
  Received: "2026-10-11"
  ```
- Placement calendar view windows > includes adjacent month days in a 42-day grid

  ```
  AssertionError: expected '2026-09-27' to be '2026-09-28' // Object.is equality
  Expected: "2026-09-28"
  Received: "2026-09-27"
  ```
- Placement calendar view windows > uses the selected calendar month for agenda

  ```
  AssertionError: expected { from: '2026-02-14', …(2) } to deeply equal { from: '2026-02-01', …(2) }
  - Expected
  + Received
  {
  "days": [],
  -   "from": "2026-02-01",
  -   "to": "2026-02-28",
  +   "from": "2026-02-14",
  ```
- Placement calendar view windows > handles leap-year month boundaries

  ```
  AssertionError: expected '2028-03-30' to be '2028-02-29' // Object.is equality
  Expected: "2028-02-29"
  Received: "2028-03-30"
  ```

## tests/unit/public-auth-links-gap-closure.test.ts (6 failing)
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-56 company share carries who, when, expiry and disclosure warning

  ```
  AssertionError: expected 'import authStyles from "@/components/…' to contain 'Shared by {result.collegeName}'
  - Expected
  + Received
  - Shared by {result.collegeName}
  + import authStyles from "@/components/public/public-auth-skin.module.css";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
  ```
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-62 marketing home contains role audience and JSON-LD

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'Who the platform serves'
  - Expected
  + Received
  - Who the platform serves
  + import type { Metadata } from "next";
  + import Link from "next/link";
  + import {
  +   MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta,
  ```
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-63 platform overview describes talent and workforce development

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'One autonomous AI platform for talent…'
  - Expected
  + Received
  - One autonomous AI platform for talent and workforce development
  + import type { Metadata } from "next";
  + import {
  +   MarketingLayout, MarketingHero, MarketingFeatureGrid, MarketingCta,
  + } from "@/components/marketing/marketing-layout";
  ```
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-64 Universities landing has matching headline

  ```
  AssertionError: expected 'import {MarketingLayout,MarketingHero…' to contain 'Develop Employable Graduates with AI'
  - Expected
  + Received
  - Develop Employable Graduates with AI
  + import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta,marketingPageMetadata} from "@/components/marketing/marketing-layout";
  + const title="For Universities — 42 LMS";
  + const description="Develop employable graduates: evaluate performance across exams, assignments, projects, and interviews, identify gaps early, and improve career readiness.";
  + // Legacy AI-only claims are intentionally retired. Layout/card/badge cardinality
  ```
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-65 Enterprises landing has matching headline

  ```
  AssertionError: expected 'import type {Metadata} from "next";\n…' to contain 'Build High-Performing Workforces with…'
  - Expected
  + Received
  - Build High-Performing Workforces with AI
  + import type {Metadata} from "next";
  + import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta} from "@/components/marketing/marketing-layout";
  + const SITE="https://42lms.com";
  + const CANONICAL=SITE+"/enterprises";
  ```
- Public invite, share, marketing, privacy legacy gaps > PUB-auth-public-66 demo request has mailto action without collecting form data

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'mailto:hello@42lms.com'
  - Expected
  + Received
  - mailto:hello@42lms.com
  + import type { Metadata } from "next";
  + import { MarketingLayout } from "@/components/marketing/marketing-layout";
  +
  + const SITE = "https://42lms.com";
  ```

## tests/unit/recruiter-home-drives-chat7-drafts-r7.test.ts (2 failing)
- chat-7 recruiter drive request legacy safety > REC-home-drives-27 matches the reviewed contract

  ```
  AssertionError: expected 'import { z } from "zod";\nimport { sa…' to contain 'rounds: z.array(round).max(12)'
  - Expected
  + Received
  - rounds: z.array(round).max(12)
  + import { z } from "zod";
  + import { safeRecruiterExternalLink } from "./recruiter-applicant-shared-links-model";
  +
  + export const hrDriveDraftQuerySchema = z.strictObject({
  ```
- chat-7 recruiter drive request legacy safety > REC-home-drives-32 matches the reviewed contract

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Discard this drive draft?'
  - Expected
  + Received
  - Discard this drive draft?
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { useToast } from "@/components/ui/toast";
  ```

## tests/unit/super-admin-dashboard-navigation.test.ts (1 failing)
- Super Admin dashboard global vs college navigation > has no disabled placeholders for existing global routes

  ```
  AssertionError: expected [ 'Tenant setup', …(3) ] to deeply equal [ 'Tenant Setup', …(3) ]
  - Expected
  + Received
  [
  -   "Tenant Setup",
  +   "Tenant setup",
  +   "Feature controls",
  +   "Activity log",
  ```
