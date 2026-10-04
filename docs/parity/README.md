# LMS vNext — Detailed Page Parity Specs

**Purpose:** make it impossible to finish a route while silently missing sections, actions, forms, filters, modals, drawers, states or role/tenant behavior.

**Legacy oracle:** `42Students/lms2-fe@prod-2026`  
**Frozen baseline for this audit:** `38cdd38e592a6f416c8e8e99ce36438f548ed577`

The master route/surface matrix is `docs/planning/account-surface-parity.md`. These files are the **second level of truth** beneath it.

## Files

- `learner.md`
- `faculty.md`
- `mentor.md`
- `college-admin.md`
- `super-admin.md`
- `tpo.md`
- `hr.md`
- `shared-public-ops.md`

## Rule for closing a page

A master-matrix row may not be considered deeply closed until its page spec has accounted for:

1. destination / navigation / deep links;
2. all visible sections, tabs, cards and KPI/summary blocks;
3. primary and secondary actions;
4. forms and validation;
5. modals, drawers, popovers and confirmation flows;
6. filters, search, sort, pagination and URL-state behavior;
7. loading, empty, partial-data, stale-data and error states;
8. permissions, role fences, tenant/college scope and read-only states;
9. destructive-action consequences and audit/history where applicable;
10. responsive/mobile behavior that changes the user workflow;
11. regression coverage.

Each closure item uses a markdown checkbox. Run:

```bash
npm run parity:pages
npm run parity:pages -- --json
```

A page is not complete because its route renders. A page is complete only when every required checkbox is checked, or the item is explicitly replaced by a documented REDESIGNED/RETIRED decision in the master matrix.

## Implementation discipline

- Re-open the exact legacy route/component before implementing that page; these specs are an audited map, not a substitute for reading source.
- Update the relevant page spec in the **same commit** that closes an item.
- Do not check a box for code that exists but has not been compared against the legacy user job.
- Do not check a box for authored tests if they did not actually run.
- If legacy `prod-2026` moves materially, update the route manifest, master matrix and affected page specs before unrelated parity work.
