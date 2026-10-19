"use client";

import { TpoSpreadsheetGrid, type TpoSpreadsheetGridProps } from "../tpo-spreadsheet-grid";

/**
 * Client-only integration seam. The present repository does not yet contain
 * ag-grid-community/ag-grid-react or the legacy-grid source files. Retain the
 * authorized, functional table until those assets are available, then replace
 * only this implementation. Never move server authorization into this layer.
 */
/** Exposed for source audits: native AG Grid is NOT available in this dependency set. */
export const TPO_GRID_ENGINE = "shared-table-fallback" as const;

export function TpoGrid<Row>(props: TpoSpreadsheetGridProps<Row>) {
  return <div data-slot="tpo-grid" data-grid-engine={TPO_GRID_ENGINE} className="min-w-0">
    <TpoSpreadsheetGrid<Row> {...props} />
  </div>;
}
