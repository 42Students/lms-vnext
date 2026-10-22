import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listPlacementSeasons} from "@/modules/placements/season-service";
import {changeTpoSeason,TpoSettingsStaleError} from "@/modules/placements/tpo-season-write-service";

export const runtime="nodejs";

/** Legacy /lens/seasons parity: the season selector must be populated by a
 * scoped read and must not silently create or switch a season. "Current" maps
 * to the only ACTIVE season in this college, never to the most recent ID. */
export async function GET(){
  try{
    const context=await getCurrentRequestContext();
    const collegeId=context.membership?.collegeId;
    if(!collegeId||!hasMembershipRole(context,"TPO"))
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
    },{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}

async function writeSeason(request:Request,action:"POST"|"PUT"){
  if(!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try{
    const context=await getCurrentRequestContext();
    const raw:unknown=await request.json();
    if(raw===null||typeof raw!=="object"||Array.isArray(raw))
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    // Legacy PUT identified the season by its ID; never edit the selected
    // season implicitly. Keep vNext's mandatory exact CAS token and confirmation.
    const input=action==="PUT"?{...raw,action:"EDIT"}:raw;
    const season=await changeTpoSeason(context,input);
    return NextResponse.json({season,ok:true},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof TpoSettingsStaleError)
      return NextResponse.json({error:"TPO_SETTINGS_STALE"},{status:409});
    return apiErrorResponse(error);
  }
}
/** vNext create/edit form, retained for existing callers. */
export async function POST(request:Request){return writeSeason(request,"POST");}
/** Legacy edit verb; body must include explicit seasonId and revision token. */
export async function PUT(request:Request){return writeSeason(request,"PUT");}
