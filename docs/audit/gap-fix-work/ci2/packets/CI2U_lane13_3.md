# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-01.test.ts (2 failing)
- /college/projects UX > UX-college-projects-01 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Project workspace tools"'
  - Expected
  + Received
  - aria-label="Project workspace tools"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
- /college/projects UX > UX-college-projects-02 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'aria-label="Workspace display and arc…'
  - Expected
  + Received
  - aria-label="Workspace display and archive"
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```

## tests/unit/UX-courses-attendance-overlays-01.test.ts (6 failing)
- UX-courses-attendance-overlay-foundation-01 > shared modal enforces Escape/backdrop policy, focus restoration, scroll cues and accessible title

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'showModal()'
  - Expected
  + Received
  - showModal()
  + "use client";
  +
  + import { useId, useRef, type ReactNode, type CSSProperties } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-courses-attendance-overlay-foundation-01 > UX-courses-college-content-preview-01 preserves its accessible Dialog and relevant state/action

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain 'Scoped metadata preview only'
  - Expected
  + Received
  - Scoped metadata preview only
  + "use client";
  +
  + import { useState } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```
- UX-courses-attendance-overlay-foundation-01 > UX-courses-faculty-assessment-create-01 preserves its accessible Drawer and relevant state/action

  ```
  AssertionError: expected '"use client";\n\nimport {useId,useMem…' to contain 'closeDrawer'
  - Expected
  + Received
  - closeDrawer
  + "use client";
  +
  + import {useId,useMemo,useState} from "react";
  + import {useRouter} from "next/navigation";
  ```
- UX-courses-attendance-overlay-foundation-01 > UX-courses-faculty-assignment-review-01 preserves its accessible Drawer and relevant state/action

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'Drawer'
  - Expected
  + Received
  - Drawer
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import Link from "next/link";
  ```
- UX-courses-attendance-overlay-foundation-01 > UX-courses-faculty-quiz-review-01 preserves its accessible Drawer and relevant state/action

  ```
  AssertionError: expected '"use client";\nimport { Alert } from …' to contain 'Drawer'
  - Expected
  + Received
  - Drawer
  + "use client";
  + import { Alert } from "@/components/ui/alert";
  +
  + import {useEffect,useRef,useState} from "react";
  ```
- UX-courses-attendance-overlay-foundation-01 > UX-courses-learner-roadmap-item-dialog-01 preserves its accessible Dialog and relevant state/action

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useS…' to contain 'Close'
  - Expected
  + Received
  - Close
  + "use client";
  +
  + import { useId, useState, type ReactNode } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```

## tests/unit/UX-kit-states-chat17.test.tsx (8 failing)
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-STATES-02 native input/select/textarea disabled and invalid controls remain labeled

  ```
  AssertionError: expected '<input data-slot="input" id="a" disab…' to contain 'text-base'
  Expected: "text-base"
  Received: "<input data-slot="input" id="a" disabled="" placeholder="Name" aria-invalid="true" class="min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full min-w-0 font-[inherit] rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-s
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-HARDEN-36 stat links, tab navigation and pagination fail closed on bad hrefs

  ```
  AssertionError: expected '<nav data-slot="pagination" aria-labe…' to contain 'href="/college/projects?page=2"'
  Expected: "href="/college/projects?page=2""
  Received: "<nav data-slot="pagination" aria-label="Projects pages" class="flex min-w-0 flex-wrap items-center justify-center gap-1 md:justify-start md:gap-[var(--lms-space-2)]"><span aria-disabled="true" class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] md:min-h-9 md:min
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-STATES-11 hidden filter sheet retains always-visible search and count sanitization

  ```
  AssertionError: expected '<section data-slot="filter-bar" data-…' to contain 'Candidates (0)'
  Expected: "Candidates (0)"
  Received: "<section data-slot="filter-bar" data-open="false" data-active-count="0" aria-label="Candidates" class="min-w-0 space-y-[var(--lms-space-3)]"><div class="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]"><div class="min-w-0 w-full flex-1 basis-full md:w-auto md:basis-[260px] md
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-HARDEN-37 filter drawer closes on viewport resize even without matchMedia

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'typeof window.matchMedia === "functio…'
  - Expected
  + Received
  - typeof window.matchMedia === "function"
  + "use client";
  +
  + import { useId, useRef, useState, type ReactNode } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-STATES-13 file fallback announces inability and never pretends files were selected

  ```
  AssertionError: expected '<div class="min-w-0 space-y-2" data-s…' to contain 'role="alert"'
  Expected: "role="alert""
  Received: "<div class="min-w-0 space-y-2" data-slot="file-upload"><label for="_R_0_" class="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Final proof</label><p id="_R_0_-unavailable" role="status" class="text-[13px] leading-5 text-[var(--lms-body-text)]">File selection is 
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-HARDEN-34 file control keeps helper and unavailable reason connected for assistive technology

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'error ? `${id}-error` : null'
  - Expected
  + Received
  - error ? `${id}-error` : null
  + "use client";
  +
  + import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-HARDEN-50 availability transition clears obsolete file validation state

  ```
  AssertionError: expected '"use client";\n\nimport { useEffect, …' to contain 'if (pickerUnavailable || disabled) se…'
  - Expected
  + Received
  - if (pickerUnavailable || disabled) setError(null)
  + "use client";
  +
  + import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from "react";
  + import { cx } from "@/lib/class-names";
  ```
- UX-kit-STATES: semantic SSR states and accessible fallbacks > UX-kit-STATES-14 HTTPS links display fallback; script, HTTP and credential-bearing URLs never link

  ```
  AssertionError: expected '<span class="inline-flex min-w-0 flex…' not to contain 'target="_blank"'
  Expected: "target="_blank""
  Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.test/meet" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canv
  ```

## tests/unit/UX-project-workspaces-chat17.test.ts (2 failing)
- UX-project-workspaces-41/42 accessible workspace cards > UX-project-workspaces-41 primary navigation retains minimum 44px target

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'Open workspace'
  - Expected
  + Received
  - Open workspace
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "./project-workspace-readiness.module.css";
  + import Link from "next/link";
  + import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
  ```
- UX-project-workspaces-41/42 accessible workspace cards > UX-project-workspaces-42 non-finite or outside 0..100 progress is unavailable, not a fake 100%

  ```
  AssertionError: expected 'import { MetricBar } from "@/componen…' to contain 'aria-valuenow={progress}'
  - Expected
  + Received
  - aria-valuenow={progress}
  + import { MetricBar } from "@/components/ui/metric-bar";
  + import styles from "./project-workspace-readiness.module.css";
  + import Link from "next/link";
  + import { ProjectArchiveControl } from "@/components/projects/project-archive-control";
  ```

## tests/unit/UX-teacher-attendance-workspace-dialog.test.ts (1 failing)
- Faculty attendance draft protection and scheduling > UX-teacher-courses-deliveryId-attendanceDetail-06 shows the IST time confirmation before posting session

  ```
  AssertionError: expected '"use client";\nimport { SummaryStrip …' to contain 'if(confirmed){setScheduling(false);se…'
  - Expected
  + Received
  - if(confirmed){setScheduling(false);setConfirmScheduleOpen(false);}
  + "use client";
  + import { SummaryStrip } from "@/components/ui/summary-strip";
  + import { Alert } from "@/components/ui/alert";
  + import { Textarea } from "@/components/ui/textarea";
  ```

## tests/unit/UX-teacher-pages-round3.test.ts (8 failing)
- UX teacher rollout third ten route contracts > UX-teacher-courses-deliveryId-reports-01 keeps real published roster, attendance and assessment aggregates

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { Select } from "@/components/ui/select";
  + import { Button } from "@/components/ui/button";
  + import { PageHeader } from "@/components/ui/page-header";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-courses-deliveryId-session-coverage-01 keeps persisted session history, no inferred absence

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-courses-deliveryId-students-01 keeps scoped roster and assigned Section redirects

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'PageHeader'
  - Expected
  + Received
  - PageHeader
  + import Link from "next/link";
  + import {notFound,redirect} from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { FacultyCourseRoster } from "@/components/courses/faculty-course-roster";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-courses-deliveryId-students-membershipId-01 keeps authorized learner roster and current Section facts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { EmptyState } from "@/components/ui/empty-state";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-profile-01 keeps About fields, all three exact action labels and registered identity

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  + import {ErrorState} from "@/components/ui/error-state";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-profile-contacts-01 keeps no unregistered contact write form or false save

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {PageHeader} from "@/components/ui/page-header";
  + import {getOwnFacultyContactAvailability} from "@/modules/people/faculty-contact-availability-service";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-profile-details-01 keeps faculty permission checks and staged schema gate

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { notFound, redirect } from "next/navigation";
  + import { Banner } from "@/components/ui/banner";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
- UX teacher rollout third ten route contracts > UX-teacher-profile-teaching-01 keeps read-only college-managed employment data and paged Sections

  ```
  AssertionError: expected 'import { Input } from "@/components/u…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import { Input } from "@/components/ui/input";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
