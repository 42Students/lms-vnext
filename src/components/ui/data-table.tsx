import type { ReactNode } from "react";
import { cx } from "@/lib/class-names";

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  className?: string;
};

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  empty,
}: {
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        {empty ?? (
          <p className="m-0 text-sm text-muted-foreground">
            No records found.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  "border-b border-border px-4 py-3 font-semibold text-body",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-border last:border-b-0 hover:bg-primary-subtle/60"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "px-4 py-3 align-middle text-body",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
