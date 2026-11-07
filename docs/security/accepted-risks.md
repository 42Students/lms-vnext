# Accepted risks (owner can overturn any line)

| Date | Item | Why accepted | Revisit |
|---|---|---|---|
| 2026-11-08 | Dependabot #1 esbuild `<0.25.0` (dev server lets any website read responses) via `@esbuild-kit/core-utils` 0.18.20, pulled in by `drizzle-kit` | Dev tooling only (`"dev": true` in the lockfile); not in the runtime image; nobody runs an esbuild dev server from this path; forcing 0.25 through `overrides` could break `drizzle-kit generate` | When `drizzle-kit` drops `@esbuild-kit` |
| 2026-11-08 | Dependabot #13 minimatch ReDoS (patched in 11.0.1) at 3.1.5 and 10.2.6 | Dev tooling only (eslint and typescript-eslint); minimatch 11 is a major jump that eslint plugins do not accept yet | Next ESLint major |
