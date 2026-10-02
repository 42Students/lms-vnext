# LMS vNext architecture

## Goal

Build an LMS that a solo developer can understand, change, test, and operate with low cognitive overhead while comfortably serving the expected college footprint.

## Core production shape

```text
Browser
   |
Next.js + TypeScript
   |
Domain modules
   |
Drizzle
   |
Cloud SQL PostgreSQL

Managed platform services:
- Cloud Run: application hosting
- Identity Platform: authentication
- Cloud Storage: files
- Vertex AI: only for features that require AI
```

Cloud Tasks, Cloud Scheduler, Cloud Run Jobs, Redis, or other services are not baseline dependencies. Add them only when an observed workload requires them.

## Application boundaries

`src/app`
- Next.js routing, layouts, route handlers, page composition.

`src/modules`
- Business capabilities and domain rules.

`src/db`
- Shared database client and schemas.

`src/lib`
- Small platform utilities with no domain ownership.

## Design constraints

### Modular monolith

The application deploys as one Cloud Run service. Domain modules are code boundaries, not network boundaries.

### One language

Frontend, server code, validation, domain services, tests, and AI tools use TypeScript.

### PostgreSQL first

PostgreSQL is the source of truth for colleges, users, academics, projects, placements, permissions, and activity.

### Tenant isolation

Tenant-owned records should carry an explicit college/tenant identifier. All reads and writes must execute in an authenticated tenant context.

### Managed infrastructure

Prefer GCP-managed services where managing the capability ourselves would create operational burden.

### No premature scale architecture

Registered-user count alone is not justification for distributed systems. Optimize queries, indexes, connection pools, and hot workflows before adding infrastructure.

## Initial database policy

The foundation intentionally contains no copied legacy LMS tables. The schema will be designed domain-by-domain after legacy behavior is understood.
