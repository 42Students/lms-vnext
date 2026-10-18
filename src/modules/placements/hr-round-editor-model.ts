import {z} from "zod";
export const hrRoundFormSchema=z.strictObject({
 action:z.enum(["CREATE","UPDATE","REMOVE"]),
 kind:z.enum(["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"]).optional(),
 name:z.string().trim().min(1).max(100)
  .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid round name"}).optional(),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]).nullable().optional(),
 durationMinutes:z.union([z.number().int(),z.string().regex(/^[1-9][0-9]*$/).transform(Number)])
  .pipe(z.number().int().min(1).max(1440)).optional(),
 roundId:z.string().uuid().optional(),
 expectedUpdatedAt:z.string().datetime({offset:true}).optional(),
}).superRefine((row,ctx)=>{
 if(row.action==="CREATE" && (!row.kind||!row.name))
  ctx.addIssue({code:"custom",message:"Round kind and name required"});
 if(row.action!=="CREATE" && (!row.roundId||!row.expectedUpdatedAt))
  ctx.addIssue({code:"custom",message:"Round identity and latest version required"});
 if(row.action==="UPDATE"&& !row.name&&row.mode===undefined&&row.durationMinutes===undefined&&!row.kind)
  ctx.addIssue({code:"custom",message:"Nothing to update"});
 if(row.action==="CREATE"&&(row.roundId||row.expectedUpdatedAt))
  ctx.addIssue({code:"custom",message:"New round cannot carry an existing version"});
 if(row.action==="REMOVE"&&
  (row.kind!==undefined||row.name!==undefined||row.mode!==undefined||row.durationMinutes!==undefined))
  ctx.addIssue({code:"custom",message:"Removal cannot change round fields"});
});
export function canRecruiterEditRound(input:{
 status:string;createdByUserId:string;recruiterUserId:string;hasResults:boolean;hasSlots?:boolean;
}):boolean{
 return input.status==="PENDING"&&Boolean(input.createdByUserId.trim())&&
  Boolean(input.recruiterUserId.trim())&&input.createdByUserId===input.recruiterUserId&&
  !input.hasResults&&!input.hasSlots;
}
export function duplicateRecruiterRoundName(
 names:readonly {id:string;name:string;status:string}[],name:string,excludeId?:string,
):boolean{
 const canonical=canonicalRecruiterRoundName(name);
 return names.some(row=>row.id!==excludeId&&row.status!=="CANCELLED"&&
  canonicalRecruiterRoundName(row.name)===canonical);
}

function canonicalRecruiterRoundName(name:string):string{
 return name.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("en");
}

/** ISO timestamps with different UTC offsets represent the same optimistic version. */
export function matchesRecruiterRoundVersion(stored:Date,expected:string|undefined):boolean{
 const parsed=expected===undefined?Number.NaN:Date.parse(expected);
 return Number.isFinite(parsed)&&Number.isFinite(stored.getTime())&&stored.getTime()===parsed;
}

/** Browser inline editors use an explicit persisted-action receipt, never an
 * arbitrary HTTP 200 or a redirect that may lead to sign-in. */
export const hrRoundMutationReceiptSchema=z.strictObject({
 saved:z.literal(true),
 id:z.string().uuid(),
 action:z.enum(["CREATED","UPDATED","REMOVED"]),
});
export function isVerifiedHrRoundMutation(
 receipt:unknown,requested:"CREATE"|"UPDATE"|"REMOVE",existingRoundId:string|null,
):boolean{
 const parsed=hrRoundMutationReceiptSchema.safeParse(receipt);
 if(!parsed.success)return false;
 const expected=requested==="CREATE"?"CREATED":requested==="UPDATE"?"UPDATED":"REMOVED";
 return parsed.data.action===expected&&(requested==="CREATE"||
  parsed.data.id===existingRoundId);
}

/** Closing a form with unsaved round edits must require explicit discard. */
export function hrRoundEditorHasUnsavedChanges(
 draft:{name:string;kind:string;mode:string},
 original:{name:string;kind:string;mode:string|null}|null,
):boolean {
 return draft.name!==(original?.name??"")||
  draft.kind!==(original?.kind??"INTERVIEW")||
  draft.mode!==(original?.mode??"");
}
