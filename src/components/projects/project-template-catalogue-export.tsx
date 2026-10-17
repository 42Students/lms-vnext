"use client";
import type { TemplateCatalogueRow } from "@/modules/projects/project-template-catalogue-model";
import { projectTemplateCatalogueCsv } from "@/modules/projects/project-template-catalogue-model";

/** COL-projects-16: export only the rows already scoped and filtered on the server. */
export function ProjectTemplateCatalogueExport({ rows }: { rows: readonly TemplateCatalogueRow[] }) {
  function download() {
    const blob = new Blob([projectTemplateCatalogueCsv(rows)], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "project-templates.csv";
    anchor.click();
    URL.revokeObjectURL(href);
  }
  return <button type="button" disabled={!rows.length} onClick={download}
    className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
    Export this page (CSV)
  </button>;
}
