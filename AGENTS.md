# LMS vNext engineering rules

This repository is optimized for a solo developer working heavily with AI coding agents.

## Non-negotiable architecture rules

- Keep one repository and one deployable application.
- Keep the system a modular monolith.
- TypeScript is the application language.
- PostgreSQL is the system of record.
- Do not add microservices, Redis, Pub/Sub, Kafka, GKE, GraphQL, or a second database without a demonstrated production requirement.
- Do not split frontend and backend into separate repositories.
- Do not port legacy Java classes file-for-file.
- Preserve business behavior, not legacy implementation structure.

## Module rules

- Core business logic belongs in `src/modules/*`.
- React components should orchestrate UI, not encode domain invariants.
- Validate untrusted inputs with Zod at boundaries.
- Authorization must be explicit and centralized; avoid scattered role string checks.
- Tenant-owned data must be scoped by college/tenant context.
- Database access must use shared pooled Drizzle/Postgres infrastructure.
- New abstractions require a concrete use case.

## Quality gates

Before merging meaningful changes:

1. lint
2. typecheck
3. unit tests
4. build
5. relevant Playwright flows for user-facing behavior

Every migrated legacy rule should gain a regression test where practical.

## Migration principle

For each legacy feature:

1. understand current behavior
2. classify it as business rule, intentional legacy behavior, or bug
3. design the vNext domain model
4. implement cleanly
5. verify against the legacy system
6. migrate data separately
7. cut over only after reconciliation

Never preserve a bug merely because production currently behaves that way.

## UI visual identity rules

- The existing LMS production palette is the vNext color source of truth.
- Canonical mapping lives in `docs/design-system/lms-color-parity.md` and `src/app/globals.css`.
- Use semantic LMS tokens instead of raw Tailwind zinc/slate/blue palettes for product UI.
- Never accept shadcn default colors as a substitute for the LMS brand palette.
- Do not introduce a new raw UI color without a concrete semantic need and a documented parity decision.
- Treat palette mismatch as an implementation defect in the same batch, not later polish.


## Greenfield data rule

- LMS vNext is a fresh system. No production/legacy LMS data needs to be migrated.
- Do not build legacy DB connections, extractors, reconciliation tooling, migration runners, or data backfills unless the user explicitly changes this decision later.
- The legacy `lms` / `lms2-fe` repositories remain behavior, UX and regression references only.
- New vNext data should be created through vNext application flows, seeds, fixtures, or test factories.
- The existing `legacy_id_map` schema artifact is not an active product dependency and must not be used as justification to restart migration work.
