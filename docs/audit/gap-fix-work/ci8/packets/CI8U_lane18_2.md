# CI unit-test packet (round 8)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/chat19-college-cross-audit.test.ts (1 failing)
- chat-19 college UX cross-audit > COL-XA-09 keeps workspaces visible when optional template labels fail

  ```
  AssertionError: expected "vi.fn()" to be called with arguments: [ { …(2) }, 'college-a', …(1) ]
  Received:
  1st vi.fn() call:
  @@ -7,11 +7,12 @@
  "id": "actor",
  "platformStatus": "ACTIVE",
  },
  },
  ```

## tests/unit/chat4-college-projects-reassignment-gap-closure.test.ts (1 failing)
- chat-4 college project mentorship bulk reassignment > COL-projects-R02 searches all mentors on server and retains bulk evidence

  ```
  AssertionError: expected 'import { Button } from "@/components/…' to contain 'isProjectMentorOverloaded'
  - Expected
  + Received
  - isProjectMentorOverloaded
  + import { Button } from "@/components/ui/button";
  + import { Select } from "@/components/ui/select";
  + import { Input } from "@/components/ui/input";
  + import { getCurrentRequestContext } from "@/auth/request-context";
  ```
