# CI infra packet (round 3): browser (E2E database prep / build)

This CI job fails on main. Fix the cause with the smallest correct change (the migrations 0000-0290 are the source of truth; staging SQL that was promoted into a registered migration must become idempotent or be retired with a note). Never weaken a guard test to make it pass.

```
> node --conditions=react-server ./node_modules/tsx/dist/cli.mjs scripts/db-e2e-prepare.ts
Error: This module cannot be imported from a Client Component module. It should only be used from a Server Component.
    at <anonymous> (/home/runner/work/lms-vnext/lms-vnext/src/modules/permissions/acting-college.ts:1:8)
    at Object.<anonymous> (/home/runner/work/lms-vnext/lms-vnext/src/modules/permissions/acting-college.ts:11:23)
##[error]Process completed with exit code 1.
```
