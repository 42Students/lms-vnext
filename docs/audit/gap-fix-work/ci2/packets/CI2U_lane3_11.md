# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat9-tpo-settings-legacy-graceful.test.ts (1 failing)
- TPO Settings legacy copy and graceful editing > TPO-settings-audit-03 uses the original placement settings section names

  ```
  AssertionError: expected 'import Link from "next/link";\ntype S…' to contain 'label:"Placement Rules"'
  - Expected
  + Received
  - label:"Placement Rules"
  + import Link from "next/link";
  + type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
  + /** Exactly five legacy-visible settings sections. Hidden panels and persisted
  +  * settings stay accessible by direct scoped URLs, never silently destroyed. */
  ```

## tests/unit/college-courses-content-gap-closure.test.ts (6 failing)
- College Courses & Content gap closure > COL-courses-content-03 visibility is not faked by an archived record label

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain 'courseVisibleToStudentsLabel(course.s…'
  - Expected
  + Received
  - courseVisibleToStudentsLabel(course.status)
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { StatTile } from "@/components/ui/stat-tile";
  + import { Alert } from "@/components/ui/alert";
  + import { Disclosure } from "@/components/ui/disclosure";
  ```
- College Courses & Content gap closure > COL-courses-content-08 offering detail displays Home/Syllabus and scoped teacher identities

  ```
  AssertionError: expected 'import { PageBackLink } from "@/compo…' to contain 'aria-label="Course detail tabs"'
  - Expected
  + Received
  - aria-label="Course detail tabs"
  + import { PageBackLink } from "@/components/ui/page-back-link";
  + import {Alert} from "@/components/ui/alert";
  + import Link from "next/link";
  + import { notFound } from "next/navigation";
  ```
- College Courses & Content gap closure > COL-courses-content-09 section content selector never discloses student media links

  ```
  AssertionError: expected '"use client";\nimport {useRef} from "…' to contain 'does not reveal private video, file o…'
  - Expected
  + Received
  - does not reveal private video, file or meeting links
  + "use client";
  + import {useRef} from "react";
  + import type {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";
  + import { Select } from "@/components/ui/select";
  ```
- College Courses & Content gap closure > COL-courses-content-10 absent offering is a friendly page, load failure is distinct

  ```
  AssertionError: expected '"use client";\nimport Link from "next…' to contain 'role="alert"'
  - Expected
  + Received
  - role="alert"
  + "use client";
  + import Link from "next/link";
  + import { Button } from "@/components/ui/button";
  + import { ErrorState } from "@/components/ui/error-state";
  ```
- College Courses & Content gap closure > COL-courses-content-11 Faculty Assignment form selects multiple courses by program, batch, class, semester and year

  ```
  AssertionError: expected '"use client";\nimport { Select } from…' to contain 'Courses to Assign'
  - Expected
  + Received
  - Courses to Assign
  + "use client";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { Checkbox } from "@/components/ui/checkbox";
  ```
- College Courses & Content gap closure > COL-courses-content-15 raw machine codes are not rendered in Course mutation errors

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'apiFetch<void>'
  - Expected
  + Received
  - apiFetch<void>
  + "use client";
  +
  + import { useEffect, useState } from "react";
  + import { useRouter } from "next/navigation";
  ```

## tests/unit/college-term-mapping-model.test.ts (1 failing)
- Semester-course mapping boundaries > updates mapping credits/order and rejects invalid positions or values

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/faculty-profile-round9-13.test.ts (1 failing)
- lists every actual Faculty self-profile editor exactly once with stable anchors

  ```
  AssertionError: expected [ { section: 'about', …(1) }, …(12) ] to have a length of 12 but got 13
  - Expected
  + Received
  - 12
  + 13
  ```

## tests/unit/hr-recruiter-exhaustive-chat15-01.test.ts (1 failing)
- HR recruiter exhaustive policy boundaries chat-15 > HR-autoapproval cannot bypass an unverified recruiter grant

  ```
  AssertionError: expected { autoApprove: true, …(1) } to deeply equal { autoApprove: true, …(1) }
  - Expected
  + Received
  {
  "autoApprove": true,
  -   "reason": "TRUSTED_DOMAIN",
  +   "reason": "TRUSTED_COMPANY",
  }
  ```

## tests/unit/learner-course-detail-round5.test.ts (1 failing)
- chat-11 Learner Course Detail legacy parity > LEARNER-course-detail-14 displays content kind, progress and due labels on learning items

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'caption ?? kind'
  - Expected
  + Received
  - caption ?? kind
  + "use client";
  +
  + import { useId, useState, type ReactNode } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```
