# Chat 6 / DB-008 — offering/delivery reference-model Node execution

**Date:** 2026-10-11 IST  
**Global phase:** DATABASE · **Task state:** IN_PROGRESS  
**Purpose:** Independently execute 19 *pure JavaScript source-reference* cases for tenant/cohort/term acceptance rules, not database migration proof.

## Exact provenance

| Field | Observed |
|---|---|
| GitHub source file | `tests/db05-offering-delivery-reference.test.mjs` |
| Main commit adding test | `23e53aa1ab5e08cce85fd1f4ccd5b749a23a3382` |
| GitHub blob SHA (fetched after commit) | `c73011e74df7dfd738c69445cf0ce88e11e4c6ac` |
| Local file `git hash-object` | `c73011e74df7dfd738c69445cf0ce88e11e4c6ac` — **exact match** |
| Local SHA-256 | `9e8ed136c43256a9447c547cb346270e0e538b00fc50da0749a888d6151481e5` |
| Runtime | Node `v22.16.0` |
| Syntax check | `node --check /tmp/db05-offering-delivery-reference.test.mjs` — exit 0 |
| Test command | `node --test /tmp/db05-offering-delivery-reference.test.mjs` |
| Test result | `19 tests, 19 pass, 0 fail, 0 skipped` |
| Node TAP reported duration | `78.104426 ms` |
| GitHub Actions | Intentionally unused (billing); not a coding blocker |

The cases cover: accepting valid same-college offering and delivery, rejecting wrong course/cohort/program/academic period/section college, rejecting same-college wrong cohort or term, validating cohort start/end period bounds including boundary dates and optional upper bound, and failing closed on absent scope IDs.

## Exact limits of what passed

This suite runs a **pure in-memory reference implementation**, not `scripts/sql/db05-offering-delivery-scope.draft.sql` on PostgreSQL and not actual vNext `offering-service.ts`/`delivery-service.ts` against a database. It cannot witness SQLSTATE 23514, trigger installation, FK checks, cross-session write races, ancestor reparenting, isolation, row locking, deadlocks or API authorization.

Separate structural GitHub-source checks of the SQL candidate against vNext offering and delivery service source returned 10/10 true, but these were executed connector-source inspections rather than Node tests. The standalone SQL candidate remains **UNREGISTERED** and may be integrated only by Chat 1 after disposable PostgreSQL acceptance.

**Formal DB05 source fields verified:** 0/92.  
**Independent main DB05 drafts:** 7, not registered.  
**Offering/delivery companion:** 1 non-numbered guard, not registered.  
**W01:** sole Drizzle journal/schema barrel owner.
