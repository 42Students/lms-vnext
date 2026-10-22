# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-profile-01.test.ts (1 failing)
- /college/profile UX > UX-college-profile-02 keeps audited user-visible behavior

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'Failed to load profile.'
  - Expected
  + Received
  - Failed to load profile.
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { CollegeProfileRetained } from "@/components/college/college-profile-retained";
  ```

## tests/unit/UX-college-verification-01.test.ts (1 failing)
- /college/verification UX > UX-college-verification-03 preserves responsive or failure recovery contract

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'prefetch={false}'
  - Expected
  + Received
  - prefetch={false}
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {getCurrentRequestContext} from "@/auth/request-context";
  + import {hasMembershipRole} from "@/modules/identity/context";
  ```

## tests/unit/UX-kit-projects-hardening-chat17.test.tsx (6 failing)
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-01 button pending/danger/disabled statuses expose semantics and 44px target

  ```
  AssertionError: expected '<button data-slot="button" data-varia…' to contain 'border-error'
  Expected: "border-error"
  Received: "<button data-slot="button" data-variant="danger" data-size="md" type="button" class="inline-flex min-h-[var(--lms-control-height)] max-[767px]:min-h-11 cursor-pointer items-center justify-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] border font-[650] leading-5 min-w
  ```
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-02 Input/Select/Textarea expose 16px input, invalid state and 44px target

  ```
  AssertionError: expected '<input data-slot="input" aria-invalid…' to contain 'text-base'
  Expected: "text-base"
  Received: "<input data-slot="input" aria-invalid="true" required="" id="email" class="min-h-[var(--lms-control-height)] max-[767px]:min-h-11 w-full min-w-0 font-[inherit] rounded-[var(--lms-field-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-form-bg)] px-[var(--lms-space-3)] py-[7p
  ```
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-05 file picker denies unsafe types, oversized files and stale selections

  ```
  AssertionError: expected '<div class="min-w-0 space-y-2" data-s…' to contain 'role="alert"'
  Expected: "role="alert""
  Received: "<div class="min-w-0 space-y-2" data-slot="file-upload"><label for="_R_0_" class="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Proof</label><p id="_R_0_-unavailable" role="status" class="text-[13px] leading-5 text-[var(--lms-body-text)]">File selection is unavai
  ```
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-14 link refuses HTTP/credentials and keeps valid URL copy fallback

  ```
  AssertionError: expected '<span class="inline-flex min-w-0 flex…' to contain 'Destination URL'
  Expected: "Destination URL"
  Received: "<span class="inline-flex min-w-0 flex-col gap-[var(--lms-space-2)]"><a href="https://example.org/" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-bo
  ```
- UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states > UX-kit-HARDEN-19 filters have named overlay, focus loop and scroll hint

  ```
  AssertionError: expected '"use client";\n\nimport { useId, useR…' to contain 'if (event.key === "Escape")'
  - Expected
  + Received
  - if (event.key === "Escape")
  + "use client";
  +
  + import { useId, useRef, useState, type ReactNode } from "react";
  + import { Button } from "@/components/ui/button";
  ```
- UX-kit-HARDEN-22 declared 38-element shared UI surface register > UX-kit-HARDEN-22 third-party-link remains in the checked-in kit and has no native popup or one-off >300ms interactive duration

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' not to contain 'target="_blank"'
  - Expected
  + Received
  - target="_blank"
  + "use client";
  +
  + import { useState } from "react";
  + import { Button } from "@/components/ui/button";
  ```

## tests/unit/UX-mentor-projects-projectId-timeline-01.test.ts (1 failing)
- Mentor UX cross-audit /mentor/projects/[projectId]/timeline > UX-mentor-projects-projectId-timeline-02 preserves exact legacy labels and navigable pagination

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain 'title="Release &amp; Sprint timeline"'
  - Expected
  + Received
  - title="Release &amp; Sprint timeline"
  + import { PageHeader } from "@/components/ui/page-header";
  + import { Pagination } from "@/components/ui/pagination";
  + import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
  +
  ```

## tests/unit/UX-teacher-allassignments-coverage-01.test.ts (1 failing)
- Faculty UX route /teacher/allAssignments > UX-teacher-allassignments-01: retains routing, access and learner-facing states

  ```
  AssertionError: expected 'import { assignmentFilesRuntimeEnable…' to contain 'aria-label="Assignment report shortcu…'
  - Expected
  + Received
  - aria-label="Assignment report shortcuts"
  + import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import {RetainedFacultyAssignments} from "@/components/courses/faculty-assignments-retention";
  + import { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
  ```

## tests/unit/UX-teacher-notifications-coverage-01.test.ts (1 failing)
- UX-teacher-notifications-01 /teacher/notifications keeps access and honest feedback

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain '<PageHeader\n        title="Notificat…'
  - Expected
  + Received
  - <PageHeader
  -         title="Notifications"
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
