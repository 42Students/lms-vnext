# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-mutation-routes-guard.test.ts (3 failing)
- chat-13 Super Admin mutation route CSRF and error boundary contracts > SA-ADMIN-ROUTE src/app/api/admin/placements/jobs/[jobId]/edit-published/route.ts: origin rejection precedes any untrusted JSON or mutation

  ```
  AssertionError: expected -1 to be greater than 64
  ❯ tests/unit/chat13-super-admin-mutation-routes-guard.test.ts:34:17
  32|    const json=body.indexOf("request.json()");
  33|    expect(origin).toBeGreaterThan(0);
  34|    expect(json).toBeGreaterThan(origin);
  |                 ^
  35|    expect(body).toMatch(/403|INVALID_ORIGIN/);
  36|    expect(body).not.toContain("console.log(");
  ```
- chat-13 Super Admin mutation route CSRF and error boundary contracts > SA-ADMIN-ROUTE src/app/api/admin/placements/platform-policy/route.ts: origin rejection precedes any untrusted JSON or mutation

  ```
  AssertionError: expected -1 to be greater than 49
  ❯ tests/unit/chat13-super-admin-mutation-routes-guard.test.ts:34:17
  32|    const json=body.indexOf("request.json()");
  33|    expect(origin).toBeGreaterThan(0);
  34|    expect(json).toBeGreaterThan(origin);
  |                 ^
  35|    expect(body).toMatch(/403|INVALID_ORIGIN/);
  36|    expect(body).not.toContain("console.log(");
  ```
- chat-13 Super Admin mutation route CSRF and error boundary contracts > SA-ADMIN-ROUTE src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts: origin rejection precedes any untrusted JSON or mutation

  ```
  AssertionError: expected -1 to be greater than 116
  ❯ tests/unit/chat13-super-admin-mutation-routes-guard.test.ts:34:17
  32|    const json=body.indexOf("request.json()");
  33|    expect(origin).toBeGreaterThan(0);
  34|    expect(json).toBeGreaterThan(origin);
  |                 ^
  35|    expect(body).toMatch(/403|INVALID_ORIGIN/);
  36|    expect(body).not.toContain("console.log(");
  ```

## tests/unit/chat13-ux-cross-audit-tpo.test.ts (8 failing)
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-001 letters use responsive accessible evidence, no falsified letter states

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'empty={<p role="status"'
  - Expected
  + Received
  - empty={<p role="status"
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { Alert } from "@/components/ui/alert";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-002 share audit preserves UTC evidence on phone and paging

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'UTC timestamp'
  - Expected
  + Received
  - UTC timestamp
  + import { PageHeader } from "@/components/ui/page-header";
  + import Link from "next/link";
  + import { DataTable } from "@/components/ui/data-table";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-006 overview primary actions are WCAG sized and contrast safe

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'min-h-9'
  - Expected
  + Received
  - min-h-9
  + import Link from "next/link";
  + import { TPO_OWNER_PAGE_COPY } from "@/modules/placements/tpo-page-copy";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-007 campaign CTA contrast and phone link targets

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' not to contain 'text-on-primary'
  - Expected
  + Received
  - text-on-primary
  + import { Alert } from "@/components/ui/alert";
  + import { StatusBadge } from "@/components/ui/status-badge";
  + import { Tabs } from "@/components/ui/tabs";
  + import { Dropdown } from "@/components/ui/dropdown";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-010 round result staging uses an accessible guarded confirm dialog

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {InlineNotice} from "@/components/ui/inline-notice";
  + import { Select } from "@/components/ui/select";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-014 send campaign confirmation is accessible and cannot auto-send

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'This cannot be undone.'
  - Expected
  + Received
  - This cannot be undone.
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { Alert } from "@/components/ui/alert";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-025 recruiter board and invitations use accessible confirmations and focus trap

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<Dialog open={adding}'
  - Expected
  + Received
  - <Dialog open={adding}
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- chat-13 TPO second-third cross-audit repairs > UX-cross-tpo-second-C13-027 recruiter directory and company communication remain accessible across viewports

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain '<DataTable<(typeof visibleCompanies)[…'
  - Expected
  + Received
  - <DataTable<(typeof visibleCompanies)[number]>
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```

## tests/unit/chat15-hr-self-grants-53.test.ts (5 failing)
- HR-SELF-GRANTS-53 recruiter current-access profile respects persisted expiry > rejects a borrowed recruiter session before profile lookup or grant read

  ```
  AssertionError: expected [Function] to throw error including 'DENIED placements.recruiter.read' but got '(0 , __vite_ssr_import_4__.getDb)(...…'
  Expected: "DENIED placements.recruiter.read"
  Received: "(0 , __vite_ssr_import_4__.getDb)(...).select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin is not a function"
  ```
- HR-SELF-GRANTS-53 recruiter current-access profile respects persisted expiry > without authorized grants returns an empty list without looking up grant rows

  ```
  AssertionError: promise rejected "TypeError: (0 , __vite_ssr_import_4__.get…" instead of resolving
  ❯ tests/unit/chat15-hr-self-grants-53.test.ts:56:65
  54|  it("without authorized grants returns an empty list without looking u…
  55|   const noGrants={...activeUser,recruiter:{...activeUser.recruiter,gra…
  56|   await expect(getRecruiterSelfGrantOverview(noGrants as never)).resol…
  |                                                                 ^
  57|    profileStatus:"ACTIVE",grants:[],
  58|   });
  ```
- HR-SELF-GRANTS-53 recruiter current-access profile respects persisted expiry > expired or unverified grants cannot appear as ACTIVE current-access facts

  ```
  AssertionError: promise rejected "TypeError: (0 , __vite_ssr_import_4__.get…" instead of resolving
  ❯ tests/unit/chat15-hr-self-grants-53.test.ts:69:67
  67|    'eq(organizations.status, "ACTIVE")',
  68|   ])expect(source).toContain(clause);
  69|   await expect(getRecruiterSelfGrantOverview(activeUser as never)).res…
  |                                                                   ^
  70|    profileStatus:"ACTIVE",grants:[],
  71|   });
  ```
- HR-SELF-GRANTS-53 recruiter current-access profile respects persisted expiry > a mismatched persisted college or relationship cannot borrow the trusted grant

  ```
  AssertionError: expected [Function] to throw error including 'DENIED placements.recruiter.read' but got '(0 , __vite_ssr_import_4__.getDb)(...…'
  Expected: "DENIED placements.recruiter.read"
  Received: "(0 , __vite_ssr_import_4__.getDb)(...).select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin is not a function"
  ```
- HR-SELF-GRANTS-53 recruiter current-access profile respects persisted expiry > matching persisted current grant can be displayed without another recruiter's private contacts

  ```
  TypeError: getDb(...).select(...).from(...).innerJoin(...).innerJoin(...).innerJoin(...).leftJoin is not a function
  ❯ listSignedInRecruiterPendingInvites src/modules/placements/public-recruiter-invite-accept-service.ts:230:3
  228|  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompa…
  229|  .innerJoin(colleges,eq(colleges.id,placementCompanyRelationships.coll…
  230|  .leftJoin(placementTpoLeads,eq(placementTpoLeads.id,placementRecruite…
  |   ^
  231|  .where(and(
  232|   eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id),
  ```

## tests/unit/chat16-final-col-placements-12.test.ts (1 failing)
- COL-placements-12 College Admin drive create field mapping > COL-placements-12 validates and persists assessment URL, deadline, dated milestones and custom eligibility

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useState…' to contain 'name="importantDates"'
  - Expected
  + Received
  - name="importantDates"
  + "use client";
  +
  + import {
  +   useState,
  ```

## tests/unit/chat16-messaging-delivery-resilience-06.test.ts (1 failing)
- chat-16 messaging delivery: per-channel failures, dedupe, authorization and audit > MSG-CHANNEL-FAIL-01 continues other recipients after a channel exception without raw error

  ```
  AssertionError: expected [ 'QUEUED', 'SENT' ] to deeply equal [ 'FAILED', 'SENT' ]
  - Expected
  + Received
  [
  -   "FAILED",
  +   "QUEUED",
  "SENT",
  ]
  ```

## tests/unit/chat16-public-marketing-tenant-25.test.ts (2 failing)
- chat-16 public marketing route rendering and truthful feature contract > UX-public-marketing-01 renders learning, Projects and placements without removed AI claims

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'One connected platform for learning, …'
  - Expected
  + Received
  - One connected platform for learning, projects and placements
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public marketing route rendering and truthful feature contract > UX-public-marketing-02 keeps accessible first-party demo, sign-in and privacy paths

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'aria-label="Public navigation"'
  - Expected
  + Received
  - aria-label="Public navigation"
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
