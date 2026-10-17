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
