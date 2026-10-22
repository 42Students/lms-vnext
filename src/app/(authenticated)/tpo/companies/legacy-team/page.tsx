import {and,eq,sql} from "drizzle-orm";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships} from "@/db/schema";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {legacyCompanyTeamName,uniqueLegacyCompanyTeamId} from "@/modules/placements/tpo-legacy-company-team-model";
import {readTpoCompanyTeam} from "@/modules/placements/tpo-company-team-service";

/** Resolve a historic name-keyed Company Team navigation to the canonical
 * college/company UUID thread. No legacy numeric IDs or requester-chosen
 * college scopes are trusted. This does not invent/import unavailable chat. */
export default async function LegacyCompanyTeamPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const ctx=await getCurrentRequestContext();
 if(!ctx.membership||!hasPlacementTeamMembership(ctx))redirect("/dashboard");
 const params=await searchParams;
 if(Object.keys(params).some(key=>key!=="name")||typeof params["name"]!=="string")notFound();
 const key=legacyCompanyTeamName(params["name"]);
 if(!key)notFound();
 const collegeId=await requireTpoBatchActor(ctx);
 const candidates=await getDb().selectDistinct({id:placementCompanies.id,name:placementCompanies.name})
  .from(placementCompanyRelationships)
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(and(eq(placementCompanyRelationships.collegeId,collegeId),
   eq(placementCompanies.status,"ACTIVE"),
   sql`lower(regexp_replace(btrim(${placementCompanies.name}), '[[:space:]]+', ' ', 'g')) = ${key}`))
  .limit(2);
 const companyId=uniqueLegacyCompanyTeamId(candidates,key);
 if(!companyId)notFound(); // Two same-name colleges/aliases may not be merged.
 await readTpoCompanyTeam(ctx,companyId); // Enforce current persisted team scope.
 redirect("/tpo/companies/"+encodeURIComponent(companyId)+"/team");
}
