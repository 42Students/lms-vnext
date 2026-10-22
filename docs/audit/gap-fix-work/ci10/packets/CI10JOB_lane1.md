# ci10 CI-job packet lane 1: source-contracts

CI job source-contracts (node --test) fails 1 of 267: "DB035 history model is explicitly exported without independently registering staged SQL". Find the test (grep tests/ for that title), read expected vs actual and fix the code or registry so it matches the intended rule.

Run (CI does it): see .github/workflows/ci.yml job source-contracts. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```
  type: 'test'
  ...
# Subtest: DB035 history model is explicitly exported without independently registering staged SQL
not ok 196 - DB035 history model is explicitly exported without independently registering staged SQL
  ---
  duration_ms: 2.762331
  type: 'test'
  location: '/home/runner/work/lms-vnext/lms-vnext/tests/db06-history-staging.test.mjs:25:1'
  failureType: 'testCodeFailure'
  error: |-
    The input did not match the regular expression /export \{assignmentGradeEventsStaged\} from "\.\/db06-history-staged"/. Input:
    
    'export * from "./enums";\n' +
      'export * from "./organizations";\n' +
      'export * from "./colleges";\n' +
      'export * from "./users";\n' +
      'export * from "./memberships";\n' +
      'export * from "./departments";\n' +
      'export * from "./profiles";\n' +
      'export * from "./tenant-domains";\n' +
      'export * from "./legacy-id-map";\n' +
      'export * from "./academics";\n' +
      'export * from "./academic-terms";\n' +
      'export * from "./academic-progression";\n' +
      'export * from "./lecture-halls";\n' +
      'export * from "./faculty-course-associations";\n' +
      'export * from "./courses";\n' +
      'export * from "./assessments";\n' +
      'export * from "./course-assignment-materials";\n' +
      'export * from "./quizzes";\n' +
      'export * from "./projects";\n' +
      'export * from "./placements";\n' +
      'export * from "./placement-general-requests";\n' +
      'export * from "./placement-tpo-prep-assignments";\n' +
      'export * from "./placement-company-identities";\n' +
      'export * from "./activity";\n' +
      '\n' +
      'export * from "./attendance";\n' +
      'export * from "./attendance-parent-sms";\n' +
      '\n' +
      'export * from "./discussions";\n' +
      '\n' +
      'export * from "./module-access";\n' +
```
