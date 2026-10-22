# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/UX-college-projects-workspaces-workspaceId-01.test.ts (1 failing)
- /college/projects/workspaces/[workspaceId] UX > UX-college-projects-workspace-detail-02 retains safe route or shared-workspace UX

  ```
  AssertionError: expected 'import { redirect } from "next/naviga…' to contain 'redirect("/college/projects/"'
  - Expected
  + Received
  - redirect("/college/projects/"
  + import { redirect } from "next/navigation";
  +
  + /** Existing bookmarks, including deep-linked template prompts, remain usable. */
  + export default async function LegacyCollegeWorkspaceRedirect({
  ```

## tests/unit/UX-courses-scroll-motion-01.test.ts (1 failing)
- UX-courses-scroll-motion-01 accessible overflow cues > the content preview and learner roadmap modal inherit responsive, accessible scroll and focus behaviour

  ```
  AssertionError: expected '"use client";\n\nimport { useState } …' to contain '<Dialog open={open}'
  - Expected
  + Received
  - <Dialog open={open}
  + "use client";
  +
  + import { useState } from "react";
  + import { Dialog } from "@/components/ui/dialog";
  ```

## tests/unit/UX-mentor-cross-access-meetings-01.test.ts (1 failing)
- Mentor cross audit access state and meeting controls > UX-mentor-cross-M03 meeting actions have 44px targets and safe URLs

  ```
  AssertionError: expected '"use client";\n\nimport Link from "ne…' to contain 'min-h-11'
  - Expected
  + Received
  - min-h-11
  + "use client";
  +
  + import Link from "next/link";
  + import { useEffect, useMemo, useState } from "react";
  ```

## tests/unit/UX-public-legacy-redirects-02.test.ts (2 failing)
- public legacy redirect accessibility and privacy > UX-e2e-superadmin-login-02 does not offer a privileged test-only sign-in

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'redirect("/login")'
  - Expected
  + Received
  - redirect("/login")
  + import Link from "next/link";
  + import { PageHeader } from "@/components/ui/page-header";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { isSuperAdmin } from "@/modules/identity/context";
  ```
- public legacy redirect accessibility and privacy > UX-privacy-policy-02 redirects to the complete public policy rather than a stub

  ```
  AssertionError: expected 'import type { Metadata } from "next";…' to contain 'redirect("/assets/static/privacy-poli…'
  - Expected
  + Received
  - redirect("/assets/static/privacy-policy-view.html")
  + import type { Metadata } from "next";
  + import { readFile } from "node:fs/promises";
  + import { join } from "node:path";
  +
  ```

## tests/unit/UX-teacher-courses-deliveryid-coverage-01.test.ts (1 failing)
- Faculty UX route /teacher/courses/[deliveryId] > UX-teacher-courses-deliveryid-01: retains routing, access and learner-facing states

  ```
  AssertionError: expected 'import { redirect, notFound } from "n…' to contain 'redirect(facultyCourseTabHref(deliver…'
  - Expected
  + Received
  - redirect(facultyCourseTabHref(deliveryId, "home"))
  + import { redirect, notFound } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { facultyCourseTabHref, validFacultyDefaultDeliveryId } from "@/modules/courses/faculty-course-navigation";
  + import {resolveFacultyCourseDeliveryForLink,listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";
  ```

## tests/unit/UX-teacher-quiz-builder-paste-dialog.test.ts (1 failing)
- Quiz builder paste options and mobile touch UX > UX-teacher-courses-deliveryId-quizzes-manage-07 preserves correct edit limits and minimum tap size

  ```
  AssertionError: expected '"use client";\nimport { Radio } from …' to contain 'min-h-11 rounded border border-border'
  - Expected
  + Received
  - min-h-11 rounded border border-border
  + "use client";
  + import { Radio } from "@/components/ui/radio";
  + import { Checkbox as NativeCheckbox } from "@/components/ui/checkbox";
  + import {useRef,useState} from "react";
  ```
