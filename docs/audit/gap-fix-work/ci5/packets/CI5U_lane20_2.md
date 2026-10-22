# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-SA-placements-projects-117-export-evidence.test.ts (1 failing)
- SA-placements-projects-117 export and Claude report > SA-placements-projects-117 only exports bounded pages and never claims unrestricted completeness

  ```
  ReferenceError: rows is not defined
  ❯ tests/unit/chat16-SA-placements-projects-117-export-evidence.test.ts:37:42
  35|   expect(source).toContain("for(let i=0;i<20;i++)");
  36|   expect(source).toContain("not claimed complete when the 240-entry ex…
  37|   expect(source).toContain("Downloaded "+rows.length+" log entries.");
  |                                          ^
  38|   expect(source).toContain("No matching log entries to download.");
  39|   expect(source).toContain("Report for Claude");
  ```

## tests/unit/chat16-public-marketing-forbidden-pages-16.test.tsx (4 failing)
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-home-01 offers functional, named destinations without requiring an account

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'href="/home"'
  - Expected
  + Received
  - href="/home"
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-universities-02 provides a campus-specific overview and next step

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'For universities'
  - Expected
  + Received
  - For universities
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-enterprises-03 reaches hiring and learning overviews without login

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'For enterprises'
  - Expected
  + Received
  - For enterprises
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-demo-04 retains explicit contact and no hidden form submission

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'href="mailto:hello@42lms.com?subject=…'
  Expected: "href="mailto:hello@42lms.com?subject=42%20LMS%20demo%20request""
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","u
  ```

## tests/unit/chat19-college-hiring-funnel-mobile.test.tsx (2 failing)
- UX-SPILL-COL-FUNNEL-01: college hiring report phone and zero-state rendering > renders all ten stage metrics and names via shared responsive DataTable cards

  ```
  
  ```
- UX-SPILL-COL-FUNNEL-01: college hiring report phone and zero-state rendering > an authorized empty portfolio has explicit no-data copy but no invented employer row

  ```
  Error: invariant expected app router to be mounted
  ❯ useRouter node_modules/next/src/client/components/navigation.ts:169:11
  ❯ CollegeHiringFunnel src/components/placements/college-hiring-funnel.tsx:23:15
  21|  data:Funnel;selectedSeasonId:string|null;selectedJobId:string|null;
  22| }){
  23|  const router=useRouter();
  |               ^
  24|  const q=data.query;
  ```

## tests/unit/chat2-final-sprint-recruiter-profile-company.test.ts (8 failing)
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-32 provides scoped company name, safe website, domain, industry fallback and initials

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'Industry not set'
  - Expected
  + Received
  - Industry not set
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-35 distinguishes verified report status buckets and never counts withdrawals as offers

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain '"Offered"'
  - Expected
  + Received
  - "Offered"
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-36 matches legacy recruiter company header label without CSS changes

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'description={"Your work with " + resu…'
  - Expected
  + Received
  - description={"Your work with " + result.grant.collegeName}
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-41 keeps verified invite email read-only and discloses permission-bounded student access

  ```
  AssertionError: expected 'import type { ComponentPropsWithRef }…' to contain '<input data-slot="input"'
  - Expected
  + Received
  - <input data-slot="input"
  + import type { ComponentPropsWithRef } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type InputProps = ComponentPropsWithRef<"input"> & { error?: boolean };
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-30 independent final-sprint acceptance regression

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'method: "DELETE", credentials: "same-…'
  - Expected
  + Received
  - method: "DELETE", credentials: "same-origin"
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-32 independent final-sprint acceptance regression

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'Industry not set'
  - Expected
  + Received
  - Industry not set
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-35 independent final-sprint acceptance regression

  ```
  AssertionError: expected 'import { SummaryStrip } from "@/compo…' to contain 'job.outstandingOffers+job.acceptedOff…'
  - Expected
  + Received
  - job.outstandingOffers+job.acceptedOffers+job.declinedOffers
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Tabs } from "@/components/ui/tabs";
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import funnelStyles from "@/components/hr/recruiter-report-funnel.module.css";
  ```
- Final sprint recruiter profile/company verification > REC-calendar-messages-profile-36 independent final-sprint acceptance regression

  ```
  AssertionError: expected 'import {NeedsDoingChips} from "@/comp…' to contain 'description={"Your work with " + resu…'
  - Expected
  + Received
  - description={"Your work with " + result.grant.collegeName}
  + import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
  + import {getDb} from "@/db/client";
  + import {placementCompanies} from "@/db/schema";
  + import {eq} from "drizzle-orm";
  ```

## tests/unit/chat2-tpo-member-workload-parity.test.ts (1 failing)
- TPO Team People persisted workloads > TPO-inbox-team-31 shows real drive, company, overdue follow-up and waiting-on-teammate numbers

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'readTpoTeamOwnershipWorkload(context)'
  - Expected
  + Received
  - readTpoTeamOwnershipWorkload(context)
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { hasPlacementTeamMembership } from "@/modules/placements/placement-team-access-model";
  + import { hasMembershipRole } from "@/modules/identity/context";
  ```

## tests/unit/chat3-faculty-live-classes-scaled-service.test.ts (1 failing)
- FAC-LIVE-SCALE-01 Faculty live classes bounded Section reads > preserves ordering of 20 Sections while never opening more than 8 reads at once

  ```
  AssertionError: expected 6 to be 8 // Object.is equality
  - Expected
  + Received
  - 8
  + 6
  ```

## tests/unit/chat4-college-admin-academics-contacts-role-journey.test.ts (1 failing)
- College Admin people and academic journey security > COL-ADMIN-JOURNEY-04 contacts page gates role before reads and maintains masked student CSV, partial, empty and recovery

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'Faculty contacts'
  - Expected
  + Received
  - Faculty contacts
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-college-ux-round6.test.ts (6 failing)
- Chat-4 College UX round six > UX-college-faculty-membershipId-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import {and,eq} from "drizzle-orm";
  + import {getDb} from "@/db/client";
  ```
- Chat-4 College UX round six > UX-college-faculty-import-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import {redirect} from "next/navigati…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import {redirect} from "next/navigation";
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {requirePermission} from "@/modules/permissions/policy";
  ```
- Chat-4 College UX round six > UX-college-groups-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import { Pagination } from "@/components/ui/pagination";
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- Chat-4 College UX round six > UX-college-groups-groupId-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { DataTable } from "@/components/ui/data-table";
  ```
- Chat-4 College UX round six > UX-college-groups-groupId-import-preview-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import {PageBackLink} from "@/compone…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import {PageBackLink} from "@/components/ui/page-back-link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeGroupImportPreview } from "@/components/groups/college-group-import-preview";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- Chat-4 College UX round six > UX-college-groups-groupId-rule-preview-01 keeps narrow-screen routes usable

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'min-w-0 overflow-x-clip space-y'
  - Expected
  + Received
  - min-w-0 overflow-x-clip space-y
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
