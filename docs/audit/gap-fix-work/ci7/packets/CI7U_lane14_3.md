# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

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

## tests/unit/chat7-legacy-faculty-assignment-report-copy.test.ts (2 failing)
- AssignmentReportContent.jsx dev report headings and empty copy > keeps authoritative assignment title and legacy report sections

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain '<PageHeader title={assignment.title} …'
  - Expected
  + Received
  - <PageHeader title={assignment.title} />
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  ```
- AssignmentReportContent.jsx dev report headings and empty copy > uses legacy no-submissions empty only for assignment reports

  ```
  AssertionError: expected '"use client";\nimport {EmptyState} fr…' to contain 'emptyMessage = "No learners have subm…'
  - Expected
  + Received
  - emptyMessage = "No learners have submitted yet."
  + "use client";
  + import {EmptyState} from "@/components/ui/empty-state";
  + import {useMemo,useState} from "react";
  + import {Input} from "@/components/ui/input";
  ```

## tests/unit/chat9-college-projects-template-catalogue.test.ts (2 failing)
- chat-9 College Projects template catalogue > COL-projects-16 counts all template sections, filters on the server and exports only visible rows

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'role="search"'
  - Expected
  + Received
  - role="search"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  ```
- chat-9 College Projects template catalogue > COL-projects-08 renders template tags in both list and cards without introducing a new status

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'item.templateTitle ? "Template: " + i…'
  - Expected
  + Received
  - item.templateTitle ? "Template: " + item.templateTitle
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "./project-workspace-readiness.module.css";
  + import Link from "next/link";
  + import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
  ```

## tests/unit/college-contacts-empty-recovery.test.ts (1 failing)
- College Contacts filtered-empty recovery > clears filters while keeping the selected contact category

  ```
  AssertionError: expected 'import { DateInput } from "@/componen…' to contain 'No matching contacts in this college.'
  - Expected
  + Received
  - No matching contacts in this college.
  + import { DateInput } from "@/components/ui/date-input";
  + import { Input } from "@/components/ui/input";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Button } from "@/components/ui/button";
  ```
