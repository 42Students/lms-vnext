import type { TpoGridColumn } from "@/modules/placements/tpo-grid-model";

export type TpoGridSort = { key: string; direction: "asc" | "desc" };
export type TpoGridSortableColumn<Row> = TpoGridColumn<Row> & {
  sortKind?: "number" | "date";
};

/** Text columns deliberately remain unsortable, as in the old TPO sheet. */
export function sortTpoGridRows<Row>(
  rows: readonly Row[],
  columns: readonly TpoGridSortableColumn<Row>[],
  sort: TpoGridSort | null,
): Row[] {
  if (!sort) return [...rows];
  const column = columns.find(item => item.key === sort.key && item.sortKind);
  if (!column || !column.sortKind) return [...rows];
  const compare = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined || value === "") return null;
    if (column.sortKind === "number") {
      const numeric = typeof value === "number" ? value : Number(String(value).replaceAll(/[,%]/g, ""));
      return Number.isFinite(numeric) ? numeric : null;
    }
    const timestamp = typeof value === "number" ? value : Date.parse(String(value));
    return Number.isFinite(timestamp) ? timestamp : null;
  };
  const direction = sort.direction === "asc" ? 1 : -1;
  return rows.map((row, index) => ({ row, index })).sort((a, b) => {
    const av = compare(column.read(a.row));
    const bv = compare(column.read(b.row));
    if (av === null || bv === null) return av === bv ? a.index - b.index : av === null ? 1 : -1;
    return direction * (av - bv) || a.index - b.index;
  }).map(item => item.row);
}
