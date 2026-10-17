import type {BulkOutcome} from "./tpo-bulk-action-model";

export type TpoBulkExceptionGroup={
  reason:string;
  count:number;
  names:string[];
};

/** TPO-drive-workspace-69: group only non-applied, preview-authorized rows. */
export function groupTpoBulkExceptions(
  outcomes:readonly BulkOutcome[],
  labelsById:ReadonlyMap<string,string>,
  maxNamesPerReason=20,
):TpoBulkExceptionGroup[]{
  const groups=new Map<string,TpoBulkExceptionGroup>();
  for(const outcome of outcomes){
    if(outcome.status==="updated")continue;
    const reason=outcome.reason?.trim()||"Not applied";
    let group=groups.get(reason);
    if(!group){
      group={reason,count:0,names:[]};
      groups.set(reason,group);
    }
    group.count+=1;
    if(group.names.length<maxNamesPerReason)
      group.names.push(labelsById.get(outcome.id)||"Selected applicant");
  }
  return [...groups.values()];
}
