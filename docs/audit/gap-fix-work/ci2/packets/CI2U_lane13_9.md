# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat5-fixed-on-main-more-evidence.test.ts (2 failing)
- Chat-5 second verified-main source contracts > TPO-students-35 keeps saved views on the scoped roster page

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'TpoStudentSavedViews'
  - Expected
  + Received
  - TpoStudentSavedViews
  + import { Button } from "@/components/ui/button";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Dropdown } from "@/components/ui/dropdown";
  + import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
  ```
- Chat-5 second verified-main source contracts > TPO-requests-verification-09 displays roster roll and branch evidence

  ```
  AssertionError: expected 'import { Select } from "@/components/…' to contain 'Branch:'
  - Expected
  + Received
  - Branch:
  + import { Select } from "@/components/ui/select";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {FilterChipLink} from "@/components/ui/filter-chip";
  ```

## tests/unit/chat6-admin-second-third-people-inbound.test.ts (1 failing)
- /admin second third: inbound mail and People directory behavioral boundaries > CHAT6-ADMIN-INBOUND-01 validates inbox filters, refuses duplicate/privileged input and caps search

  ```
  AssertionError: {"status":"DELETED"}: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat6-faculty-assessments-gap-closure.test.ts (4 failing)
- chat-6 Faculty assessments verified gap closure > FAC-assessments-06 single-click grade save and publication

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Grade saved and published to the lear…'
  - Expected
  + Received
  - Grade saved and published to the learner.
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-23 grade pending and graded points wording

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Grade pending'
  - Expected
  + Received
  - Grade pending
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-25 NOT-A-GAP legacy overview fields now shown

  ```
  AssertionError: expected '"use client";\nimport { Badge } from …' to contain 'Course: {item.courseName}'
  - Expected
  + Received
  - Course: {item.courseName}
  + "use client";
  + import { Badge } from "@/components/ui/badge";
  + import {PageHeader} from "@/components/ui/page-header";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- chat-6 Faculty assessments verified gap closure > FAC-assessments-26 NOT-A-GAP zero-submission draft review supported

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'No submissions yet. Publish this assi…'
  - Expected
  + Received
  - No submissions yet. Publish this assignment
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```

## tests/unit/chat6-learner-profile-round2-verified.test.ts (2 failing)
- Learner profile and notifications fixed-on-main parity evidence > LEARNER-profile-misc-07 restores exact legacy section headings

  ```
  AssertionError: expected '"use client";\nimport {LEARNER_EDUCAT…' to contain 'Education/Qualification'
  - Expected
  + Received
  - Education/Qualification
  + "use client";
  + import {LEARNER_EDUCATION_TYPES,learnerQualifyingExamSuggestions,LEARNER_QUALIFYING_EXAM_DETAILS,learnerEducationValidationProblem} from "@/modules/people/learner-education-picker-model";
  + import {LearnerSkillCatalogInput} from "@/components/profile/learner-skill-catalog-input";
  + import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
  ```
- Learner profile and notifications fixed-on-main parity evidence > LEARNER-profile-misc-13 provides skill catalogue searching instead of free text only

  ```
  AssertionError: expected '"use client";\nimport { Button } from…' to contain 'Search and select skills...'
  - Expected
  + Received
  - Search and select skills...
  + "use client";
  + import { Button } from "@/components/ui/button";
  + import {useEffect,useId,useRef,useState} from "react";
  + import { Input } from "@/components/ui/input";
  ```

## tests/unit/chat6-superadmin-middle-inbound-mail-26.test.tsx (3 failing)
- SA-middle-inbound-mail-26 private inbox role and partial states > does not query inbox data on duplicate selector keys or impossible pages

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-inbound-mail-26 private inbox role and partial states > distinguishes a missing deployment from a genuinely empty inbox

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```
- SA-middle-inbound-mail-26 private inbox role and partial states > passes only schema-validated tenant actor and normalized inbox pagination

  ```
  Error: [vitest] No "INBOUND_ROUTING_METADATA_READY" export is defined on the "@/modules/inbound-mail/admin-service" mock. Did you forget to return it from "vi.mock"?
  If you need to partially mock a module, you can use "importOriginal" helper inside:
  vi.mock(import("@/modules/inbound-mail/admin-service"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
  ...actual,
  // your mocked methods
  }
  ```

## tests/unit/chat7-admin-learning-directory-resilience.test.ts (1 failing)
- SA-COURSES-CONTENT-AUDIT-03 lessons and progress list resilience > preserves an authorized directory after optional picker outage, but never presents failed data as empty

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'parseSuperAdminLearningQuery(raw)'
  - Expected
  + Received
  - parseSuperAdminLearningQuery(raw)
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { Input } from "@/components/ui/input";
  + import { Select } from "@/components/ui/select";
  ```
