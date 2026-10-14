import { sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

type ColumnValue<T extends AnyColumn> =
  T["_"]["notNull"] extends true
    ? T["_"]["data"]
    : T["_"]["data"] | null;

/**
 * Selects a column under a unique alias so a Drizzle subquery that joins
 * several tables never exposes two output columns with the same name
 * (Postgres 42702 "column reference is ambiguous" when the subquery is reused).
 */
export function aliasedColumn<T extends AnyColumn>(
  column: T,
  alias: string,
): SQL.Aliased<ColumnValue<T>> {
  return sql<ColumnValue<T>>`${column}`.mapWith(column).as(alias);
}
