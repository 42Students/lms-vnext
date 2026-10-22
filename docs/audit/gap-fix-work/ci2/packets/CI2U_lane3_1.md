# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/COURSES-BREAK-LEARNER-RESULT-11.test.ts (1 failing)
- COURSES-BREAK-LEARNER-RESULT-11 publish vs deadline vs session snapshot > PUBLISHED/published=true/due=Sun Oct 18 2026 04:59:59 GMT+0000 (Coordinated Universal Time) yields visibility=false

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/HR-BREAK-chat15-recruiter-change-requests-page-40.test.tsx (2 failing)
- HR-CHANGE-REQUESTS-PAGE-40 protected recruiter drive page rendering > uses authenticated context and scoped job ID before showing company change requests

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```
- HR-CHANGE-REQUESTS-PAGE-40 protected recruiter drive page rendering > a missing storage prerequisite renders a safe non-submission status, never an editable request widget

  ```
  Error: Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  → at DATABASE_URL
  ❯ parseServerEnv src/lib/env.ts:88:11
  86|
  87|   if (!parsed.success) {
  88|     throw new Error(
  |           ^
  89|       "Invalid server environment configuration: " +
  ```

## tests/unit/HR-BREAK-chat19-conversation-thread-scope.test.tsx (3 failing)
- HR-BREAK-CONVO-THREAD-SCOPE-37 private reply and read state isolation > a different recruiter thread gets a new private reply draft instance

  ```
  AssertionError: expected '11111111-1111-4111-8111-111111111111:' to be '11111111-1111-4111-8111-111111111111' // Object.is equality
  Expected: "11111111-1111-4111-8111-111111111111"
  Received: "11111111-1111-4111-8111-111111111111:"
  ```
- HR-BREAK-CONVO-THREAD-SCOPE-37 private reply and read state isolation > new reply renders a blank message, guarded send, and discard protection

  ```
  AssertionError: expected '<form class="min-w-0 max-w-4xl space-…' to contain 'value=""'
  Expected: "value="""
  Received: "<form class="min-w-0 max-w-4xl space-y-4 border-t border-[var(--lms-canvas-border)] pt-4"><h2 class="text-lg font-semibold leading-7 text-foreground">Reply to placement cell</h2><label class="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Message
  ```
- HR-BREAK-CONVO-THREAD-SCOPE-37 private reply and read state isolation > keeps per-thread receipt URL and removes old browser listeners when remounted

  ```
  AssertionError: expected '"use client";\nimport {useEffect,useR…' to contain 'key={threadId} threadId={threadId}'
  - Expected
  + Received
  - key={threadId} threadId={threadId}
  + "use client";
  + import {useEffect,useRef,useState,type FormEvent} from "react";
  + import {useRouter} from "next/navigation";
  + import {useGuardedAction} from "@/hooks/use-guarded-action";
  ```

## tests/unit/HR-BREAK-profile-01.test.ts (1 failing)
- HR-BREAK-profile-01: employer profile, grants and wrong-tenant visibility > fails closed on malformed phone, stale timestamp, invalid names or injected extra fields

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-calendar-resources.test.ts (1 failing)
- PROJ-BREAK-MENTOR calendar and resource directory independent user safety > PROJ-BREAK-MENTOR-40 meeting links allow only credential-free web protocols

  ```
  AssertionError: expected 'https://video.example.edu/room' to be null
  - Expected:
  null
  + Received:
  "https://video.example.edu/room"
  ```

## tests/unit/PROJ-BREAK-chat14-mentor-team-page.test.tsx (2 failing)
- PROJ-BREAK-MENTOR-70..75 rendered team coverage boundary and permission matrix > PROJ-BREAK-MENTOR-70 duplicated filters never reach team service

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid team coverage filters'
  Expected: "Invalid team coverage filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Team coverage</h1></header><a href="/mentor/team-coverage">Clear filters</a></section>"
  ```
- PROJ-BREAK-MENTOR-70..75 rendered team coverage boundary and permission matrix > PROJ-BREAK-MENTOR-71 invalid search and page values receive recovery, no raw error

  ```
  AssertionError: expected '<section role="alert" class="space-y-…' to contain 'Invalid team coverage filters'
  Expected: "Invalid team coverage filters"
  Received: "<section role="alert" class="space-y-3"><header><h1>Team coverage</h1></header><a href="/mentor/team-coverage">Clear filters</a></section>"
  ```
