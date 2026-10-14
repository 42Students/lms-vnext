/** Legacy Project tab links continue to the same authorized Board section. */
export function canonicalLearnerProjectTab(tab: string | null | undefined): string {
  return tab === "tasks" ? "board" : tab ?? "overview";
}
