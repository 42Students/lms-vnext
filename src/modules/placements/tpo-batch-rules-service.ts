import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatch} from "./tpo-batch-workspace-read-service";
import {upsertPlacementBatchSettings,PlacementBatchError} from "./batch-participation-service";
import {tpoBatchRuleSaveSchema} from "./tpo-batch-rules-model";

/** Never replace registration dates/invitations while editing inherited rules. */
export async function saveTpoBatchRuleOverrides(ctx:RequestContext,batchId:string,raw:unknown){
 const input=tpoBatchRuleSaveSchema.parse(raw);
 const {collegeId,ready,lifecycle}=await getTpoBatch(ctx,batchId);
 if(!ready)throw new PlacementBatchError("DB08_ACTION_INVALID");
 if(lifecycle?.finishedAt)throw new PlacementBatchError("DB08_ACTION_INVALID");
 const cleaned=Object.keys(input.rulesOverride).length?input.rulesOverride:null;
 const result=await upsertPlacementBatchSettings(ctx,{
  collegeId,cohortId:batchId,registrationDeadline:lifecycle?.registrationDeadline??null,
  rulesOverride:cleaned,expectedVersion:input.expectedVersion,
 });
 return {rulesOverride:result.rulesOverride??null,version:result.updatedAt.toISOString()};
}
