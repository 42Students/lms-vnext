import {z} from "zod";
export const publicPlacementMetricSchema=z.enum([
 "STUDENTS","PLACED","PERCENT","OFFERS","HIRING_COMPANIES","HIGHEST_CTC","MEDIAN_CTC",
]);
export type PublicPlacementMetricKey=z.infer<typeof publicPlacementMetricSchema>;
export const DEFAULT_PUBLIC_METRICS:PublicPlacementMetricKey[]=["PLACED","OFFERS","HIRING_COMPANIES"];
export const PUBLIC_METRIC_LABELS:Readonly<Record<PublicPlacementMetricKey,string>>={
 STUDENTS:"Students in placements",PLACED:"Students placed",PERCENT:"Placed %",
 OFFERS:"Offers",HIRING_COMPANIES:"Companies that hired",
 HIGHEST_CTC:"Highest CTC",MEDIAN_CTC:"Median CTC",
};
export const publicPlacementContentInput=z.strictObject({
 about:z.string().trim().max(4000),
 metricKeys:z.array(publicPlacementMetricSchema).min(1).max(7)
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
 if(amount===null||!Number.isFinite(amount))return "(not enough data yet)";
 if(key==="HIGHEST_CTC"||key==="MEDIAN_CTC")return (amount/100000).toFixed(1)+" LPA";
 if(key==="PERCENT")return amount+"%";
 return new Intl.NumberFormat("en-IN").format(amount);
}
