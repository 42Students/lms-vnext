# ci10 CI-job packet lane 6: db01-acceptance

CI job db01-acceptance: tests/integration/db01-tenant-routing-lifecycle.test.ts fails to run. Read the failure and fix the cause.

Run (CI does it): see .github/workflows/ci.yml job db01-acceptance. Never weaken assertions, never .skip.

Log excerpt (CI run 39772266680):

```

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/integration/db01-tenant-routing-lifecycle.test.ts [ tests/integration/db01-tenant-routing-lifecycle.test.ts ]
Error: Transform failed with 2 errors:

[PARSE_ERROR] Identifier `SEED_IDS` has already been declared
   ╭─[ tests/integration/db01-tenant-routing-lifecycle.test.ts:5:10 ]
   │
 5 │ import { SEED_IDS } from "../../scripts/db-seed-data";
   │          ────┬───  
   │              ╰───── `SEED_IDS` has already been declared here
   │ 
 7 │ import { SEED_IDS } from "../../scripts/db-seed-data";
   │          ────┬───  
   │              ╰───── It can not be redeclared here
───╯

[PARSE_ERROR] Identifier `SEED_IDS` has already been declared
    ╭─[ tests/integration/db01-tenant-routing-lifecycle.test.ts:5:10 ]
    │
  5 │ import { SEED_IDS } from "../../scripts/db-seed-data";
    │          ────┬───  
    │              ╰───── `SEED_IDS` has already been declared here
    │ 
 13 │ import { SEED_IDS } from "../../scripts/db-seed-data";
    │          ────┬───  
    │              ╰───── It can not be redeclared here
────╯

  Plugin: vite:oxc
  File: /home/runner/work/lms-vnext/lms-vnext/tests/integration/db01-tenant-routing-lifecycle.test.ts
 ❯ transformWithOxc node_modules/vite/dist/node/chunks/node.js:7581:19
 ❯ TransformPluginContext.transform node_modules/vite/dist/node/chunks/node.js:7653:26
 ❯ EnvironmentPluginContainer.transform node_modules/vite/dist/node/chunks/node.js:8545:51
 ❯ loadAndTransform node_modules/vite/dist/node/chunks/node.js:19988:26

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 5 passed (6)
      Tests  42 passed (42)
   Start at  11:42:37
```
