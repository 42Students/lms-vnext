/** COL-projects-16: safe projections for the college template catalogue. */
export type TemplateSectionCounts = {
  overview: number;
  releases: number;
  sprints: number;
  tasks: number;
  resources: number;
};
export type TemplateCatalogueRow = {
  templateId: string;
  title: string;
  version: number;
  sections: TemplateSectionCounts;
};
export function projectTemplateSectionCounts(value: unknown): TemplateSectionCounts {
  const data = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const overview = data.overview && typeof data.overview === "object"
    ? data.overview as Record<string, unknown> : {};
  const sections = (name: string) => Array.isArray(data[name]) ? data[name].length : 0;
  return {
    overview: Object.keys(overview).length ? 1 : 0,
    releases: sections("releases"),
    sprints: sections("sprints"),
    tasks: sections("tasks"),
    resources: sections("resources"),
  };
}
function csvCell(value: string | number) {
  const raw = String(value).replace(/^[\t\r\n ]+/, "");
  const safe = /^[=+@-]/.test(raw) ? "'" + String(value) : String(value);
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function projectTemplateCatalogueCsv(rows: readonly TemplateCatalogueRow[]) {
  const lines = [
    ["Template", "Version", "Sections", "Overview", "Releases", "Sprints", "Tasks", "Resources"],
    ...rows.map(row => [
      row.title, String(row.version),
      String(row.sections.overview + row.sections.releases + row.sections.sprints +
        row.sections.tasks + row.sections.resources),
      String(row.sections.overview), String(row.sections.releases),
      String(row.sections.sprints), String(row.sections.tasks), String(row.sections.resources),
    ]),
  ];
  return "\uFEFF" + lines.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
