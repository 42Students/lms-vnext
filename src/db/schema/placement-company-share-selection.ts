/** Registered in 0121: selected-applicant scope for short-lived employer shares. */
import {index,primaryKey,pgTable,uuid} from "drizzle-orm/pg-core";
import {placementCompanyApplicantShares} from "./placement-company-shares";
import {placementApplications} from "./placements";
export const placementCompanyShareSelections=pgTable("placement_company_share_selections",{
 shareId:uuid("share_id").notNull().references(()=>placementCompanyApplicantShares.id,{onDelete:"restrict"}),
 applicationId:uuid("application_id").notNull().references(()=>placementApplications.id,{onDelete:"restrict"}),
},t=>[primaryKey({columns:[t.shareId,t.applicationId]}),index("pcss_application_idx").on(t.applicationId)]);
