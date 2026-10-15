type HistoryEvent = {
  actionId: string; kind: string;
  reversesActionId: string | null; scopeType: string;
};
/** Hint only: authoritative reversal still runs inside the DB08 transaction. */
export function actionableBatchHistory(events: readonly HistoryEvent[]) {
  const reversed = new Set(events.flatMap(event =>
    event.kind === "UNDO" && event.reversesActionId ? [event.reversesActionId] : []));
  const newest = events.find(event => event.scopeType === "COHORT");
  return events.map(event => ({
    ...event,
    canRequestUndo:
      event === newest && event.kind === "DECIDE" &&
      !reversed.has(event.actionId),
  }));
}
