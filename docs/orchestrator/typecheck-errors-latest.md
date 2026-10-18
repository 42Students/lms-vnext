# Compile errors on main (from the rolling cloud typecheck). Fix the ones in YOUR files first, before anything else.

Lanes cannot run tsc, so these show up only in cloud CI. Typical causes: a test passes a plain string where a union literal type is required (use `as const`), a test reads a property the function does not return, wrong argument shape for a schema.

- tests/integration/placements-p8-offers.test.ts (470): property `id` does not exist on the offer record type (it returns `offerId`). Owner: chat-5.
- tests/unit/HR-BREAK-profile-01.test.ts (37-40): argument `{companyId, grants:[{collegeId, companyRelationshipId}]}` is not assignable to the function's parameter type; read the real parameter type and fix the fixtures. Owner: chat-19 or chat-15.
- tests/unit/chat11-college-projects-role-journeys.test.ts (98): `"DISABLED"` is not assignable to `"ACTIVE" | "SUSPENDED" | "ENDED"`; use a valid status. Owner: chat-11.

The orchestrator updates this file as new errors appear. Newest first rule: if a file is not listed here but your push broke typecheck, you will see the error in the next update.
