# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat16-public-marketing-forbidden-pages-16.test.tsx (2 failing)
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-home-01 offers functional, named destinations without requiring an account

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'aria-label="Public navigation"'
  - Expected
  + Received
  - aria-label="Public navigation"
  + <link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","url":"http
  ```
- chat-16 public and auth-adjacent page rendering > UX-chat16-public-demo-04 retains explicit contact and no hidden form submission

  ```
  AssertionError: expected '<link rel="preload" as="image" href="…' to contain 'href="mailto:hello@42lms.com?subject=…'
  Expected: "href="mailto:hello@42lms.com?subject=Request%20a%20Demo""
  Received: "<link rel="preload" as="image" href="/assets/images/legacy-42lms-logo.svg"/><div class="min-h-dvh bg-background text-foreground"><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://42lms.com/#organization","name":"42 LMS","u
  ```

## tests/unit/chat2-public-placements-heading-parity.test.ts (1 failing)
- TPO public college placements legacy framing > TPO-campaigns-public-36 renders only the college's actual name, not an invented Placements at prefix

  ```
  AssertionError: expected 'import { headers } from "next/headers…' to contain '{college?.collegeName??"College place…'
  - Expected
  + Received
  - {college?.collegeName??"College placements"}
  + import { headers } from "next/headers";
  + import {notFound} from "next/navigation";
  + import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
  + import { resolveRequestTenant } from "@/modules/auth/request-tenant";
  ```

## tests/unit/chat4-college-course-tabs-gap-closure.test.ts (2 failing)
- chat-4 College Course Tabs gap closure > COL-course-tabs-06 verifies scoped College Admin authoring and listing

  ```
  AssertionError: expected '"use client";\n\nimport {useEffect,us…' to contain 'Submissions'
  - Expected
  + Received
  - Submissions
  + "use client";
  +
  + import {useEffect,useRef,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```
- chat-4 College Course Tabs gap closure > COL-course-tabs-22 keeps all College Course pages usable when no college is assigned

  ```
  AssertionError: expected 'import { Alert } from "@/components/u…' to contain 'Ask a Super Admin to assign a college'
  - Expected
  + Received
  - Ask a Super Admin to assign a college
  + import { Alert } from "@/components/ui/alert";
  + import {PageHeader} from "@/components/ui/page-header";
  + export function CollegeCourseMissingScope({area}:{area:string}){
  +  return <div className="min-w-0 space-y-3">
  ```

## tests/unit/chat4-tpo-home-gap-closure.test.ts (1 failing)
- chat-4 verified TPO Home gap coverage > TPO-home-R06 avoids invented fallback copy or fabricated null counts

  ```
  AssertionError: expected 'Messages unavailable' to be 'Requests unavailable · Messages unava…' // Object.is equality
  Expected: "Requests unavailable · Messages unavailable"
  Received: "Messages unavailable"
  ```
