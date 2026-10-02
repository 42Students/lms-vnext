# Legacy LMS to vNext migration strategy

The existing `42Students/lms` and `42Students/lms2-fe` repositories are references and behavior oracles. They are not templates to translate line-by-line.

## Migration sequence

1. Foundation
2. Identity, colleges, roles, permissions, departments
3. Academic core
4. Projects
5. Placements / TPO / HR
6. Admin / superadmin workflows
7. Activity, analytics, notifications
8. AI capabilities
9. Legacy retirement

## Per-feature migration loop

For each capability:

1. Inspect the existing backend and frontend.
2. Document inputs, outputs, permissions, validation, state transitions, side effects, and edge cases.
3. Classify existing behavior as a business rule, intentional legacy behavior, or bug.
4. Design the new relational model and domain API.
5. Write regression tests for important rules.
6. Implement the TypeScript domain service and UI.
7. Build explicit, repeatable data migration scripts.
8. Reconcile old and new outputs using production-like data.
9. Cut over the capability.
10. Remove legacy code only after the new path is stable.

## Safety principles

- Never perform a big-bang rewrite.
- Never silently discard malformed legacy data.
- Migration scripts must be repeatable and produce reconciliation reports.
- Authentication and tenant isolation get migrated before business modules.
- Projects and Placements are intentionally not the first migration targets because of their complexity.
