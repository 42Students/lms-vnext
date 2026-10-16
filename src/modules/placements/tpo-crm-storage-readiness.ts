import "server-only";
import { placementTableExists } from "./staged-tables";

/** Registered DB09 CRM storage is the readiness signal; absence fails closed. */
export async function tpoCrmTablesReady(): Promise<boolean> {
 const [leads, activities, followups] = await Promise.all([
  placementTableExists("placement_tpo_leads"),
  placementTableExists("placement_tpo_lead_activities"),
  placementTableExists("placement_tpo_followups"),
 ]);
 return leads && activities && followups;
}
