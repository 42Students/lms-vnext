import { z } from "zod";

export const templateVersionComparisonParamsSchema = z.strictObject({
  templateId: z.uuid(),
  versionId: z.uuid(),
});

type VersionSnapshot = {
  title: string;
  summary: string | null;
  blueprint: Record<string, unknown>;
};

// Object key order is not a content change; array order remains meaningful.
function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, stableValue(item)]));
  }
  return value;
}

export function compareTemplateVersionSnapshots(current: VersionSnapshot, selected: VersionSnapshot) {
  const fields = [
    ["Title", current.title, selected.title],
    ["Summary", current.summary, selected.summary],
    ...["overview", "releases", "sprints", "tasks", "resources"].map(key =>
      [key, current.blueprint[key] ?? null, selected.blueprint[key] ?? null]),
  ] as const;
  return fields.filter(([, before, after]) =>
    JSON.stringify(stableValue(before)) !== JSON.stringify(stableValue(after)))
    .map(([label, currentValue, selectedValue]) => ({
      label: String(label),
      current: JSON.stringify(currentValue, null, 2) ?? "null",
      selected: JSON.stringify(selectedValue, null, 2) ?? "null",
    }));
}

export function templateVersionComparisonHref(templateId: string, versionId: string) {
  const ids = templateVersionComparisonParamsSchema.parse({ templateId, versionId });
  return `/admin/projects/templates/${ids.templateId}/versions/${ids.versionId}`;
}
