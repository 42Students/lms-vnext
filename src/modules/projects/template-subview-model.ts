export const TEMPLATE_SUBVIEW_TABS = [
  { id: "overview", label: "Overview" },
  { id: "sprints", label: "Sprints" },
  { id: "tasks", label: "Tasks" },
  { id: "resources", label: "Resources" },
  { id: "colleges", label: "Colleges" },
  { id: "versions", label: "Versions" },
] as const;

export type TemplateSubview =
  (typeof TEMPLATE_SUBVIEW_TABS)[number]["id"];

export type TemplateReadSubview = Exclude<
  TemplateSubview,
  "overview"
>;

export function templateSubviewHref(
  templateId: string,
  section: TemplateSubview,
): string {
  const base =
    "/admin/projects/templates/" +
    encodeURIComponent(templateId);

  return section === "overview"
    ? base
    : `${base}/${section}`;
}

export type TemplateBlueprintCountsInput = {
  releases?: readonly unknown[];
  sprints?: readonly unknown[];
  tasks?: readonly unknown[];
  resources?: readonly unknown[];
} | null;

export function countTemplateBlueprintItems(
  blueprint: TemplateBlueprintCountsInput,
) {
  return {
    releases: blueprint?.releases?.length ?? 0,
    sprints: blueprint?.sprints?.length ?? 0,
    tasks: blueprint?.tasks?.length ?? 0,
    resources: blueprint?.resources?.length ?? 0,
  };
}

export function templateVersionLabels(
  version: number,
  currentVersion: number,
  publishedVersion: number | null,
): string[] {
  const labels: string[] = [];

  if (version === currentVersion) {
    labels.push("Current");
  }

  if (version === publishedVersion) {
    labels.push("Published");
  }

  return labels;
}
