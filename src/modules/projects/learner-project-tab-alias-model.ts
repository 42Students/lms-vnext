/** Legacy Project tab links continue to the same authorized Board section. */
export function canonicalLearnerProjectTab(tab: string | null | undefined): string {
  return tab === "tasks" ? "board" : tab === "meetings" ? "team" : tab ?? "overview";
}

export const LEARNER_PROJECT_DETAIL_TABS = [
  {key:"overview",label:"Overview"},
  {key:"team",label:"People & Meetings"},
  {key:"sprints",label:"Releases and Sprints"},
  {key:"board",label:"Board"},
  {key:"resources",label:"Resources"},
  {key:"activity",label:"Activity"},
  {key:"delivery",label:"Final Delivery"},
] as const;
