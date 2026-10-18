import {z} from "zod";

/** Session-local drafts are never authoritative Company Team commands. */
export const tpoCompanyTeamDraftSchema=z.strictObject({
 body:z.string().max(4000),
 decision:z.boolean(),
 assignee:z.union([z.literal(""),z.string().uuid()]),
 dueAt:z.string().max(40),
 pending:z.nullable(z.strictObject({
  fingerprint:z.string().max(20000),
  key:z.string().uuid(),
 })),
});
export type TpoCompanyTeamDraft=z.infer<typeof tpoCompanyTeamDraftSchema>;

export function parseTpoCompanyTeamDraft(raw:string|null):TpoCompanyTeamDraft|null {
 if(!raw)return null;
 try{
  const checked=tpoCompanyTeamDraftSchema.safeParse(JSON.parse(raw) as unknown);
  return checked.success?checked.data:null;
 }catch{return null;}
}

/** A retry after a lost response reuses the UUID only for the identical message. */
export function tpoCompanyTeamDraftSendKey(
 previous:TpoCompanyTeamDraft["pending"],
 fingerprint:string,
 newKey:()=>string,
):NonNullable<TpoCompanyTeamDraft["pending"]> {
 return previous?.fingerprint===fingerprint?previous:
  {fingerprint,key:newKey()};
}
