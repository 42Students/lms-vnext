# LMS vNext

The next-generation 42Students LMS, rebuilt as a GCP-native TypeScript modular monolith.

## Core stack

- Next.js + TypeScript
- React
- Tailwind CSS
- shadcn/ui conventions
- Zod
- Drizzle ORM
- PostgreSQL on Google Cloud SQL
- Google Cloud Identity Platform
- Google Cloud Storage
- Google Cloud Run

## Architecture principle

One repository, one application, one language, one relational database.

Business logic lives in domain modules rather than React components. Infrastructure is added only when a real production requirement needs it.

## Current status

Foundation setup in progress. No legacy LMS feature has been migrated yet.
