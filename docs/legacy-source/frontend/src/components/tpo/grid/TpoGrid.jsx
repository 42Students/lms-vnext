import { useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community";
import { copyText, plainValue, toTsv } from "./gridExport";

// AG Grid Community (MIT), loaded only by the pages that use it (they import this file through next/dynamic).
ModuleRegistry.registerModules([AllCommunityModule]);

/** The grid themed to the TPO tokens (_tpo-tokens.scss). */
export const tpoGridTheme = themeQuartz.withParams({
  accentColor: "#0a7c88",
  foregroundColor: "#334155",
  headerTextColor: "#172033",
  borderColor: "#e7ecf2",
  headerBackgroundColor: "#f8fafc",
  oddRowBackgroundColor: "#ffffff",
  rowHoverColor: "#f1f8f9",
  selectedRowBackgroundColor: "#e6f4f5",
  fontFamily: "inherit",
  fontSize: 13,
  headerFontSize: 13,
  headerFontWeight: 600,
  rowHeight: 44,
  headerHeight: 40,
  wrapperBorderRadius: 10,
  spacing: 6,
});

// The checkbox column stays first, pinned with the name, so selecting never scrolls away.
const SELECTION_COLUMN = { pinned: "left", width: 48, maxWidth: 48, resizable: false, suppressHeaderMenuButton: true };

// Column headers never filter: filtering lives in each page's Filters panel and search (user, 5 Oct 2026), so a list is narrowed
// in one place only. And only numbers and dates sort (user, 6 Oct 2026): a column sorts when it says sortable: true or is a
// number column (type numericColumn / rightAligned); names, tags and text do not.
const DEFAULT_COL = { sortable: false, resizable: true, filter: false, floatingFilter: false, minWidth: 90 };
const isNumberColumn = (c) => /numericColumn|rightAligned/.test(String(c.type || ""));
const sortOnlyColumns = (columns) => (columns || []).map((c) => ({ ...c, sortable: c.sortable ?? isNumberColumn(c), filter: false, floatingFilter: false }));

/** Export-only columns (context.exportOnly) never show, whatever a saved layout or saved view remembers. */
const hideExportOnly = (api) => {
  const ids = (api?.getColumns?.() || []).filter((c) => c.getColDef().context?.exportOnly && c.isVisible()).map((c) => c.getColId());
  if (ids.length) api.setColumnsVisible(ids, false);
};

/** A click on something inside a cell that does its own thing (a link, a button, a field) is not a selection click. */
const isInteractive = (target) => Boolean(target?.closest?.("a, button, input, select, textarea, [role='button'], [role='menuitem'], .ant-select, .ant-tag-checkable"));

/** One cell as the grid shows it: a column's context.exportValue(row) when it has one, otherwise its formatted value. */
export function cellValue(api, node, column) {
  const def = column.getColDef();
  if (typeof def.context?.exportValue === "function") return plainValue(def.context.exportValue(node.data));
  let v;
  try { v = api.getCellValue({ rowNode: node, colKey: column, useFormatter: true }); } catch (_) { v = node.data?.[def.field]; }
  return plainValue(v);
}

/**
 * The TPO grid. Selection like a spreadsheet: tick boxes (the header box picks what is filtered), Shift-click a range, Ctrl/Cmd-click
 * single rows; Ctrl/Cmd+C copies the selected rows (or the focused cell) ready to paste into Excel; arrow keys move, Enter edits.
 * Column filters, resizing, ordering and hiding are remembered per grid (storageKey).
 *
 * Props: rows, columns (AG Grid colDefs; context.exportValue(row) sets what export/copy write), rowId(row), onSelection(rows),
 *        onCellChange(event), quickFilter, externalFilter(row) (side panel/search), onShownChange(rows), rowClassRules, getRowClass,
 *        onRowClicked(row, event), selectable (default true), autoHeight (grow with the rows instead of scrolling inside), height,
 *        storageKey, context (passed to cell renderers), noRowsText, onCopied(count).
 * handle (a ref object; next/dynamic does not forward refs): selectWhere(fn), clearSelection(), shownRows(), selectedRows(), table(),
 *        resetLayout(), setColumnVisible(id, on), columns(), columnState(), applyColumnState(state), copySelection().
 */
export default function TpoGrid({
  rows, columns, rowId, onSelection, onCellChange, quickFilter, height = 560, storageKey, externalFilter, onShownChange, rowClassRules, handle, context,
  getRowClass, onRowClicked, selectable = true, autoHeight = false, noRowsText = "Nothing matches", onCopied, onSelectionHidden,
}) {
  const sortOnlyCols = useMemo(() => sortOnlyColumns(columns), [columns]);
  const apiRef = useRef(null);
  const anchorRef = useRef(null); // the last row clicked without Shift, for Shift-click ranges
  const externalRef = useRef(externalFilter);
  externalRef.current = externalFilter;
  // The side panel or the search changed: run the grid's filters again.
  useEffect(() => { apiRef.current?.onFilterChanged(); }, [externalFilter]);

  const shownNodes = () => {
    const out = [];
    apiRef.current?.forEachNodeAfterFilterAndSort((n) => { if (n.data) out.push(n); });
    return out;
  };
  const shown = () => shownNodes().map((n) => n.data);

  /**
   * Untick the rows a filter or the search just hid, so what is selected is always what you can see: a hidden ticked row used to
   * stay selected, and Act, Export and Copy included students no longer on screen. Says how many were unticked.
   */
  const dropHiddenSelection = (api) => {
    if (!api || !selectable) return;
    const visible = new Set();
    api.forEachNodeAfterFilter((n) => { if (n.data) visible.add(n); });
    const hidden = api.getSelectedNodes().filter((n) => !visible.has(n));
    if (hidden.length) {
      api.setNodesSelected({ nodes: hidden, newValue: false });
      onSelectionHidden?.(hidden.length);
    }
  };
  const dataColumns = () => (apiRef.current?.getAllDisplayedColumns() || []).filter((c) => c.getColId() !== "ag-Grid-SelectionColumn");

  /** What export and copy write: the selection (in the order shown) or everything shown, in the columns shown. */
  const table = (onlySelected) => {
    const api = apiRef.current;
    if (!api) return { header: [], rows: [] };
    // The columns shown, plus any marked exportAlways (kept off the screen because another cell already shows them, but a
    // sheet needs them in their own column), in the grid's order.
    const all = (api.getColumns?.() || api.getAllGridColumns?.() || []).filter((c) => c.getColId() !== "ag-Grid-SelectionColumn");
    const cols = all.length ? all.filter((c) => c.isVisible() || c.getColDef().context?.exportAlways) : dataColumns();
    const picked = shownNodes().filter((n) => n.isSelected());
    const nodes = onlySelected === false || picked.length === 0 ? shownNodes() : picked;
    return {
      header: cols.map((c) => c.getColDef().headerName || c.getColDef().context?.exportTitle || c.getColId()),
      rows: nodes.map((n) => cols.map((c) => cellValue(api, n, c))),
      selected: picked.length,
    };
  };

  const copySelection = async (focusedOnly) => {
    const api = apiRef.current;
    if (!api) return 0;
    const picked = api.getSelectedNodes();
    if (!focusedOnly && picked.length > 0) {
      const t = table(true);
      if (await copyText(toTsv(t.header, t.rows))) onCopied?.(t.rows.length);
      return t.rows.length;
    }
    const cell = api.getFocusedCell();
    if (!cell || cell.rowPinned) return 0;
    const node = api.getDisplayedRowAtIndex(cell.rowIndex);
    if (!node?.data || cell.column.getColId() === "ag-Grid-SelectionColumn") return 0;
    if (await copyText(String(cellValue(api, node, cell.column)))) onCopied?.(1);
    return 1;
  };

  const saveLayout = useCallback(() => {
    if (!storageKey || !apiRef.current) return;
    try { window.localStorage.setItem(`tpo.grid.${storageKey}`, JSON.stringify(apiRef.current.getColumnState())); } catch { /* storage may be blocked */ }
  }, [storageKey]);

  useImperativeHandle(handle, () => ({
    selectWhere: (fn) => {
      const nodes = [];
      apiRef.current?.forEachNode((n) => { if (n.data && fn(n.data)) nodes.push(n); });
      apiRef.current?.setNodesSelected({ nodes, newValue: true });
      return nodes.length;
    },
    clearSelection: () => apiRef.current?.deselectAll(),
    shownRows: shown,
    selectedRows: () => apiRef.current?.getSelectedRows() || [],
    table,
    copySelection,
    resetLayout: () => {
      apiRef.current?.resetColumnState();
      try { window.localStorage.removeItem(`tpo.grid.${storageKey}`); } catch { /* ignore */ }
    },
    setColumnVisible: (id, on) => { apiRef.current?.setColumnsVisible([id], on); saveLayout(); },
    columns: () => (apiRef.current?.getColumnState() || []).map((c) => ({ id: c.colId, hidden: Boolean(c.hide) })),
    columnState: () => apiRef.current?.getColumnState() || [],
    applyColumnState: (state) => { if (Array.isArray(state)) { apiRef.current?.applyColumnState({ state, applyOrder: true }); hideExportOnly(apiRef.current); saveLayout(); } },
    refreshFilter: () => apiRef.current?.onFilterChanged(),
  }));

  const onGridReady = useCallback((e) => {
    apiRef.current = e.api;
    if (storageKey) {
      try {
        const saved = JSON.parse(window.localStorage.getItem(`tpo.grid.${storageKey}`) || "null");
        if (Array.isArray(saved)) e.api.applyColumnState({ state: saved, applyOrder: true });
      } catch { /* a bad saved layout is ignored */ }
    }
    hideExportOnly(e.api);
  }, [storageKey]);

  // Ctrl/Cmd-click adds or removes one row; Shift-click selects the range from the last row clicked. A plain click only moves the
  // anchor: it never throws away a selection someone built up.
  const onCellClicked = useCallback((e) => {
    const ev = e.event;
    if (!e.node?.data || e.column?.getColId() === "ag-Grid-SelectionColumn" || isInteractive(ev?.target)) {
      if (e.node?.rowIndex != null) anchorRef.current = e.node.rowIndex;
      return;
    }
    if (selectable && (ev?.ctrlKey || ev?.metaKey)) {
      e.node.setSelected(!e.node.isSelected());
      anchorRef.current = e.node.rowIndex;
      return;
    }
    if (selectable && ev?.shiftKey && anchorRef.current != null) {
      const from = Math.min(anchorRef.current, e.node.rowIndex);
      const to = Math.max(anchorRef.current, e.node.rowIndex);
      const nodes = [];
      for (let i = from; i <= to; i += 1) { const n = e.api.getDisplayedRowAtIndex(i); if (n?.data) nodes.push(n); }
      e.api.setNodesSelected({ nodes, newValue: true });
      window.getSelection?.()?.removeAllRanges?.();
      return;
    }
    anchorRef.current = e.node.rowIndex;
    onRowClicked?.(e.node.data, ev);
  }, [selectable, onRowClicked]);

  const onCellKeyDown = useCallback((e) => {
    const ev = e.event;
    if (!ev) return;
    const key = String(ev.key || "").toLowerCase();

    // Rows that open a detail workspace on pointer click must have the same path from the
    // keyboard. AG Grid already owns arrows/Tab/Space for navigation and selection, so Enter
    // is the non-conflicting activation key. Do not hijack Enter for editable or nested controls.
    if (
      key === "enter" &&
      onRowClicked &&
      e.node?.data &&
      !e.column?.getColDef?.()?.editable &&
      !isInteractive(ev.target)
    ) {
      ev.preventDefault?.();
      onRowClicked(e.node.data, ev);
      return;
    }

    if (!(ev.ctrlKey || ev.metaKey)) return;
    if (key === "c" && !window.getSelection?.()?.toString()) { ev.preventDefault?.(); copySelection(); }
    if (key === "a" && selectable) { ev.preventDefault?.(); e.api.selectAll("filtered"); }
  }, [selectable, onRowClicked]); // eslint-disable-line react-hooks/exhaustive-deps

  const rowSelection = useMemo(() => (selectable ? {
    mode: "multiRow", checkboxes: true, headerCheckbox: true, selectAll: "filtered", enableClickSelection: false,
  } : undefined), [selectable]);

  return (
    <div className={`tpo-grid${autoHeight ? " is-auto" : ""}`} style={autoHeight ? undefined : { height }} data-testid="tpo-grid">
      <AgGridReact
        theme={tpoGridTheme}
        rowData={rows}
        columnDefs={sortOnlyCols}
        defaultColDef={DEFAULT_COL}
        getRowId={(p) => String(rowId(p.data))}
        rowSelection={rowSelection}
        selectionColumnDef={selectable ? SELECTION_COLUMN : undefined}
        quickFilterText={quickFilter}
        onGridReady={onGridReady}
        onSelectionChanged={(e) => onSelection?.(e.api.getSelectedRows())}
        onCellValueChanged={onCellChange}
        onCellClicked={onCellClicked}
        onCellKeyDown={onCellKeyDown}
        onFilterChanged={(e) => { dropHiddenSelection(e.api); onShownChange?.(shown()); }}
        onRowDataUpdated={() => onShownChange?.(shown())}
        onModelUpdated={() => onShownChange?.(shown())}
        onColumnMoved={saveLayout}
        onColumnResized={(e) => { if (e.finished) saveLayout(); }}
        onColumnVisible={saveLayout}
        onColumnPinned={saveLayout}
        onSortChanged={saveLayout}
        isExternalFilterPresent={() => Boolean(externalRef.current)}
        doesExternalFilterPass={(node) => (externalRef.current ? externalRef.current(node.data) : true)}
        rowClassRules={rowClassRules}
        getRowClass={getRowClass ? (p) => (p.data ? getRowClass(p.data) : undefined) : undefined}
        context={context}
        domLayout={autoHeight ? "autoHeight" : "normal"}
        singleClickEdit
        stopEditingWhenCellsLoseFocus
        enterNavigatesVerticallyAfterEdit
        enableCellTextSelection
        ensureDomOrder
        animateRows={false}
        suppressDragLeaveHidesColumns
        maintainColumnOrder
        suppressColumnVirtualisation
        tooltipShowDelay={300}
        overlayNoRowsTemplate={`<span class='tpo-grid__empty'>${String(noRowsText).replace(/[<>&]/g, "")}</span>`}
      />
    </div>
  );
}
