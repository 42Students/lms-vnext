# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-profile-round9-13.test.ts (1 failing)
- lists every actual Faculty self-profile editor exactly once with stable anchors

  ```
  AssertionError: expected 13 to be 12 // Object.is equality
  - Expected
  + Received
  - 12
  + 13
  ```

## tests/unit/learner-placements-chat7-followup.test.ts (1 failing)
- Chat-7 learner placements follow-up > LEARNER-placements-04 never masks missing actionable tasks

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Waiting on you"'
  - Expected
  + Received
  - aria-label="Waiting on you"
  + import Link from "next/link";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import type { learnerPlacementDashboard } from "@/modules/placements/learner-dashboard-model";
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

## tests/unit/tpo-bell-notification-ack-chat2.test.ts (1 failing)
- TPO notification click acknowledgement > TPO-inbox-team-64 and GR-71 only navigate after a successful bounded acknowledgement

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'if (acknowledged && openHref) router.…'
  - Expected
  + Received
  - if (acknowledged && openHref) router.push(openHref)
  + "use client";
  +
  + import Link from "next/link";
  + import {Dialog} from "@/components/ui/dialog";
  ```
