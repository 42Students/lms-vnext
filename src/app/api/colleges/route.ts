import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import {
  createCollege,
  listColleges,
} from "@/modules/colleges/service";
import { apiErrorResponse } from "@/lib/api-error";

export const runtime = "nodejs";

/**
 * College search compatibility (v2 route migration):
 *  /api/colleges?mode=search&q=...      (default 15, maximum 50)
 *  /api/colleges?mode=names              (authorized org names only)
 *  /api/colleges?mode=exists&name=...    (exact case-insensitive)
 *  /api/colleges?mode=state&state=...    (default 50)
 *  /api/colleges?mode=city&city=...      (default 50)
 *  /api/colleges?mode=states            (distinct scoped state names)
 *  /api/colleges?mode=categories        (state-based category aliases)
 *  /api/colleges?mode=popular           (alphabetic fallback; no fake usage)
 * Legacy numeric IDs are not accepted: organizationId and college IDs remain
 * UUIDs. Creating a college maps org_id→organizationId, unique_id→code,
 * pin→postalCode in the trusted migration/consumer layer, never by guessing.
 * No unscoped cache, select mutation or stale cross-tenant search results.
 */

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const params=new URL(request.url).searchParams;
    const organizationId=params.get("organizationId");
    const mode=params.get("mode")??"list";
    const q=params.get("q")?.trim()??"";
    const name=params.get("name")?.trim()??"";
    if(q.length>200||name.length>255)
      return NextResponse.json({error:"INVALID_SEARCH",message:"Search input is too long."},{status:400});
    const rawLimit=params.get("limit");
    const parsedLimit=rawLimit===null?null:Number(rawLimit);
    if(parsedLimit!==null&&(!Number.isSafeInteger(parsedLimit)||parsedLimit<1||parsedLimit>50))
      return NextResponse.json({error:"INVALID_LIMIT",message:"Limit must be between 1 and 50."},{status:400});
    const started=Date.now();
    const items=await listColleges(context,organizationId);
    if(mode==="list")return NextResponse.json({colleges:items},{headers:{"Cache-Control":"private, no-store"}});
    const elapsed=Math.max(0,Date.now()-started);
    const project=(row:typeof items[number])=>({
      id:row.id,organizationId:row.organizationId,
      name:row.name,collegeName:row.name,code:row.code,uniqueId:row.code,
      city:row.city??"",state:row.state??"",address:row.addressLine1??"",
      zip:row.postalCode??"",logo:null as string|null,
    });
    if(mode==="exists"){
      if(!name)return NextResponse.json({error:"NAME_REQUIRED"},{status:400});
      const exists=items.some(item=>item.name.toLocaleLowerCase("en-IN")===name.toLocaleLowerCase("en-IN"));
      return NextResponse.json({status:"OK",message:"Checked",data:exists,exists},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(mode==="names"){
      const names=items.map(item=>({id:item.id,name:item.name,uniqueId:item.code}));
      return NextResponse.json({status:"OK",message:"Colleges retrieved",data:names,names},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(mode==="stats"){
      const data={total:items.length,
        states:new Set(items.map(row=>row.state).filter(Boolean)).size,
        cities:new Set(items.map(row=>row.city).filter(Boolean)).size};
      return NextResponse.json({status:"OK",message:"Stats retrieved",data},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(mode==="refresh"){
      // Fresh persisted read above already bypasses process-local caches.
      return NextResponse.json({status:"OK",message:"Directory refreshed",
        data:items.map(project).slice(0,parsedLimit??50)},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(mode==="select"){
      const id=params.get("collegeId")??params.get("id");
      const selected=items.find(row=>row.id===id);
      if(!selected)return NextResponse.json({error:"COLLEGE_NOT_FOUND"},{status:404});
      return NextResponse.json({status:"OK",message:"College selected for preview",
        data:project(selected),scopeChangePerformed:false},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(mode==="states"||mode==="categories"){
      const data=[...new Set(items.map(row=>row.state?.trim()).filter((v):v is string=>Boolean(v)))].sort();
      return NextResponse.json({status:"OK",message:mode==="states"?"States retrieved":"Categories retrieved",data},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(!["search","popular","state","city","category"].includes(mode))
      return NextResponse.json({error:"INVALID_SEARCH_MODE"},{status:400});
    const limit=parsedLimit??(mode==="search"?15:mode==="popular"?10:50);
    const match=q.toLocaleLowerCase("en-IN");
    const region=(mode==="state"||mode==="category"?params.get("state"):params.get("city"))?.trim().toLocaleLowerCase("en-IN")??"";
    const result=items.filter(row=>{
      if(mode==="state"||mode==="category")return Boolean(region)&&row.state?.toLocaleLowerCase("en-IN")===region;
      if(mode==="city")return Boolean(region)&&row.city?.toLocaleLowerCase("en-IN")===region;
      return !match||[row.name,row.code,row.city??"",row.state??""]
        .some(value=>value.toLocaleLowerCase("en-IN").includes(match));
    }).slice(0,limit).map(project);
    // Legacy popularity was a process-local usage count; vNext intentionally
    // does not invent cross-tenant popularity counts from alphabetic rows.
    const message=mode==="popular"
      ?"Popularity ranking unavailable; showing authorized colleges by name."
      :"Colleges retrieved in "+elapsed+"ms";
    return NextResponse.json({status:"OK",message,data:result,colleges:result,
      ...(mode==="popular"?{popularityAvailable:false}:{})},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const college = await createCollege(
      context,
      body as {
        organizationId: string;
        name: string;
        code: string;
      },
    );

    return NextResponse.json(
      { college },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
