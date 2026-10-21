import {projectAdminCsv} from "./project-admin-csv-model";
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
  summary?: string | null;
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
export function projectTemplateCatalogueCsv(rows: readonly TemplateCatalogueRow[]) {
  return projectAdminCsv([
    ["Title","Version","Summary"],
    ...rows.map(row=>[row.title,String(row.version),row.summary??""]),
  ]);
}
