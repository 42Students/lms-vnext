import {pgTable,uuid,text,jsonb,timestamp,check} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";
import {colleges} from "./colleges";
import type {PublicPlacementMetricKey} from "@/modules/placements/public-page/content-model";
export const placementPublicPageContent=pgTable("placement_public_page_content",{
 collegeId:uuid("college_id").primaryKey().references(()=>colleges.id,{onDelete:"restrict"}),
 about:text("about").notNull().default(""),
 metricKeys:jsonb("metric_keys").$type<PublicPlacementMetricKey[]>().notNull(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
 check("placement_public_about_length",sql`char_length(${table.about}) <= 4000`),
 check("placement_public_metric_array",sql`jsonb_typeof(${table.metricKeys}) = 'array'`),
]);

/** Preserve legacy metric tile order when projecting to the normalized page. */
export function normalizeLegacyPublicMetricOrder(raw: unknown): {
  ordered: PublicPlacementMetricKey[]; unknown: string[];
} {
  const keys = ["STUDENTS","PLACED","PERCENT","OFFERS","HIRING_COMPANIES","HIGHEST_CTC","MEDIAN_CTC"] as const;
  const allowed: ReadonlySet<string> = new Set(keys);
  const ordered: PublicPlacementMetricKey[] = [], unknown: string[] = [];
  const seen = new Set<string>();
  if (!Array.isArray(raw)) return {ordered,unknown};
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const key = item.trim().toUpperCase() === "COMPANIES" ? "HIRING_COMPANIES" : item.trim().toUpperCase();
    if (!allowed.has(key)) {unknown.push(item);continue;}
    if (!seen.has(key)) {seen.add(key);ordered.push(key as PublicPlacementMetricKey);}
  }
  return {ordered,unknown};
}
