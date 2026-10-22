# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/learner-quiz-shuffle-model.test.ts (1 failing)
- LEARNER-learning-misc-26 learner-question and option shuffle > does not shuffle when both flags are off and leaves scoring identity unchanged

  ```
  AssertionError: expected [ { id: 'q0', …(5) }, …(9) ] to deeply equal [ { id: 'q0', …(5) }, …(9) ]
  - Expected
  + Received
  @@ -1,47 +1,40 @@
  [
  {
  "id": "q0",
  "options": [
  ```

## tests/unit/nsrit-migration-academics.test.ts (1 failing)
- buildAcademicsPlan on a synthetic snapshot > loads quiz attempts as SUBMITTED history with prompt and option snapshots

  ```
  AssertionError: expected [ Array(1) ] to have a length of 2 but got 1
  - Expected
  + Received
  - 2
  + 1
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

## tests/unit/recruiter-home-drives-chat7-tab-legacy.test.ts (2 failing)
- Recruiter Home Drives legacy recruiter tabs > REC-home-drives-55 orders overview, applicant, round, offer, request and discussion tabs

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '["overview", "applicants", "rounds", …'
  - Expected
  + Received
  - ["overview", "applicants", "rounds", "offers"]
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-drive-funnel.module.css";
  + import { Button } from "@/components/ui/button";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  ```
- Recruiter Home Drives legacy recruiter tabs > REC-home-drives-20 preserves the originating Drives filters on workspace tabs

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

## tests/unit/super-admin-semesters-read.test.ts (1 failing)
- Super Admin semester read URL > rejects malformed/duplicated filters and never accepts forged college overrides

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/tpo-batches-61-chat5.test.ts (1 failing)
- batch overview undo discovery > TPO-batches-61 shows a discoverable header undo with current decision tooltip

  ```
  AssertionError: expected -1 to be greater than 0
  ❯ tests/unit/tpo-batches-61-chat5.test.ts:9:18
  7|   const undo=s.indexOf("Undo last decision",header);
  8|   const sections=s.indexOf('<section aria-label="Batch eligibility sna…
  9|   expect(header).toBeGreaterThan(0);
  |                  ^
  10|   expect(undo).toBeGreaterThan(header);
  11|   expect(undo).toBeLessThan(sections);
  ```

## tests/unit/tpo-drive-workspace-s1-gap-closure.test.ts (2 failing)
- TPO drive workspace verified S1 gaps > TPO-drive-workspace-60 validates scoped two-way field changes and decision acknowledgements

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```
- TPO drive workspace verified S1 gaps > TPO-drive-workspace-62 displays source-backed deal category and company compensation without guessing dates

  ```
  AssertionError: expected 'Open' to be 'Published' // Object.is equality
  Expected: "Published"
  Received: "Open"
  ```

## tests/unit/tpo-recruiters-08-stage-fallback.test.ts (1 failing)
- TPO-recruiters-08 legacy inferred execution stages > includes every same-company drive even when legacy names map to multiple relationships

  ```
  AssertionError: expected 'NEW' to be 'RECRUITED' // Object.is equality
  Expected: "RECRUITED"
  Received: "NEW"
  ```
