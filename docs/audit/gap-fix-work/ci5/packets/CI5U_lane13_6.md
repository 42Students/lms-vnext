# CI unit-test packet (round 5)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/ui-color-parity.test.ts (2 failing)
- first UI batch color parity > does not introduce replacement Tailwind brand palettes

  ```
  AssertionError: expected 'import type { ComponentPropsWithRef }…' not to contain 'slate-'
  - Expected
  + Received
  - slate-
  + import type { ComponentPropsWithRef } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type ButtonProps = ComponentPropsWithRef<"button"> & {
  ```
- first UI batch color parity > uses the canonical LMS semantic token utilities

  ```
  AssertionError: expected 'import type { ComponentPropsWithRef }…' to contain 'bg-primary'
  - Expected
  + Received
  - bg-primary
  + import type { ComponentPropsWithRef } from "react";
  + import { cx } from "@/lib/class-names";
  +
  + export type ButtonProps = ComponentPropsWithRef<"button"> & {
  ```

## tests/unit/ux-chat14-mentor-quality-04e.test.ts (6 failing)
- chat-14 mentor UX quality batch 04e > UX-mentor-review-history-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Tabs } from "@/components/ui/tabs";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-reviews-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { PageSizeSelect } from "@/components/ui/page-size-select";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-sprint-progress-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-task-review-history-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-task-reviews-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { Pagination } from "@/compone…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { Pagination } from "@/components/ui/pagination";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  ```
- chat-14 mentor UX quality batch 04e > UX-mentor-team-coverage-02 preserves mentor route accessibility and original copy

  ```
  AssertionError: expected 'import { FilterBar } from "@/componen…' to contain '<Button type="submit" variant="primar…'
  - Expected
  + Received
  - <Button type="submit" variant="primary">
  + import { FilterBar } from "@/components/ui/filter-bar";
  + import { Disclosure } from "@/components/ui/disclosure";
  + import { Pagination } from "@/components/ui/pagination";
  + import { Select } from "@/components/ui/select";
  ```
