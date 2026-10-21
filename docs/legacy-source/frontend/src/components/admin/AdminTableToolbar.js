import { useEffect, useRef, useState } from "react";
import { Button, Input, Space, Typography } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv, columnsFromRows } from "@/utils/csvExport";

/** Shared search, export and refresh controls for both administrator consoles. */
export default function AdminTableToolbar({
  searchValue,
  onSearch,
  searchPlaceholder = "Search",
  onRefresh,
  loading = false,
  exportFileName,
  exportRows,
  extra = null,
  resultCount = null,
  totalCount = null,
}) {
  // exportRows as a function is a cheap client-side map over already-filtered rows (every caller
  // derives it from a useMemo/filter, not a fetch) — safe to call here just to size it, so the
  // button actually disables on an empty filtered list instead of always reading as exportable.
  const canExport = typeof exportRows === "function" ? exportRows().length > 0 : Array.isArray(exportRows) && exportRows.length > 0;
  const query = String(searchValue ?? "");
  const [typedSearch, setTypedSearch] = useState(query);
  const lastEmittedSearchRef = useRef(query);

  // Keep typing responsive while avoiding a full list/filter recompute on every keypress.
  // External URL/back-navigation changes still win immediately by syncing the controlled value.
  useEffect(() => {
    setTypedSearch(query);
    lastEmittedSearchRef.current = query;
  }, [query]);

  useEffect(() => {
    // Compare with what was last emitted, not the controlled value: a parent that has not echoed the typed term
    // back yet (URL-driven) would otherwise make "clear" look like no change and keep the old filter.
    if (!onSearch || typedSearch === lastEmittedSearchRef.current) return undefined;
    const timer = setTimeout(() => {
      lastEmittedSearchRef.current = typedSearch;
      onSearch(typedSearch);
    }, 220);
    return () => clearTimeout(timer);
  }, [typedSearch, query, onSearch]);

  const handleExport = () => {
    const rows = typeof exportRows === "function" ? exportRows() : exportRows;
    if (!Array.isArray(rows) || rows.length === 0) return;
    // exportRowsToCsv(filename, columns, rows) takes a {label, key}[] column list — every caller
    // here only builds plain row objects, not that shape. Derive columns from the row keys
    // (each caller's own mapping already curates exactly the fields/order it wants exported), so
    // the previous 2-arg call — which silently passed `rows` in as `columns` and left the real
    // `rows` argument undefined, exporting a single line of empty commas — is no longer possible.
    exportRowsToCsv(exportFileName || "export.csv", columnsFromRows(rows), rows);
  };

  return (
    <Space wrap>
      {extra}
      {onSearch && (
        <>
          <Input.Search
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            allowClear
            size="small"
            style={{ width: 220 }}
            value={typedSearch}
            onChange={(e) => setTypedSearch(e.target.value)}
          />
          {typedSearch.trim() && <Button size="small" onClick={() => setTypedSearch("")}>Clear search</Button>}
          {typeof resultCount === "number" && typeof totalCount === "number" && (
            <Typography.Text type="secondary" role="status">{resultCount} of {totalCount} results</Typography.Text>
          )}
        </>
      )}
      {exportFileName && (
        <Button icon={<DownloadOutlined />} size="small" onClick={handleExport} disabled={!canExport}>Export CSV</Button>
      )}
      {onRefresh && <Button icon={<ReloadOutlined />} size="small" onClick={onRefresh} loading={loading}>Refresh</Button>}
    </Space>
  );
}
