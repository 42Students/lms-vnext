"use client";
import { Button } from "@/components/ui/button";
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
  return <Button variant="secondary" type="button" disabled={!rows.length} onClick={download}
    className="inline-flex min-h-11 items-center gap-2 md:min-h-9">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/>
    </svg>
    Export CSV
  </Button>;
}
