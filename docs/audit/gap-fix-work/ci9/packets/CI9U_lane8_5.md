# CI unit-test packet (round 9)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts (1 failing)
- PR-S2-07 registered 0091 final delivery links and Project page copy > keeps one account-level tab strip and legacy labels

  ```
  AssertionError: expected 'import { Tabs } from "@/components/ui…' to contain 'if (basePath === "/college/projects" …'
  - Expected
  + Received
  - if (basePath === "/college/projects" || basePath === "/admin/projects") return null;
  + import { Tabs } from "@/components/ui/tabs";
  + import styles from "./legacy-project-tabs.module.css";
  + import { PROJECT_ADMIN_SECTIONS } from "@/modules/projects/project-admin-navigation-model";
  +
  ```
