# Domain modules

Business capabilities live under this directory.

A module may contain schema/types, validation, queries, domain services, permissions, server adapters, owned UI components, and tests.

Rules:

1. React components do not contain core business rules.
2. Modules may depend on platform primitives, but avoid circular module dependencies.
3. Cross-module behavior must have an explicit service boundary.
4. Do not recreate Java/Spring ceremony in TypeScript.
5. A new abstraction needs a real use case before it is added.
