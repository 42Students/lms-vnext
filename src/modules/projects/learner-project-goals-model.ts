import type { ProjectTemplateBlueprint } from "./validation";
export type LearnerProjectGoalSummary = {
  goal: string | null;
  description: string | null;
  deliverables: string[];
  definitionOfDone: string[];
  personas: string[];
};
export function learnerProjectGoalSummary(
  blueprint: ProjectTemplateBlueprint,
): LearnerProjectGoalSummary {
  const source=blueprint.overview;
  return {
    goal:source.goal?.trim() || null,
    description:source.description?.trim() || null,
    deliverables:source.deliverables.map(item=>item.trim()).filter(Boolean),
    definitionOfDone:(source.definitionOfDone??[]).map(item=>item.trim()).filter(Boolean),
    personas:(source.personas??[]).map(item=>item.trim()).filter(Boolean),
  };
}
