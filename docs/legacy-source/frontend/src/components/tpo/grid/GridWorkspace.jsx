import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { Alert, Badge, Button, Checkbox, Dropdown, Input, Modal, Popover, Tooltip, Typography, message } from "antd";
import { AppstoreOutlined, CheckOutlined, CopyOutlined, DownloadOutlined, FilterOutlined, SaveOutlined, SettingOutlined, SnippetsOutlined, StarFilled, TableOutlined } from "@ant-design/icons";
import moment from "moment";
import FilterPanel, { FilterChips } from "@/components/tpo/filters/FilterPanel";
import { activeCount, isActive, passes } from "@/components/tpo/filters/filterModel";
import { parseRolls } from "@/components/tpo/ui/rollParser";
import { useDebouncedValue } from "@/components/tpo/ui/useDebouncedValue";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { deleteView, getSavedViews, markViewUsed, saveView, updateView } from "@/api/Services/TpoHubService";
import SavedViewsManager, { lastTouched } from "./SavedViewsManager";
import { bodyOf, factsOf, memoryOf, rulesLine, sameEverything, sameList, sortOf, suggestName } from "./viewMemory";
import { exportCsv, exportXlsx } from "./gridExport";
import { GridFilterContext } from "./HeaderFilter";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

// AG Grid only loads on the pages that use it, and only in the browser.
const TpoGrid = dynamic(() => import("@/components/tpo/grid/TpoGrid"), { ssr: false, loading: () => <TableSkeleton rows={8} columns={6} label="Loading data grid" /> });

const NO_DEFS = [];
const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const MAX_PINNED = 5; // pinned views in the Views menu (the backend allows the same)
const RECENT_WHEN_NONE_PINNED = 3;
/** A saved view's stored body: { panel, q, columns, extra } (old views kept a page's own filters at the top level). */
/** A saved view's body: { panel, q, columns, extra, note, savedCount, savedAt, memory } (old views read as page filters). */
const viewBody = bodyOf;
/** Whether a page's own filters (kept in "extra") narrow the list: then only opening the view can count it exactly. */
const hasExtra = (extra) => Boolean(extra) && Object.values(extra).some((v) => v !== null && v !== undefined && v !== "" && v !== false
  && !(Array.isArray(v) && v.length === 0) && !(typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0));
const AUTO_HEIGHT_ROWS = 30; // up to this many rows the grid grows with them; more scroll inside a fixed height
const asTableColumns = (t) => t.header.map((title, i) => ({ title, value: (row) => row[i] }));

/**
 * A list page's working area, the same on every TPO table: search (kept in the page address), the filter side panel and chips, paste
 * roll numbers to select, saved views, column chooser, export to Excel or CSV (the selection, or what is shown), copy rows
 * (Ctrl/Cmd+C), counts that are always visible, and a bulk bar for the selection.
 *
 * Props: rows, columns (AG Grid colDefs), rowId, defs/filters/setFilters (side panel; optional), searchOf(row) (search text;
 *        optional, else the grid's own quick search), storageKey, exportName, viewScope (saved views), viewExtra/onApplyViewExtra
 *        (a page's own filters stored in a view), searchPlaceholder, height, autoHeight, top, tools, counts(shown, selected),
 *        bulk(selected, clear), onCellChange, rowClassRules, getRowClass, onRowClicked, selectable, rollOf(row) (paste to select),
 *        empty (node shown when there are no rows at all), loading, handle (ref, optional), filterTitle, scope(rows, state), context,
 *        searchInUrl (default true), testid, compact (small embedded lists: no saved views or column chooser, search only past 10 rows),
 *        act(shown, selected, clear) (an always-visible action bar for what is shown or selected; replaces the selection-only bulk bar).
 * Filter definitions with panel: false are set elsewhere on the page (top selectors): they filter and show as chips, not in the panel.
 * A column with headerComponent HeaderFilter gets a selector in its heading, bound to the same filters (GridFilterContext).
 */
export default function GridWorkspace({
  rows, columns, rowId, defs = NO_DEFS, filters, setFilters, storageKey, exportName, searchPlaceholder = "Search", height = "calc(100vh - 360px)",
  autoHeight, top, tools, counts, bulk, onCellChange, rowClassRules, getRowClass, onRowClicked, handle: outerHandle, filterTitle = "Filters", scope,
  children, testid, context, searchOf, searchInUrl = true, viewScope, viewExtra, onApplyViewExtra, selectable = true, pasteRolls = true,
  rollOf = (r) => r?.rollNumber, empty, loading, compact = false, act, exportable = true,
}) {
  // No router (a modal rendered on its own, a test): the search simply stays in the box instead of the address.
  let router = null;
  try { router = useRouter(); } catch (_) { router = null; } // eslint-disable-line react-hooks/rules-of-hooks
  const innerHandle = useRef(null);
  const handle = outerHandle || innerHandle;
  const [selected, setSelected] = useState([]);
  const [shown, setShown] = useState(null);
  const urlQ = searchInUrl && typeof router?.query?.q === "string" ? router.query.q : "";
  const [typed, setTyped] = useState(urlQ);
  const search = useDebouncedValue(typed, 200);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [views, setViews] = useState([]);
  const [viewsLoading, setViewsLoading] = useState(false);
  const [viewsError, setViewsError] = useState("");
  const viewsRequestRef = useRef(0);
  const viewsScopeRef = useRef(null);
  const [viewId, setViewId] = useState(null);
  const [naming, setNaming] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [viewBusy, setViewBusy] = useState(null); // "pin:12", "xlsx:12" ... while that action runs
  const [viewName, setViewName] = useState("");
  const [viewNote, setViewNote] = useState("");
  const nameInputRef = useRef(null);
  const [, setColumnsTick] = useState(0);
  // Stable when a page has no side panel: a fresh {} on every render re-ran the grid's filter, which reported what it shows, which
  // rendered again - an endless loop on every page without filters.
  const panelFilters = useMemo(() => filters || {}, [filters]);
  // Only a real change in what is shown re-renders the counts (the grid reports on every model update).
  const setShownIfChanged = useCallback((next) => {
    setShown((prev) => {
      if (prev && prev.length === next.length && prev.every((r, i) => r === next[i])) return prev;
      return next;
    });
  }, []);

  // The search lives in the page address (?q=), so a searched list can be shared or comes back on refresh.
  useEffect(() => { if (searchInUrl) setTyped(urlQ); }, [urlQ, searchInUrl]);
  useEffect(() => {
    if (!searchInUrl || !router || search === urlQ) return;
    const query = { ...router.query };
    if (search) query.q = search; else delete query.q;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const externalFilter = useMemo(() => {
    const active = defs.filter((d) => isActive(d, panelFilters[d.key]));
    const scoped = scope ? new Set(scope(rows || [], panelFilters).map(rowId).map(String)) : null;
    const needle = searchOf ? search.trim().toLowerCase() : "";
    if (active.length === 0 && !scoped && !needle) return null;
    return (row) => (!scoped || scoped.has(String(rowId(row))))
      && (!needle || String(searchOf(row) ?? "").toLowerCase().includes(needle))
      && active.every((d) => passes(d, panelFilters[d.key], row));
  }, [defs, panelFilters, scope, rows, rowId, searchOf, search]);

  // ---- saved views ----------------------------------------------------------------------------------------------------------
  const loadViews = useCallback(async () => {
    const requestId = ++viewsRequestRef.current;
    if (!viewScope) {
      viewsScopeRef.current = null;
      setViews([]);
      setViewId(null);
      setViewsError("");
      setViewsLoading(false);
      return;
    }
    const scopeChanged = viewsScopeRef.current !== viewScope;
    if (scopeChanged) {
      setViews([]);
      setViewId(null);
    }
    setViewsError("");
    setViewsLoading(true);
    const res = await fetchWithErrorHandling(getSavedViews(viewScope));
    if (requestId !== viewsRequestRef.current) return;
    if (!res.success || !Array.isArray(res?.data)) {
      setViewsError(errorText(res, "Could not load saved views. Your current table is unchanged."));
      setViewsLoading(false);
      return;
    }
    setViews(res.data);
    viewsScopeRef.current = viewScope;
    setViewsLoading(false);
  }, [viewScope]);
  useEffect(() => {
    loadViews();
    return () => { ++viewsRequestRef.current; };
  }, [loadViews]);

  const applyView = (id) => {
    setViewId(id ?? null);
    const v = views.find((x) => x.id === id);
    if (!v) return;
    try {
      const f = typeof v.filters === "string" ? JSON.parse(v.filters) : v.filters || {};
      // Views saved by the old table stored the page's own filters at the top level; newer ones keep them under "extra".
      const isNew = f && (f.panel || f.columns || f.extra);
      if (isNew) {
        if (setFilters && f.panel) setFilters(f.panel);
        if (f.columns) handle.current?.applyColumnState(f.columns);
        if (f.extra) onApplyViewExtra?.(f.extra);
      } else {
        onApplyViewExtra?.(f);
      }
      setTyped(f.q || "");
    } catch (_) { /* a damaged view is ignored */ }
    // Remembered for the recent list and the "not used" mark; a failure here never gets in the way.
    fetchWithErrorHandling(markViewUsed(id)).then(() => {});
    setViews((list) => list.map((x) => (x.id === id ? { ...x, lastUsedAt: new Date().toISOString() } : x)));
  };
  /** How many the list holds now: what the table shows, or worked out from the filters before the table has reported. */
  const countNow = () => (shown ? shown.length : countOf({ filters: { panel: panelFilters, q: typed, extra: viewExtra } }) ?? (rows || []).length);
  /**
   * What is on screen now, as a view keeps it: filters, search, columns, page filters, the note, how many it held, and its
   * description in words (memory), captured now so it stays right later.
   */
  const currentBody = (note) => {
    const columnState = handle.current?.columnState?.() || [];
    return {
      panel: panelFilters, q: typed || "", columns: columnState, extra: viewExtra || {},
      ...(note !== undefined ? { note: String(note).trim() } : {}),
      savedCount: countNow(), savedAt: new Date().toISOString(),
      memory: memoryOf({ defs, panel: panelFilters, rows, extra: viewExtra, q: typed, columns, columnState }),
    };
  };
  const nameTaken = (name, exceptId) => views.some((v) => v.id !== exceptId && String(v.name || "").trim().toLowerCase() === String(name || "").trim().toLowerCase());
  // BE-0121: one save at a time, whether it came from the Save button or Enter in the name box.
  const savingView = useRef(false);
  const saveCurrent = async () => {
    const name = viewName.trim();
    if (!name || nameTaken(name) || savingView.current) return;
    savingView.current = true;
    try {
      const res = await fetchWithErrorHandling(saveView({ scope: viewScope, name, filters: currentBody(viewNote) }));
      if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not save the view"); return; }
      message.success(`Saved "${name}"`);
      setNaming(false); setViewName(""); setViewNote(""); await loadViews();
    } finally {
      savingView.current = false;
    }
  };
  // The save dialog: a suggested name (selected, so typing replaces it), the note, and what the view will remember.
  const nowMemory = naming ? memoryOf({ defs, panel: panelFilters, rows, extra: viewExtra, q: typed, columns, columnState: handle.current?.columnState?.() || [] }) : null;
  const nowBody = { panel: panelFilters, q: typed, extra: viewExtra, columns: naming ? handle.current?.columnState?.() || [] : [] };
  const sameAsNow = naming ? views.filter((v) => sameList(viewBody(v), nowBody)) : [];
  const openUnchanged = naming && viewId != null ? sameAsNow.find((v) => v.id === viewId && sameEverything(viewBody(v), nowBody)) : null;
  const duplicateOf = openUnchanged || sameAsNow[0] || null;
  const duplicateColumnsDiffer = duplicateOf ? !sameEverything(viewBody(duplicateOf), nowBody) : false;
  const nameClash = naming && viewName.trim() ? nameTaken(viewName) : false;
  const openSave = () => {
    setViewName(suggestName(factsOf(defs, panelFilters, rows, viewExtra), typed.trim(), views.map((v) => v.name)));
    setViewNote("");
    setNaming(true);
    setTimeout(() => nameInputRef.current?.select?.(), 60);
  };
  /** Update a view that keeps the same list, from the save dialog: no second question, and a typed note is kept. */
  const updateFromDialog = async (v) => {
    const note = viewNote.trim() || String(viewBody(v).note || "");
    const res = await fetchWithErrorHandling(updateView(v.id, { filters: currentBody(note) }));
    if (!res.success) { message.error(errorText(res, "Could not update the view")); return; }
    message.success(`Updated "${v.name}"`);
    setNaming(false); setViewName(""); setViewNote("");
    await loadViews();
  };
  /** A view in words for Manage views, the menu tooltips and the Excel line. Uses the words kept when it was saved. */
  const describeView = useCallback((v) => {
    const f = viewBody(v);
    const memory = f.memory || {
      // Saved before views kept their words: described from their filters; columns are not claimed as changed.
      facts: factsOf(defs, f.panel || {}, rows, f.extra).map((x) => x.text), q: String(f.q || "").trim(), sort: sortOf(columns, f.columns), customColumns: false,
    };
    const savedCount = f.savedCount === undefined || f.savedCount === null || !Number.isFinite(Number(f.savedCount)) ? null : Number(f.savedCount);
    return { note: String(f.note || "").trim(), rules: rulesLine(memory), savedCount, savedAt: f.savedAt || null };
  }, [defs, rows, columns]);
  const removeView = (target) => Modal.confirm({
    title: `Delete "${(target || views.find((x) => x.id === viewId))?.name || "this view"}"?`, content: "The filters and columns it remembers are lost. The data is not affected.",
    okText: "Delete", okButtonProps: { danger: true },
    onOk: async () => {
      const id = target?.id ?? viewId;
      const res = await fetchWithErrorHandling(deleteView(id));
      if (!res.success) {
        const detail = errorText(res, "Could not delete this saved view.");
        setViewsError(detail);
        throw new Error(detail);
      }
      if (id === viewId) setViewId(null);
      await loadViews();
    },
  });

  const pinnedCount = views.filter((v) => v.pinned && v.pinned !== 0).length;
  const togglePin = async (v) => {
    const pin = !(v.pinned && v.pinned !== 0);
    if (pin && pinnedCount >= MAX_PINNED) { message.info(`You can pin up to ${MAX_PINNED} views. Unpin one first.`); return; }
    setViewBusy(`pin:${v.id}`);
    const res = await fetchWithErrorHandling(updateView(v.id, { pinned: pin }));
    setViewBusy(null);
    if (!res.success) { message.error(errorText(res, "Could not change the pin")); return; }
    setViews((list) => list.map((x) => (x.id === v.id ? { ...x, pinned: pin } : x)));
  };
  const editView = async (v, { name, note }) => {
    if (nameTaken(name, v.id)) { message.error(`A view called "${name.trim()}" already exists. Choose another name.`); return false; }
    const filters = { ...viewBody(v), note: String(note || "").trim() };
    const res = await fetchWithErrorHandling(updateView(v.id, { name, filters }));
    if (!res.success) { message.error(errorText(res, "Could not save the changes")); return false; }
    setViews((list) => list.map((x) => (x.id === v.id ? { ...x, name, filters } : x)));
    return true;
  };
  const updateWithCurrent = (v) => Modal.confirm({
    title: `Update "${v.name}" with what is on screen now?`,
    content: "It will remember the current filters, search and columns instead of its old ones. Its name and note stay.",
    okText: "Update",
    onOk: async () => {
      const res = await fetchWithErrorHandling(updateView(v.id, { filters: currentBody(String(viewBody(v).note || "")) }));
      if (!res.success) { const detail = errorText(res, "Could not update the view"); message.error(detail); throw new Error(detail); }
      message.success(`Updated "${v.name}"`);
      await loadViews();
    },
  });
  /** How many rows a view holds now, from the rows already loaded; null when only opening it can tell (its own page filters). */
  const countOf = useCallback((v) => {
    const f = viewBody(v);
    if (hasExtra(f.extra)) return null;
    const panel = f.panel || {};
    const q = String(f.q || "").trim().toLowerCase();
    if (q && !searchOf) return null;
    const active = defs.filter((d) => isActive(d, panel[d.key]));
    const scoped = scope ? new Set(scope(rows || [], panel).map(rowId).map(String)) : null;
    return (rows || []).filter((row) => (!scoped || scoped.has(String(rowId(row))))
      && (!q || String(searchOf(row) ?? "").toLowerCase().includes(q))
      && active.every((d) => passes(d, panel[d.key], row))).length;
  }, [defs, rows, rowId, scope, searchOf]);
  /** A line for the top of an Excel file saying how its list was made. */
  // "Infosys shortlist: Shortlist for Infosys, Nov drive · CSE, ECE · CGPA 7+ · Downloaded 8 Oct 2026, 4:10 PM"
  const noteFor = (v) => {
    const about = v ? describeView(v) : null;
    const rules = v ? about.rules : rulesLine(memoryOf({ defs, panel: panelFilters, rows, extra: viewExtra, q: typed, columns, columnState: handle.current?.columnState?.() || [] }));
    return [v ? `${v.name}${about.note ? `: ${about.note}` : ""}` : null, rules, `Downloaded ${moment().format("D MMM YYYY, h:mm A")}`].filter(Boolean).join(" · ");
  };
  /** Download a view: it opens (so the file is exactly what Open shows, page filters included), then downloads. */
  const downloadView = async (v, kind) => {
    setViewBusy(`${kind}:${v.id}`);
    applyView(v.id);
    setManagerOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 700)); // let the table take the view's filters and columns
    await doExport(kind, { view: v, note: noteFor(v) });
    setViewBusy(null);
  };

  // ---- paste, export, copy --------------------------------------------------------------------------------------------------
  const hasRolls = useMemo(() => (rows || []).some((r) => rollOf(r)), [rows, rollOf]);
  const pasteSelect = () => {
    const rolls = parseRolls(pasteText);
    const byRoll = new Map();
    (rows || []).forEach((r) => { const k = rollOf(r); if (k) byRoll.set(String(k).trim().toUpperCase(), r); });
    const ids = new Set(); const unmatched = [];
    rolls.forEach((roll) => { const r = byRoll.get(roll); if (r) ids.add(String(rowId(r))); else unmatched.push(roll); });
    handle.current?.clearSelection();
    const n = handle.current?.selectWhere((r) => ids.has(String(rowId(r)))) || 0;
    setPasteOpen(false); setPasteText("");
    if (unmatched.length) message.warning(`Selected ${n}. Not found: ${unmatched.slice(0, 8).join(", ")}${unmatched.length > 8 ? ` and ${unmatched.length - 8} more` : ""}`, 6);
    else message.success(`Selected ${n}`);
  };
  const doExport = async (kind, opts = {}) => {
    const t = handle.current?.table?.();
    if (!t || t.rows.length === 0) { message.info("Nothing to export"); return; }
    // With a saved view open, the file is named after it: "TCS shortlist – 8 Oct 2026.xlsx".
    const openView = opts.view || views.find((x) => x.id === viewId);
    const name = openView ? `${openView.name} – ${moment().format("D MMM YYYY")}` : exportName || "export";
    const note = opts.note || (openView ? noteFor(openView) : null);
    try {
      if (kind === "csv") exportCsv(name, asTableColumns(t), t.rows);
      else await exportXlsx(name, asTableColumns(t), t.rows, t.selected ? null : note);
      message.success(`Exported ${t.rows.length} row${t.rows.length === 1 ? "" : "s"}${t.selected ? " (selected)" : ""}`);
    } catch (e) {
      message.error("The export could not be created");
    }
  };
  const onCopied = (n) => message.success(n === 1 ? "Copied" : `Copied ${n} rows. Paste into Excel or Sheets.`);

  const columnChooser = (
    <div className="tpo-grid__columns">
      {(handle.current?.columns() || []).map((c) => {
        const def = (columns || []).find((x) => (x.colId || x.field) === c.id);
        if (!def || def.lockVisible || !def.headerName || def.context?.exportOnly) return null;
        return (
          <Checkbox key={c.id} checked={!c.hidden} onChange={(e) => { handle.current?.setColumnVisible(c.id, e.target.checked); setColumnsTick((t) => t + 1); }}>
            {def.headerName}
          </Checkbox>
        );
      })}
      <Button size="small" type="link" onClick={() => { handle.current?.resetLayout(); setColumnsTick((t) => t + 1); }}>Reset columns</Button>
    </div>
  );
  const clear = () => handle.current?.clearSelection();
  // Header selectors count over the rows the page works with (finished batches left out unless picked), like the panel.
  const headerRows = useMemo(() => (scope ? scope(rows || [], panelFilters) : rows || []), [scope, rows, panelFilters]);
  const headerFilters = useMemo(() => ({ defs, rows: headerRows, value: panelFilters, onChange: setFilters }), [defs, headerRows, panelFilters, setFilters]);
  const total = (rows || []).length;
  const useAutoHeight = autoHeight ?? total <= AUTO_HEIGHT_ROWS;
  const visibleColumns = (columns || []).filter((column) => !column.hide && !column.context?.exportOnly).slice(0, 8);
  const skeletonColumnWidths = visibleColumns.map((column) => (
    column.width
      ? Math.max(Number(column.width) || 0, Number(column.minWidth) || 90)
      : `minmax(${Number(column.minWidth) || 110}px, ${Number(column.flex) || 1}fr)`
  ));
  const panelFilterCount = activeCount(defs, panelFilters);
  const hasActiveNarrowing = Boolean(typed.trim()) || panelFilterCount > 0;
  const clearNarrowing = () => {
    setTyped("");
    if (!setFilters) return;
    const preserved = Object.fromEntries(
      Object.entries(panelFilters).filter(([key]) => defs.some((def) => def.key === key && def.panel === false))
    );
    setFilters(preserved);
  };

  if (loading && total === 0) return (
    <TableSkeleton
      rows={8}
      columns={Math.min(Math.max(visibleColumns.length, 3), 8)}
      columnWidths={skeletonColumnWidths}
      label="Loading table data"
    />
  );

  return (
    <div className="tpo-elig" data-testid={testid} aria-busy={loading ? "true" : undefined}>
      {top}
      {loading && total > 0 && <RefreshStatus label="Refreshing table data…" />}
      {viewScope && !compact && viewsError ? (
        <Alert
          type="warning"
          showIcon
          message="Saved views are unavailable"
          description={viewsError}
          action={<Button size="small" onClick={loadViews} disabled={viewsLoading}>Retry saved views</Button>}
          style={{ marginBottom: 10 }}
        />
      ) : null}
      <div className="tpo-elig__toolbar">
        {(!compact || total > 10) && (
          <Input.Search allowClear placeholder={searchPlaceholder} value={typed} onChange={(e) => setTyped(e.target.value)}
            className="tpo-elig__search" aria-label={searchPlaceholder} />
        )}
        {defs.length > 0 && (
          <Badge count={activeCount(defs.filter((d) => d.panel !== false), panelFilters)} size="small">
            <Button icon={<FilterOutlined />} onClick={() => setFiltersOpen(true)}>Filters</Button>
          </Badge>
        )}
        {tools}
        {viewScope && !compact && (() => {
          // The Views menu stays short: pinned views (or, before any are pinned, the most recent few), Save, Manage all.
          const openView = views.find((x) => x.id === viewId);
          const pinned = views.filter((v) => v.pinned && v.pinned !== 0);
          const quick = pinned.length ? pinned : [...views].sort((a, b) => (lastTouched(b)?.valueOf() || 0) - (lastTouched(a)?.valueOf() || 0)).slice(0, RECENT_WHEN_NONE_PINNED);
          const items = [
            ...(quick.length ? [{ type: "group", label: pinned.length ? "Pinned" : "Recent", children: quick.map((v) => ({
              key: `open:${v.id}`,
              title: [describeView(v).note, describeView(v).rules].filter(Boolean).join("\n"),
              label: <span className="tpo-elig__views-item">{pinned.length ? <StarFilled style={{ color: "#d4a017", fontSize: 12 }} /> : null}<span>{v.name}</span>{v.id === viewId ? <CheckOutlined style={{ marginLeft: "auto" }} /> : null}</span>,
            })) }, { type: "divider" }] : []),
            { key: "save", icon: <SaveOutlined />, label: "Save current view…" },
            { key: "manage", icon: <SettingOutlined />, label: `Manage all views${views.length ? ` (${views.length})` : ""}…` },
            ...(openView ? [{ key: "close", label: `Close "${openView.name}"` }] : []),
          ];
          return (
            <Dropdown trigger={["click"]} disabled={viewsLoading || (Boolean(viewsError) && views.length === 0)} menu={{
              items,
              onClick: ({ key }) => {
                if (key.startsWith("open:")) applyView(Number(key.slice(5)) || key.slice(5));
                if (key === "save") openSave();
                if (key === "manage") setManagerOpen(true);
                if (key === "close") setViewId(null);
              },
            }}>
              <Button className="tpo-elig__views" icon={<AppstoreOutlined />} loading={viewsLoading} aria-label="Saved views" data-testid="views.button">
                <span className="tpo-elig__views-label">{openView ? openView.name : "Views"}</span>
              </Button>
            </Dropdown>
          );
        })()}
        {selectable && pasteRolls && hasRolls && <Button className="tpo-elig__desk-only" icon={<SnippetsOutlined />} onClick={() => setPasteOpen(true)}>Paste roll numbers</Button>}
        {!compact && (
          <Popover trigger="click" placement="bottomRight" content={columnChooser} title="Columns" onOpenChange={() => setColumnsTick((t) => t + 1)}>
            <Button className="tpo-elig__desk-only" icon={<TableOutlined />}>Columns</Button>
          </Popover>
        )}
        {exportable && (
          <Dropdown trigger={["click"]} menu={{
            items: [{ key: "xlsx", label: "Excel (.xlsx)" }, { key: "csv", label: "CSV (.csv)" }],
            onClick: ({ key }) => doExport(key),
          }}>
            <Tooltip title={selected.length ? "Download the selected rows" : "Download what is shown"}>
              <Button icon={<DownloadOutlined />}>{selected.length ? `Export ${selected.length}` : "Export"}</Button>
            </Tooltip>
          </Dropdown>
        )}
      </div>
      {defs.length > 0 && <FilterChips defs={defs} rows={rows} value={panelFilters} onChange={setFilters} />}
      <div className="tpo-elig__counts" aria-live="polite" data-testid="grid-counts">
        {counts ? counts(shown || rows || [], selected) : (
          <>
            {/* Same wording as the pages' own count lines: "2 in this view", "3 of 10 in this view · 1 selected". */}
            <span><strong>{(shown || rows || []).length.toLocaleString()}</strong>{(shown || rows || []).length !== total ? ` of ${total.toLocaleString()}` : ""} in this view</span>
            {selectable && selected.length > 0 && <span>· <strong>{selected.length.toLocaleString()}</strong> selected</span>}
          </>
        )}
      </div>
      {total > 0 && shown && shown.length === 0 && hasActiveNarrowing && (
        <div className="tpo-elig__zero-results" role="status">
          <Typography.Text type="secondary">
            {typed.trim() ? `No rows match “${typed.trim()}” with the active filters.` : "No rows match the active filters."}
          </Typography.Text>
          <Button size="small" onClick={clearNarrowing}>Clear search and filters</Button>
        </div>
      )}
      {act && (
        <div className={`tpo-elig__act${selected.length ? " is-selected" : ""}`} role="region" aria-label="Act on these" data-testid="grid-act">
          {act(shown || rows || [], selected, clear)}
          {selected.length > 0 && (
            <>
              <Tooltip title="Copy the selected rows to paste into Excel (Ctrl+C)">
                <Button icon={<CopyOutlined />} onClick={() => handle.current?.copySelection()}>Copy</Button>
              </Tooltip>
              <Button type="link" onClick={clear}>Clear selection</Button>
            </>
          )}
        </div>
      )}
      {!act && selected.length > 0 && (
        <div className="tpo-elig__bulk" role="region" aria-label="Selected" data-testid="grid-bulk">
          <strong>{selected.length.toLocaleString()} selected</strong>
          {bulk && bulk(selected, clear)}
          <Tooltip title="Copy the selected rows to paste into Excel (Ctrl+C)">
            <Button icon={<CopyOutlined />} onClick={() => handle.current?.copySelection()}>Copy</Button>
          </Tooltip>
          <Button type="link" onClick={clear}>Clear selection</Button>
        </div>
      )}
      {total === 0 && empty ? empty : (
        <GridFilterContext.Provider value={headerFilters}>
        <TpoGrid
          handle={handle} rows={rows} columns={columns} rowId={rowId} storageKey={storageKey} selectable={selectable}
          onSelection={setSelected} onCellChange={onCellChange} quickFilter={searchOf ? undefined : search} externalFilter={externalFilter}
          onShownChange={setShownIfChanged} height={height} autoHeight={useAutoHeight} rowClassRules={rowClassRules} getRowClass={getRowClass}
          onRowClicked={onRowClicked} context={context} onCopied={onCopied}
          onSelectionHidden={(n) => message.info(`${n} ticked ${n === 1 ? "row is" : "rows are"} hidden by the filter, so ${n === 1 ? "it was" : "they were"} unticked.`)}
          noRowsText={typed || activeCount(defs, panelFilters) ? "Nothing matches the search or filters" : "Nothing here yet"}
        />
        </GridFilterContext.Provider>
      )}
      {defs.length > 0 && (
        <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} title={filterTitle} defs={defs} rows={rows} value={panelFilters} onApply={setFilters} scope={scope} />
      )}
      <AsyncModal open={pasteOpen} title="Select by roll numbers" okText="Select" onOk={pasteSelect} onCancel={() => setPasteOpen(false)} okButtonProps={{ disabled: !pasteText.trim() }}>
        <Typography.Paragraph type="secondary">Paste roll numbers from a sheet or an email. One per line, or separated by commas or spaces.</Typography.Paragraph>
        <Input.TextArea rows={8} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"21A91A0501\n21A91A0502"} aria-label="Roll numbers" />
      </AsyncModal>
      {viewScope && !compact && (
        <SavedViewsManager
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
          views={views}
          viewId={viewId}
          countOf={countOf}
          busyId={viewBusy}
          onOpen={(v) => { applyView(v.id); setManagerOpen(false); }}
          onDownload={downloadView}
          onTogglePin={togglePin}
          onEdit={editView}
          describe={describeView}
          onUpdate={updateWithCurrent}
          onDelete={removeView}
        />
      )}
      <AsyncModal title="Save this view" open={naming} onCancel={() => setNaming(false)} onOk={saveCurrent} okText="Save" okButtonProps={{ disabled: !viewName.trim() || nameClash }}>
        <div className="tpo-save-view">
          <label className="tpo-save-view__label" htmlFor="save-view-name">Name</label>
          <Input id="save-view-name" ref={nameInputRef} placeholder="Name, e.g. CSE final year not registered" value={viewName} maxLength={100}
            status={nameClash ? "error" : undefined} aria-describedby={nameClash ? "save-view-name-error" : undefined}
            onChange={(e) => setViewName(e.target.value)} onPressEnter={() => viewName.trim() && !nameClash && saveCurrent()} />
          {nameClash && <div id="save-view-name-error" role="alert" className="tpo-save-view__error">A view called &quot;{viewName.trim()}&quot; already exists. Choose another name.</div>}
          <label className="tpo-save-view__label" htmlFor="save-view-note">What&apos;s it for <span className="tpo-save-view__optional">(optional)</span></label>
          <Input id="save-view-note" placeholder="e.g. Shortlist for Infosys, Nov drive" value={viewNote} maxLength={200} onChange={(e) => setViewNote(e.target.value)} />
          <div className="tpo-save-view__remember" data-testid="save-view.summary">
            <div className="tpo-save-view__remember-title">This view will remember</div>
            <div>{nowMemory ? rulesLine(nowMemory) : ""}</div>
            <Typography.Text type="secondary">{countNow().toLocaleString()} in this list right now</Typography.Text>
          </div>
          {duplicateOf && (
            <Alert type={openUnchanged ? "info" : "warning"} showIcon className="tpo-save-view__dup" data-testid="save-view.duplicate"
              message={openUnchanged
                ? `Nothing has changed since you opened "${duplicateOf.name}".`
                : `Same filters as "${duplicateOf.name}"${sameAsNow.length > 1 ? ` and ${sameAsNow.length - 1} more` : ""}${duplicateColumnsDiffer ? ", with different columns or sort." : "."}`}
              description={openUnchanged ? "Saving would only make a copy of it." : duplicateColumnsDiffer
                ? `Updating it would replace its columns and sort with these. Keep both if you use them for different things.`
                : null}
              action={!openUnchanged ? (
                <Button size="small" onClick={() => updateFromDialog(duplicateOf)}>Update &quot;{duplicateOf.name}&quot; instead</Button>
              ) : null} />
          )}
        </div>
      </AsyncModal>
      {children}
    </div>
  );
}
