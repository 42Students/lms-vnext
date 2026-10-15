export type TpoBatchLifecycleAction="FINISH"|"REOPEN";
export class TpoBatchLifecycleError extends Error{
 constructor(public readonly code:"BATCH_ACTION_STALE"|"BATCH_INVITATION_REQUIRED"|"BATCH_MIGRATION_PENDING"|"BATCH_NOT_STARTED"){
  super(code);this.name="TpoBatchLifecycleError";
 }
}
export function planTpoBatchLifecycle(row:{invitedAt:Date|null;finishedAt:Date|null;updatedAt:Date},
 action:TpoBatchLifecycleAction,expectedVersion:string){
 if(row.updatedAt.toISOString()!==expectedVersion)throw new TpoBatchLifecycleError("BATCH_ACTION_STALE");
 if(action==="FINISH"&&!row.invitedAt)throw new TpoBatchLifecycleError("BATCH_INVITATION_REQUIRED");
 return {changed:action==="FINISH"?row.finishedAt===null:row.finishedAt!==null,
  shouldFinish:action==="FINISH"};
}
