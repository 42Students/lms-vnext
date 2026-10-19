"use client";

import { TpoSpreadsheetGrid, type TpoSpreadsheetGridProps } from "../tpo-spreadsheet-grid";

/**
 * Client-only integration seam. The present repository does not yet contain
 * ag-grid-community/ag-grid-react or the legacy-grid source files. Retain the
 * authorized, functional table until those assets are available, then replace
 * only this implementation. Never move server authorization into this layer.
 */
export function TpoGrid<Row>(props: TpoSpreadsheetGridProps<Row>) {
  return <TpoSpreadsheetGrid {...props} />;
}
