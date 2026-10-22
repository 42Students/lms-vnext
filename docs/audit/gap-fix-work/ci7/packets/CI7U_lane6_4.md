# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/faculty-courses-chat7-batched-list.test.ts (1 failing)
- faculty course cards use bounded scoped summaries > FAC-courses-09 uses fixed batched queries not one full workspace load per card

  ```
  AssertionError: expected 'import "server-only";\n\nimport { and…' to contain 'if (!assigned.length) return result'
  - Expected
  + Received
  - if (!assigned.length) return result
  + import "server-only";
  +
  + import { and, asc, eq, inArray, ne } from "drizzle-orm";
  + import { getDb } from "@/db/client";
  ```

## tests/unit/learner-placements-13-saved-drives.test.ts (1 failing)
- LEARNER-placements-13 saved drive bookmarks > LEARNER-placements-13 uses the exact legacy saved-drive button and toast text

  ```
  AssertionError: expected { action: 'Save for later', …(4) } to deeply equal { action: 'Save for later', …(1) }
  - Expected
  + Received
  {
  "action": "Save for later",
  +   "iconLabel": "Not saved",
  +   "showToast": true,
  "toast": "Saved for later",
  ```

## tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts (1 failing)
- PR-S2-07 registered 0091 final delivery links and Project page copy > keeps one account-level tab strip and legacy labels

  ```
  AssertionError: Target cannot be null or undefined.
  ❯ tests/unit/projects-phase2-final-delivery-links-and-copy.test.ts:21:71
  19|  });
  20|  it("keeps one account-level tab strip and legacy labels",()=>{
  21|   expect(workspace.match(/aria-label="Project workspace sections"/g)).…
  |                                                                       ^
  22|   expect(mentor).toContain("<MentorProjectTabs");
  23|   expect(learner).toContain("<LearnerProjectTabs");
  ```

## tests/unit/tpo-batches-53-chat5.test.ts (1 failing)
- TPO batch-specific placement rules > TPO-batches-53 persists strict batch overrides without altering registration lifecycle

  ```
  AssertionError: expected 'import {PageHeader} from "@/component…' to contain 'getCollegePlacementRules'
  - Expected
  + Received
  - getCollegePlacementRules
  + import {PageHeader} from "@/components/ui/page-header";
  + import {batchRuleDate} from "@/modules/placements/tpo-batch-labels-model";
  + import {TpoBatchRuleEditor} from "@/components/tpo/tpo-batch-rule-editor";
  + import {tpoBatchRuleOverridesSchema} from "@/modules/placements/tpo-batch-rules-model";
  ```
