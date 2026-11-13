import { boundedRequestJson } from "@/lib/bounded-request-json";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listPlacementSeasons} from "@/modules/placements/season-service";
import {changeTpoSeason,TpoSettingsStaleError} from "@/modules/placements/tpo-season-write-service";
import { route } from "@/security/route";

import { ROLE } from "@/modules/identity/roles";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";

/** Legacy /lens/seasons parity: the season selector must be populated by a
 * scoped read and must not silently create or switch a season. "Current" maps
 * to the only ACTIVE season in this college, never to the most recent ID. */
async function handleGET(){
  try{
    const context=await getCurrentRequestContext();
    const collegeId=context.membership?.collegeId;
    if(!collegeId||!hasMembershipRole(context,ROLE.TPO))
      throw new AuthorizationError("placements.manage");
    const seasons=await listPlacementSeasons(context,collegeId);
    const lens=seasons.map(row=>({
      id:row.id,name:row.name,startDate:row.startDate,endDate:row.endDate,
      isCurrent:row.status==="ACTIVE",
    })).sort((a,b)=>Number(b.isCurrent)-Number(a.isCurrent));
    return NextResponse.json({
      lens,
      seasons:seasons.map(row=>({
        id:row.id,name:row.name,code:row.code,
        startDate:row.startDate,endDate:row.endDate,
        status:row.status,isCurrent:row.status==="ACTIVE",
        expectedUpdatedAt:row.updatedAt.toISOString(),
      })),
      currentSeasonId:lens.find(row=>row.isCurrent)?.id??null,
    },{headers:{"Cache-Control":CACHE.PRIVATE}});
  }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  () => handleGET(),
);

async function writeSeason(request:Request,action:"POST"|"PUT"){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const raw:unknown=await boundedRequestJson(request);
    if(raw===null||typeof raw!=="object"||Array.isArray(raw))
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    // Legacy PUT identified the season by its ID; never edit the selected
    // season implicitly. Keep vNext's mandatory exact CAS token and confirmation.
    const input=action==="PUT"?{...raw,action:"EDIT"}:raw;
    const season=await changeTpoSeason(context,input);
    return NextResponse.json({season,ok:true},
      {headers:{"Cache-Control":CACHE.PRIVATE}});
  }catch(error){
    if(error instanceof TpoSettingsStaleError)
      return NextResponse.json({error:"TPO_SETTINGS_STALE"},{status:409});
    return apiErrorResponse(error);
  }
}
/** vNext create/edit form, retained for existing callers. */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return writeSeason(request,"POST");
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
/** Legacy edit verb; body must include explicit seasonId and revision token. */
async function handlePUT(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return writeSeason(request,"PUT");
}
export const PUT = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePUT(request as Parameters<typeof handlePUT>[0]),
);
