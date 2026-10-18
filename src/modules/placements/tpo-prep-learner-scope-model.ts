import {z} from "zod";

const membershipPair=z.strictObject({
 membershipId:z.uuid(),cohortId:z.uuid(),
});
export type TpoPrepLearnerPair=z.infer<typeof membershipPair>;

/** Reject duplicate students, forged IDs and pathological input before DB reads. */
export function validateTpoPrepLearnerPairs(
 raw:readonly TpoPrepLearnerPair[],
):{membershipIds:string[];cohortIds:string[]}|null{
 const parsed=z.array(membershipPair).max(5000).safeParse(raw);
 if(!parsed.success)return null;
 const memberIds=new Set<string>();
 const cohortIds=new Set<string>();
 for(const row of parsed.data){
  if(memberIds.has(row.membershipId))return null;
  memberIds.add(row.membershipId);
  cohortIds.add(row.cohortId);
 }
 if(cohortIds.size>2500)return null;
 return {membershipIds:[...memberIds],cohortIds:[...cohortIds]};
}

/** A real learner must have their exact saved enrollment/cohort pairing. */
export function hasEveryScopedTpoPrepLearner(
 requested:readonly TpoPrepLearnerPair[],
 saved:readonly TpoPrepLearnerPair[],
):boolean{
 const actual=new Set(saved.map(row=>row.membershipId+":"+row.cohortId));
 return requested.every(row=>actual.has(row.membershipId+":"+row.cohortId));
}
