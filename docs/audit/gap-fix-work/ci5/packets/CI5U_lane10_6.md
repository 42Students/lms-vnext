# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-utility-model.test.ts (5 failing)
- TPO profile role formatting > preserves the TPO acronym

  ```
  AssertionError: expected 'Placement officer' to be 'TPO' // Object.is equality
  Expected: "TPO"
  Received: "Placement officer"
  ```
- TPO profile role formatting > formats other stored membership roles

  ```
  AssertionError: expected 'Placement team' to be 'Faculty' // Object.is equality
  Expected: "Faculty"
  Received: "Placement team"
  ```
- TPO More navigation > contains the required utility destinations

  ```
  AssertionError: expected [ '/tpo/batches', …(10) ] to deeply equal [ '/tpo/students', …(7) ]
  - Expected
  + Received
  [
  -   "/tpo/students",
  +   "/tpo/batches",
  "/tpo/requests",
  "/tpo/calendar",
  ```
- TPO More navigation > uses the working companies view rather than a name-dependent redirect

  ```
  AssertionError: expected undefined to be '/tpo/recruiters?view=companies' // Object.is equality
  - Expected:
  "/tpo/recruiters?view=companies"
  + Received:
  undefined
  ```
- TPO More navigation > does not link unimplemented utilities

  ```
  AssertionError: expected [ '/tpo/batches', …(10) ] to not include '/tpo/messages'
  ❯ tests/unit/tpo-utility-model.test.ts:111:32
  109|       "/tpo/settings",
  110|     ]) {
  111|       expect(destinations).not.toContain(
  |                                ^
  112|         unavailable,
  113|       );
  ```

## tests/unit/ux-chat14-mentor-quality-04a.test.ts (5 failing)
- chat-14 mentor UX quality batch 04a > UX-mentor-landing-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' not to contain 'text-primary-text'
  - Expected
  + Received
  - text-primary-text
  + import Link from "next/link";
  + import { redirect } from "next/navigation";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  + import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-activity-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { PageSizeSelect } from "@/components/ui/page-size-select";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-calendar-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { PageHeader } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { PageHeader } from "@/components/ui/page-header";
  + import {Button} from "@/components/ui/button";
  + import Link from "next/link";
  + import {MentorProjectsUnavailable} from "@/components/projects/mentor-projects-unavailable";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-notifications-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Suspense } from "react";
  + import { Select } from "@/components/ui/select";
  + import {Button} from "@/components/ui/button";
  + import {listMyProjectInstances} from "@/modules/projects/member-service";
  ```
- chat-14 mentor UX quality batch 04a > UX-mentor-projects-02 retains accessible link and shared action contracts

  ```
  AssertionError: expected 'import { Suspense } from "react";\nim…' to contain 'focus-visible:outline-[var(--lms-teal…'
  - Expected
  + Received
  - focus-visible:outline-[var(--lms-teal-deep)]
  + import { Suspense } from "react";
  + import { getMentorProjectTeamSizes } from "@/modules/projects/mentor-project-team-size-service";
  + import { getMentorProjectWorkCounts } from "@/modules/projects/mentor-project-work-service";
  + import { mentorTaskProgress, matchesMentorProjectWork } from "@/modules/projects/mentor-project-work-model";
  ```
