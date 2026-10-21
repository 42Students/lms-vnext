import type { ProjectTemplateBlueprint } from "./validation";

type Sprint = ProjectTemplateBlueprint["sprints"][number];
type Task = ProjectTemplateBlueprint["tasks"][number];

/** SA-placements-projects-83/84: only siblings in the same release/sprint are reordered. */
export function moveTemplateSprint(
  blueprint: ProjectTemplateBlueprint, key: string, direction: -1 | 1,
): ProjectTemplateBlueprint {
  const row = blueprint.sprints.find(item => item.key === key);
  if (!row) return blueprint;
  const siblings = blueprint.sprints
    .filter(item => item.releaseKey === row.releaseKey)
    .sort((a, b) => a.sequence - b.sequence || a.key.localeCompare(b.key));
  const position = siblings.findIndex(item => item.key === key);
  const adjacent = siblings[position + direction];
  if (!adjacent) return blueprint;
  return {
    ...blueprint,
    sprints: blueprint.sprints.map(item => item.key === key
      ? { ...item, sequence: adjacent.sequence }
      : item.key === adjacent.key ? { ...item, sequence: row.sequence } : item),
  };
}

export function moveTemplateTask(
  blueprint: ProjectTemplateBlueprint, key: string, direction: -1 | 1,
): ProjectTemplateBlueprint {
  const row = blueprint.tasks.find(item => item.key === key);
  if (!row) return blueprint;
  const siblings = blueprint.tasks
    .filter(item => item.sprintKey === row.sprintKey)
    .sort((a, b) => a.sequence - b.sequence || a.key.localeCompare(b.key));
  const position = siblings.findIndex(item => item.key === key);
  const adjacent = siblings[position + direction];
  if (!adjacent) return blueprint;
  return {
    ...blueprint,
    tasks: blueprint.tasks.map(item => item.key === key
      ? { ...item, sequence: adjacent.sequence }
      : item.key === adjacent.key ? { ...item, sequence: row.sequence } : item),
  };
}

export function updateTemplateSprint(
  blueprint: ProjectTemplateBlueprint, index: number, patch: Partial<Sprint>,
): ProjectTemplateBlueprint {
  const old = blueprint.sprints[index];
  if (!old) return blueprint;
  const changed = { ...old, ...patch };
  return {
    ...blueprint,
    sprints: blueprint.sprints.map((item, position) =>
      position === index ? changed : item),
    // Renaming a sprint key must never strand its tasks.
    tasks: old.key !== changed.key
      ? blueprint.tasks.map(item => item.sprintKey === old.key
        ? { ...item, sprintKey: changed.key } : item)
      : blueprint.tasks,
  };
}

export function removeTemplateSprint(
  blueprint: ProjectTemplateBlueprint, key: string,
): { blueprint: ProjectTemplateBlueprint; error: string | null } {
  return {
    blueprint:{
      ...blueprint,
      sprints:blueprint.sprints.filter(item=>item.key!==key),
      // A deleted legacy sprint moves its tasks into the product backlog;
      // do not erase the tasks or invent a replacement association.
      tasks:blueprint.tasks.map(item=>item.sprintKey===key?
        {...item,sprintKey:null}:item),
    },
    error:null,
  };
}

export function nextTemplatePlanKey(keys: readonly string[], prefix: string): string {
  const taken = new Set(keys);
  for (let index = 1; ; index += 1) {
    const key = prefix + "-" + index;
    if (!taken.has(key)) return key;
  }
}

/** Normalize just plan ordering before posting the full immutable blueprint. */
export function normalizeTemplatePlan(
  blueprint: ProjectTemplateBlueprint,
): ProjectTemplateBlueprint {
  const normalize = <T extends { sequence: number; key: string }>(
    rows: T[], getGroup: (row: T) => string,
  ) => {
    const groups = new Map<string, T[]>();
    for (const row of rows) groups.set(getGroup(row), [...(groups.get(getGroup(row)) ?? []), row]);
    const ordered = new Map<string, number>();
    for (const entries of groups.values()) {
      entries.sort((a, b) => a.sequence - b.sequence || a.key.localeCompare(b.key));
      entries.forEach((row, index) => ordered.set(row.key, index));
    }
    return rows.map(row => ({ ...row, sequence: ordered.get(row.key) ?? row.sequence }));
  };
  return {
    ...blueprint,
    sprints: normalize(blueprint.sprints, row => row.releaseKey),
    tasks: normalize(blueprint.tasks, row => row.sprintKey??"__BACKLOG__"),
  };
}
