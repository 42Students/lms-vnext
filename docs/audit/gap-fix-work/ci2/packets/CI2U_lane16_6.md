# CI unit-test packet (round 2)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat13-super-admin-placements-command-matrix.test.ts (1 failing)
- Super Admin Placements destructive command and concurrency matrix > SA-PUBLISHED-DRIVE-EDIT-02 rejects forged requests, duplicate locations, negative openings and inverted CTC

  ```
  AssertionError: expected false to be true // Object.is equality
  - Expected
  + Received
  - true
  + false
  ```

## tests/unit/chat14-final-col-academic-setup-21.test.ts (1 failing)
- chat-14 final sprint > COL-academic-setup-21 WRONG: department sort, search counter and page-size controls already exist

  ```
  AssertionError: expected '"use client";\n\nimport { Select } fr…' to contain 'setNameOrder(nameOrder === "ASC" ? "D…'
  - Expected
  + Received
  - setNameOrder(nameOrder === "ASC" ? "DESC" : "ASC")
  + "use client";
  +
  + import { Select } from "@/components/ui/select";
  + import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
  ```

## tests/unit/chat15-learner-playback-settings.test.ts (2 failing)
- LEARNER-course-detail-12 playback settings > LEARNER-course-detail-12 accepts bounded persisted tunables and rejects malformed values

  ```
  AssertionError: expected 5000 to be null
  - Expected:
  null
  + Received:
  5000
  ```
- LEARNER-course-detail-12 playback settings > LEARNER-course-detail-12 applies college override to playback cadence and server completion

  ```
  AssertionError: expected '"use client";\n\nimport {\n  useEffec…' to contain '}, saveIntervalMs);'
  - Expected
  + Received
  - }, saveIntervalMs);
  + "use client";
  +
  + import {
  +   useEffect,
  ```

## tests/unit/chat16-final-sa-tenants-modules-29.test.ts (2 failing)
- SA-tenants-modules-29 population-aware confirmation > SA-tenants-modules-29 fetches verified active population, otherwise fails closed

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'students===null'
  - Expected
  + Received
  - students===null
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Switch} from "@/components/ui/selection-controls";
  ```
- SA-tenants-modules-29 population-aware confirmation > SA-tenants-modules-29 requires acknowledgement at 100 learners and separately warns for lock changes

  ```
  AssertionError: expected '"use client";\nimport {Select} from "…' to contain 'students>=100&&!acknowledgedPopulation'
  - Expected
  + Received
  - students>=100&&!acknowledgedPopulation
  + "use client";
  + import {Select} from "@/components/ui/select";
  + import {Checkbox} from "@/components/ui/checkbox";
  + import {Switch} from "@/components/ui/selection-controls";
  ```

## tests/unit/chat16-messaging-policy-02.test.ts (1 failing)
- chat-16 messaging provider and PII boundary controls > messaging-exotel-01 requires an affirmative status and SID, not just HTTP success

  ```
  AssertionError: expected true to be false // Object.is equality
  - Expected
  + Received
  - false
  + true
  ```

## tests/unit/chat16-public-placement-page-states-03.test.tsx (5 failing)
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-unpublished-02 never renders an unpublished college page

  ```
  AssertionError: expected [Function] to throw error including 'NOT_FOUND' but got 'Invalid server environment configurat…'
  - Expected
  + Received
  - NOT_FOUND
  + Invalid server environment configuration: ✖ Database configuration requires DATABASE_URL or DB_USER, DB_PASSWORD, DB_NAME and INSTANCE_UNIX_SOCKET
  +   → at DATABASE_URL
  ```
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-snapshot-03 renders public aggregate only and an explicit date

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
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-outage-04 distinguishes service outage from explicit unpublishing

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
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-partial-05 protects the public page when content service fails

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
- chat-16 public placement page privacy and partial availability > UX-chat16-public-placements-brand-06 does not misclassify temporary branding outage as 404

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
