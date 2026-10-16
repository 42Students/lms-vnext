/** Legacy Settings / Placement Rules bounds, shared by both write routes and the form. */
export const TPO_RULE_LIMITS={
 maxHeldOffers:{min:1,max:5},
 upliftPct:{min:0,max:200},
 minResponseHours:{min:12,max:168},
} as const;
export type TpoRuleBoundKey=keyof typeof TPO_RULE_LIMITS;
export function tpoRuleBoundsValid(values:Record<TpoRuleBoundKey,number>):boolean{
 return (Object.keys(TPO_RULE_LIMITS) as TpoRuleBoundKey[]).every(key=>
  Number.isInteger(values[key])&&
  values[key]>=TPO_RULE_LIMITS[key].min&&values[key]<=TPO_RULE_LIMITS[key].max);
}
