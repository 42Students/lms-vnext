# CI unit-test packet (round 7)

These tests FAIL in CI on main. For each failing assertion decide:
1. The code change was intentional (old-LMS clone parity, wording parity, audit fix): UPDATE THE TEST to assert the new correct behaviour. Keep the test meaningful; never make it trivially pass.
2. The code regressed (broken behaviour, missing guard, wrong permission): FIX THE CODE, not the test.
3. The test reads a file that no longer exists or tests removed functionality: point it at the new location, or delete only that test case with a one-line reason in the commit message.
Never use .skip/.todo, any, @ts-ignore or eslint-disable to get green. Source-text tests (readFileSync + toContain) are the most common: check the current component and update the expected strings when the new markup is intended.

## tests/unit/tpo-students-csv.test.ts (1 failing)
- TPO Students CSV safety > exports only selected rows with stable column order

  ```
  AssertionError: expected '"Student","Roll number","Batch","Bran…' to contain '"READY_NOT_APPLYING"'
  - Expected
  + Received
  - "READY_NOT_APPLYING"
  + "Student","Roll number","Batch","Branch","Stage","After college","Profile verification","Best so far","Applications","Offers","Registration number","Email","Program","Placement registration","Participation","Readiness evidence","CGPA","10th %","12th %","Diploma %","UG %","Passing year","Gap years"
  + "'=HYPERLINK(""https://invalid.test"")","42","2026","Computer Science","Ready, not applying","","UNKNOWN","Not applied","0","0","","learner@example.test","B.Tech","PLACEMENTS","ELIGIBLE","Academic details recorded","8","","","","","","","Not verified","","0","","Ready, not applying","0","0","0","0
  +
  ```

## tests/unit/w03-project-admin-surfaces.test.ts (1 failing)
- W03 project admin daily-use surface parity > keeps workspace search, status and pagination on both admin accounts

  ```
  AssertionError: expected 'import Link from "next/link";\nimport…' to contain 'const query: ProjectAdminCollectionQu…'
  - Expected
  + Received
  - const query: ProjectAdminCollectionQuery = parsed.data
  + import Link from "next/link";
  + import {redirect} from "next/navigation";
  + import {AuthorizationError} from "@/modules/permissions/policy";
  +
  ```
