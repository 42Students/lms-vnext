/** TPO-batches-24: do not guess class inheritance for ambiguous memberships. */
export type TpoOwnOverrideFact={
 direct:"ELIGIBLE"|"INELIGIBLE";parent:"ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED"|null;
};
export function summarizeTpoOwnOverrides(facts:readonly TpoOwnOverrideFact[]){
 let different=0,same=0,uncertain=0;
 for(const f of facts){
  if(f.parent===null)uncertain++;
  else if(f.parent===f.direct)same++;
  else different++;
 }
 return {total:facts.length,different,same,uncertain};
}
