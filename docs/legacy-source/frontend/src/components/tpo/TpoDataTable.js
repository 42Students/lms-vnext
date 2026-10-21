import { useMemo } from "react";
import HeaderFilter from "@/components/tpo/grid/HeaderFilter";
import { choiceEditor } from "@/components/tpo/grid/ChoiceEditor";
import { Modal } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import GridWorkspace from "@/components/tpo/grid/GridWorkspace";
import { plainValue } from "@/components/tpo/grid/gridExport";
import { PanelEmpty } from "@/components/Common/PanelStates";

/** A search/filter returning nothing reads very differently to "there is genuinely nothing here
 * yet" — different message, and a next-step CTA (if any) only makes sense in the second case.
 * Exported and pure so this decision is unit-testable. */
export function isTpoDataTableFiltered(q, filters) {
  return Boolean((q || "").trim()) || Boolean(filters && Object.values(filters).some((v) => v != null && v !== "" && v !== false && v !== "ALL"));
}

const valueAt = (dataIndex) => (row) => {
  if (dataIndex == null || row == null) return undefined;
  return Array.isArray(dataIndex) ? dataIndex.reduce((o, k) => o?.[k], row) : row[dataIndex];
};

/** Numbers as numbers, text in natural order ("Batch 2" before "Batch 10"), empty last. */
const compareShown = (a, b) => {
  if (a === "" || a == null) return b === "" || b == null ? 0 : 1;
  if (b === "" || b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

/** An antd-style render(value, record, index) inside a grid cell. */
function RenderCell(p) {
  if (!p.data) return null;
  return p.renderFn(p.get(p.data), p.data, p.node?.rowIndex ?? 0);
}

/**
 * Turns the antd-style columns every TPO page already declares into grid columns, so each page keeps its own column code:
 * title, dataIndex, key, render, sorter, width, fixed: "left", align: "right", exportValue(row), defaultHidden, edit (see below).
 */
export function toGridColumns(columns) {
  return (columns || []).map((c, i) => {
    const get = valueAt(c.dataIndex);
    const id = String(c.key || (Array.isArray(c.dataIndex) ? c.dataIndex.join(".") : c.dataIndex) || `col${i}`);
    const exportValue = c.exportValue || (c.dataIndex != null ? get : null);
    const title = typeof c.title === "string" ? c.title : (c.exportTitle || "");
    const def = {
      colId: id,
      headerName: title,
      valueGetter: (p) => (p.data ? get(p.data) : undefined),
      // Only numbers and dates sort (user, 6 Oct 2026: a sort arrow on a name or a status looks odd): a column sorts when it
      // has a sorter, says sortable: true, or is right-aligned (every number column is).
      sortable: Boolean(title) && (typeof c.sorter === "function" || c.sortable === true || c.align === "right"),
      // A column without a title (row actions) has nothing to filter or sort by.
      filter: title && exportValue ? "agTextColumnFilter" : false,
      suppressHeaderMenuButton: !title,
      filterValueGetter: exportValue ? (p) => String(plainValue(exportValue(p.data)) ?? "") : undefined,
      // A column with no heading on screen (row actions) can still name itself in an export.
      context: exportValue ? { exportValue, exportTitle: c.exportTitle, exportAlways: Boolean(c.exportAlways || c.exportOnly), exportOnly: Boolean(c.exportOnly) } : undefined,
      // exportOnly: never on screen or in Columns, always in an export (marks on the student sheets).
      hide: Boolean(c.defaultHidden || c.exportOnly),
      ...(c.exportOnly ? { lockVisible: true } : {}),
      // headerFilterKey: a selector in the heading, the same filter as the side panel (HeaderFilter).
      ...(c.headerFilterKey ? { headerComponent: HeaderFilter, headerComponentParams: { filterKey: c.headerFilterKey } } : {}),
    };
    if (typeof c.sorter === "function") def.comparator = (_a, _b, na, nb) => c.sorter(na.data, nb.data);
    else if (c.dataIndex == null && c.exportValue) def.comparator = (_a, _b, na, nb) => compareShown(plainValue(c.exportValue(na.data)), plainValue(c.exportValue(nb.data)));
    if (c.render) {
      def.cellRenderer = RenderCell;
      def.cellRendererParams = { renderFn: c.render, get };
      def.autoHeight = true;
      def.wrapText = true;
      def.cellClass = "tpo-grid__cell--rich";
    }
    // Edit in the cell: edit = { options: [{ value, label }], valueOf(row), onChange(row, value), editable?(row) }. The grid never
    // changes the row itself: the page saves and reloads, so what is shown is always what was saved.
    if (c.edit) {
      def.editable = (p) => Boolean(p.data) && (!c.edit.editable || c.edit.editable(p.data));
      def.valueGetter = (p) => (p.data ? c.edit.valueOf(p.data) : undefined);
      Object.assign(def, choiceEditor(c.edit.options));
      def.refData = Object.fromEntries(c.edit.options.map((o) => [String(o.value), o.label]));
      def.valueSetter = (p) => { if (p.newValue !== p.oldValue && p.newValue != null) c.edit.onChange(p.data, p.newValue); return false; };
      def.cellClass = `${def.cellClass || ""} is-editable`.trim();
      def.headerTooltip = c.edit.hint || "Click a cell to change it";
    }
    if (c.width) def.width = typeof c.width === "number" ? c.width : parseInt(c.width, 10) || undefined;
    else { def.flex = 1; def.minWidth = 130; }
    // The first column (the name) stays frozen on the left, like Excel's frozen first column.
    if (c.fixed === "right") def.pinned = "right";
    else if (c.fixed || i === 0) def.pinned = "left";
    if (c.align === "right") { def.type = "rightAligned"; if (def.cellClass) def.cellClass += " is-right"; }
    if (i === 0) def.lockVisible = true;
    return def;
  });
}

/**
 * The shared TPO table (TPO V1 - Locked.docx §1), now on the spreadsheet grid: search that lives in the page address, filters on
 * every column, Shift/Ctrl selection, copy rows (Ctrl+C), saved views, column chooser, Excel/CSV export, a bulk bar and counts.
 * Every list in the TPO product uses it, so behaviour is the same everywhere.
 *
 * Props (unchanged for the pages):
 *  - columns: antd-style columns (see toGridColumns); give a column `exportValue: (row) => any` to control what export/copy write
 *  - searchOf(row): the text a row is searched by
 *  - bulk(selectedRows, clear): node shown when rows are ticked (run actions through bulk/BulkAction: preview, result, undo, record)
 *  - viewScope: "STUDENTS" | "LEADS" | "DRIVES" | ... to enable saved views; filters/onApplyFilters carry the caller's own filter state
 *  - exportName, toolbar, onRow(record) ({ onClick }), rowClassName(record), loading
 *  - emptyTitle/emptySubtitle/emptyCtaLabel/onEmptyCta: shown when there are no rows at all
 *  - filterDefs/filterState/onFilterChange: the shared filter side panel (filters/filterModel definitions; keep the state in the
 *    page address with useUrlFilters). Pass the whole list as data: the panel's counts follow the other filters.
 *  - compact: a small list inside a page or a modal (no saved views or column chooser); searchInUrl=false inside modals/tabs
 *    so two lists on one page never share the ?q= search
 */
export default function TpoDataTable({
  columns, data, rowKey, loading, searchOf, bulk, viewScope, filters, onApplyFilters, exportName, toolbar, onRow, rowClassName,
  emptyTitle, emptySubtitle, emptyCtaLabel, onEmptyCta, testid, compact = false, searchInUrl = true, height, selectable = true, exportable = true,
  filterDefs, filterState, onFilterChange, filterTitle, top, act, counts, scope,
}) {
  const gridColumns = useMemo(() => toGridColumns(columns), [columns]);
  const rowId = useMemo(() => (typeof rowKey === "function" ? rowKey : (r) => r?.[rowKey]), [rowKey]);
  const rows = useMemo(() => data || [], [data]);
  const pageFiltered = useMemo(() => isTpoDataTableFiltered("", filters), [filters]);
  const empty = pageFiltered
    ? <PanelEmpty icon={InboxOutlined} title="No rows match the current filters" subtitle="Adjust or clear the page filters to see more rows." />
    : <PanelEmpty icon={InboxOutlined} title={emptyTitle || "Nothing here yet"} subtitle={emptySubtitle} ctaLabel={emptyCtaLabel} onCta={onEmptyCta} />;

  return (
    <GridWorkspace
      testid={testid || "tpo-datatable"}
      rows={rows}
      columns={gridColumns}
      rowId={rowId}
      searchOf={searchOf}
      searchPlaceholder="Search"
      storageKey={`table-${viewScope || exportName || "list"}`}
      exportName={exportName}
      viewScope={viewScope}
      defs={filterDefs}
      filters={filterState}
      setFilters={onFilterChange}
      filterTitle={filterTitle || "Filters"}
      viewExtra={filters}
      onApplyViewExtra={onApplyFilters}
      tools={toolbar}
      bulk={bulk}
      top={top}
      act={act}
      counts={counts}
      scope={scope}
      onRowClicked={onRow ? (row, ev) => onRow(row)?.onClick?.(ev) : undefined}
      getRowClass={rowClassName}
      loading={loading}
      empty={empty}
      height={height || "calc(100vh - 320px)"}
      compact={compact}
      exportable={exportable}
      searchInUrl={searchInUrl}
      selectable={selectable}
    />
  );
}

/**
 * Bulk actions on more than 25 people ask first, naming the count, the action and a few sample names
 * (TPO V1 - Locked.docx §1 principles). Call instead of running the action directly.
 */
export function confirmBulk({ count, action, sampleNames, run }) {
  if (count <= 25) { run(); return; }
  Modal.confirm({
    title: `${action} ${count} people?`,
    content: `Including ${sampleNames.slice(0, 3).join(", ")}${count > 3 ? " and others" : ""}. Please check the list before you continue.`,
    okText: "Yes, continue",
    onOk: run,
  });
}
