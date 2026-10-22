# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-published-drive-edit.test.ts (1 failing)
- Super Admin published drive editing > SA-placements-projects-13 uses guarded form and IST-aware deadline

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'Existing applicant and offer decision…'
  - Expected
  + Received
  - Existing applicant and offer decisions will not be rewritten.
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat16-SA-placements-projects-120-refused-file-report.test.ts (1 failing)
- SA-placements-projects-120 authenticated import refusal reporting > SA-placements-projects-120 displays refused files and reasons without claiming an unperformed successful sync

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' to contain 'No sync was performed by opening this…'
  - Expected
  + Received
  - No sync was performed by opening this page.
  + import { EmptyState } from "@/components/ui/empty-state";
  + import { Banner } from "@/components/ui/banner";
  + import Link from "next/link";
  + import {Button} from "@/components/ui/button";
  ```

## tests/unit/chat16-public-marketing-tenant-25.test.ts (1 failing)
- chat-16 public marketing route rendering and truthful feature contract > UX-public-marketing-01 renders learning, Projects and placements without removed AI claims

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'Team projects with mentors'
  - Expected
  + Received
  - Team projects with mentors
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```

## tests/unit/chat19-hr-page-contracts.test.ts (3 failing)
- HR page-level access, recovery and mobile contracts > HR-XA-01 offers and selection history keep all fields accessible without side scrolling on a phone

  ```
  AssertionError: expected 'import type { ReactNode } from "react…' to contain 'sm:hidden'
  - Expected
  + Received
  - sm:hidden
  + import type { ReactNode } from "react";
  + import Link from "next/link";
  + import { ScrollCue } from "@/components/ui/scroll-cue";
  + import { TableSelectAll } from "@/components/ui/table-select-all";
  ```
- HR page-level access, recovery and mobile contracts > HR-XA-02 HR-XA-03 HR-XA-04 show recovery and readable back navigation after load failures

  ```
  AssertionError: expected '"use client";\n\nimport { PageHeader …' to contain 'text-[var(--lms-teal-deep)]'
  - Expected
  + Received
  - text-[var(--lms-teal-deep)]
  + "use client";
  +
  + import { PageHeader } from "@/components/ui/page-header";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- HR page-level access, recovery and mobile contracts > UX-hr-scroll-motion-02 uses one motion system without extra hard-coded duration

  ```
  AssertionError: expected 'import { EmptyState } from "@/compone…' not to match /duration-\d{2,4}(?!\])/
  - Expected:
  /duration-\d{2,4}(?!\])/
  + Received:
  "import { EmptyState } from \"@/components/ui/empty-state\";
  import { ScrollCue } from \"@/components/ui/scroll-cue\";
  import Link from \"next/link\";
  import {RecruiterConversationReplyForm} from \"@/components/hr/recruiter-conversation-reply-form\";
  ```

## tests/unit/chat2-final-sprint-threads-profile-c.test.ts (1 failing)
- Final sprint recruiter threads and profile — group C > REC-calendar-messages-profile-30 keeps explicit confirmed college-specific self-revocation rather than silent access changes

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'window.confirm('
  - Expected
  + Received
  - window.confirm(
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import { InlineNotice } from "@/components/ui/inline-notice";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```

## tests/unit/chat2-tpo-multi-notice-audience.test.ts (1 failing)
- TPO announcement targeting > TPO-inbox-team-44 lets users search multiple batches/branches and preserves selection through preview

  ```
  AssertionError: expected '"use client";\nimport {useState} from…' to contain 'multiple value={targets}'
  - Expected
  + Received
  - multiple value={targets}
  + "use client";
  + import {useState} from "react";
  + import {Input} from "@/components/ui/input";
  + import {Select} from "@/components/ui/select";
  ```

## tests/unit/chat3-final-sprint-companies-round14.test.ts (4 failing)
- chat-3 final sprint TPO Companies > TPO-companies-08 company drives include applied/offers, search and CSV

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'drive.applied'
  - Expected
  + Received
  - drive.applied
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies > TPO-companies-14 company-aware New action offers lead, drive and followup

  ```
  AssertionError: expected '"use client";\nimport { PageBackLink …' to contain 'New recruiter lead for '
  - Expected
  + Received
  - New recruiter lead for
  + "use client";
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Badge } from "@/components/ui/badge";
  ```
- chat-3 final sprint TPO Companies > TPO-companies-18 Engage Companies tab includes filtered export and count

  ```
  AssertionError: expected '"use client";\nimport { PageHeader } …' to contain 'Companies ('
  - Expected
  + Received
  - Companies (
  + "use client";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Tabs } from "@/components/ui/tabs";
  + import { FilterChip } from "@/components/ui/filter-chip";
  ```
- chat-3 final sprint TPO Companies > TPO-companies-26 create-company confirmation provides dialog Escape and keyboard focus trap

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'modal.showModal()'
  - Expected
  + Received
  - modal.showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/chat4-college-admin-project-route-journey.test.ts (1 failing)
- PROJ-BREAK-COLLEGE-04 College Admin projects route journey > PROJ-BREAK-COLLEGE-04-12 invalid filters recover without a SQL read or a leaked error code

  ```
  AssertionError: expected 2459 to be less than -1
  ❯ tests/unit/chat4-college-admin-project-route-journey.test.ts:19:50
  17|   it("PROJ-BREAK-COLLEGE-04-12 invalid filters recover without a SQL r…
  18|     const page = read("src/app/(authenticated)/college/projects/page.t…
  19|     expect(page.indexOf("if (!parsed.success)")).toBeLessThan(page.ind…
  |                                                  ^
  20|     expect(page).toContain("Invalid project filters");
  21|     expect(page).toContain("Clear filters");
  ```
