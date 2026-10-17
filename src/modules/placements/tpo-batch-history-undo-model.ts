type HistoryEvent={
  actionId:string;kind:string;reversesActionId:string|null;
  scopeType:string;scopeId?:string;
};
/** Display an undo once per original action, even when it contains many learners.
 * The API revalidates its membership/cohort scope and all later events.
 * SECTION actions need a separate scoped undo service and stay read-only. */
export function batchHistoryDecisionTimeline<T extends HistoryEvent>(events:readonly T[],kind:"ALL"|"DECIDE"|"UNDO"="ALL") {
 const reversed=new Set(events.filter(e=>e.kind==="UNDO"&&e.reversesActionId).map(e=>e.reversesActionId!));
 return actionableBatchHistory(events).filter(event=>
   event.kind==="DECIDE"&&(kind!=="UNDO"||reversed.has(event.actionId)))
  .map(event=>({...event,undone:reversed.has(event.actionId)}));
}

export function actionableBatchHistory<T extends HistoryEvent>(events:readonly T[]) {
  const reversed=new Set(events.flatMap(item=>
    item.kind==="UNDO"&&item.reversesActionId?[item.reversesActionId]:[]));
  const seenActions=new Set<string>();
  const seenScopes=new Set<string>();
  return events.map(item=>{
    const key=item.scopeType+":"+(item.scopeId??item.actionId);
    const newest=!seenScopes.has(key);
    seenScopes.add(key);
    const firstInAction=!seenActions.has(item.actionId);
    seenActions.add(item.actionId);
    return {...item,canRequestUndo:item.kind==="DECIDE"&&
      (item.scopeType==="COHORT"||item.scopeType==="MEMBERSHIP")&&
      newest&&firstInAction&&!reversed.has(item.actionId)};
  });
}
