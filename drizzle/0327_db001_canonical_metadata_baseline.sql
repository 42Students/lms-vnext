-- DB001 provenance-only Drizzle snapshot baseline. All represented tables/columns/typed FKs already exist in registered PG17.
-- Never apply generator output containing duplicate CREATE TABLE/ALTER operations.
-- SQL-only FKs, tenant triggers, checks, indexes and histories remain authoritative in registered migrations.
SELECT 1;
