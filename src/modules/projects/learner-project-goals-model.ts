import type { ProjectTemplateBlueprint } from "./validation";
export type LearnerProjectGoalSummary = {
  goal: string | null;
  description: string | null;
  deliverables: string[];
};
export function learnerProjectGoalSummary(
  blueprint: ProjectTemplateBlueprint,
): LearnerProjectGoalSummary {
  const source=blueprint.overview;
  return {
    goal:source.goal?.trim() || null,
    description:source.description?.trim() || null,
    deliverables:source.deliverables.map(item=>item.trim()).filter(Boolean),
  };
}
