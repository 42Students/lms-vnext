import {z} from "zod";
export const publicPlacementMetricSchema=z.enum([
 "STUDENTS","PLACED","PERCENT","OFFERS","HIRING_COMPANIES","HIGHEST_CTC","MEDIAN_CTC",
]);
export type PublicPlacementMetricKey=z.infer<typeof publicPlacementMetricSchema>;
/** Legacy STUDENTS, PLACED, COMPANIES ordering; legacy COMPANIES maps
 * to the audited HIRING_COMPANIES aggregate, not a company roster. */
export const LEGACY_PUBLIC_METRIC_KEY_MAP={
 COMPANIES:"HIRING_COMPANIES",PLACED_PERCENT:"PERCENT",
} as const;
export function normalizePublicPlacementMetricKeys(values:readonly string[]){
 const result:PublicPlacementMetricKey[]=[];
 for(const entry of values){
  const candidate=entry==="COMPANIES"?"HIRING_COMPANIES":
   entry==="PLACED_PERCENT"?"PERCENT":entry;
  const parsed=publicPlacementMetricSchema.safeParse(candidate);
  if(parsed.success&&!result.includes(parsed.data))result.push(parsed.data);
 }
 return result.length?result:[...DEFAULT_PUBLIC_METRICS];
}
export const DEFAULT_PUBLIC_METRICS:PublicPlacementMetricKey[]=["STUDENTS","PLACED","HIRING_COMPANIES"];
export const PUBLIC_METRIC_LABELS:Readonly<Record<PublicPlacementMetricKey,string>>={
 STUDENTS:"Students in placements",PLACED:"Students placed",PERCENT:"Placed",
 OFFERS:"Offers",HIRING_COMPANIES:"Companies that hired",
 HIGHEST_CTC:"Highest CTC",MEDIAN_CTC:"Median CTC",
};
export const publicPlacementContentInput=z.strictObject({
 about:z.string().trim().max(4000),
 metricKeys:z.preprocess(value=>Array.isArray(value)?value.map(key=>key==="COMPANIES"?"HIRING_COMPANIES":key==="PLACED_PERCENT"?"PERCENT":key):value,
   z.array(publicPlacementMetricSchema).min(1).max(7))
  .refine(a=>new Set(a).size===a.length,"Choose each public number once"),
 expectedUpdatedAt:z.iso.datetime().nullable(),
});
export function formatPublicPlacementMetric(key:PublicPlacementMetricKey,values:{
 population:number|null;placed:number|null;offers:number|null;employers:number|null;
 highestCtcInr:number|null;medianCtcInr:number|null;
}){
 const amount=key==="STUDENTS"?values.population:key==="PLACED"?values.placed:
  key==="PERCENT"?(values.population&&values.placed!==null?
   Math.round(100*values.placed/values.population):null):
  key==="OFFERS"?values.offers:key==="HIRING_COMPANIES"?values.employers:
  key==="HIGHEST_CTC"?values.highestCtcInr:values.medianCtcInr;
 // A suppressed aggregate is absent, not an empty tile exposing the choice.
 if(amount===null||!Number.isFinite(amount))return null;
 if(key==="HIGHEST_CTC"||key==="MEDIAN_CTC")return new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(amount/100000)+" LPA";
 if(key==="PERCENT")return amount+"%";
 return new Intl.NumberFormat("en-IN").format(amount);
}
