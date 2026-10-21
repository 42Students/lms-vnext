import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createSection,
  listSections,
  searchSections,
  listPopularClasses,
  collegeClassNameExists,
  recordClassSearchSelection,
} from "@/modules/academics/section-service";
import { z } from "zod";

export const runtime = "nodejs";

/**
 * vNext section CRUD is intentionally NOT a drop-in for legacy /api/v2/classes.
 * Legacy /search, /popular, /program, /category, /exists, /select and /refresh
 * need a separately permissioned/versioned discovery adapter. In particular,
 * POST here must never record a selection or invoke a cache refresh: it
 * persists a real section and requires the same-origin mutation policy.
 */

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode");
    if([...url.searchParams.keys()].some(key=>url.searchParams.getAll(key).length>1))
      return NextResponse.json({error:"INVALID_FILTERS"},{status:400});
    if (mode && mode !== "list") {
      // Scoped legacy discovery; obsolete in-memory select and cache-refresh
      // operations never create or modify academic data in vNext.
      const supported = ["search", "program", "category", "popular", "stats",
        "exists", "select", "refresh"];
      if (!supported.includes(mode))
        return NextResponse.json({ error:"INVALID_SEARCH_MODE" },{status:400});
      const requestedLimit=url.searchParams.get("limit")??"20";
      const limit=Number(requestedLimit);
      if(!/^[0-9]+$/.test(requestedLimit)||!Number.isSafeInteger(limit)||limit<1||limit>100)
        return NextResponse.json({error:"INVALID_LIMIT"},{status:400});
      const programId=url.searchParams.get("programId")??undefined;
      if(programId&&!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(programId))
        return NextResponse.json({error:"INVALID_PROGRAM"},{status:400});
      const q=(url.searchParams.get("q")??url.searchParams.get("name")??"").trim();
      if(q.length>100)return NextResponse.json({error:"INVALID_QUERY"},{status:400});
      if((mode==="exists"||mode==="select")&&!q)
        return NextResponse.json({error:"NAME_REQUIRED"},{status:400});
      if(mode==="exists"){
        const result=await collegeClassNameExists(context,q,programId);
        return NextResponse.json({status:"success",message:"OK",...result},
          {headers:{"Cache-Control":"private, no-store"}});
      }
      if(mode==="select")return NextResponse.json({error:"USE_POST_FOR_SELECTION",
        message:"Confirm the class selection with an authenticated POST."},{status:405});
      const rows=mode==="popular"?
        await listPopularClasses(context,programId,limit):
        await searchSections(context,{q,programId,limit});
      const items=rows.map(row=>({id:row.id,name:row.name,code:row.code,
        className:row.name,batchId:row.cohortId,batchName:row.cohortName,
        programId:row.programId,programName:row.programName,
        academicPeriodId:row.academicPeriodId}));
      const headers={"Cache-Control":"private, no-store"};

      // A name-existence check reads the full college scope above, not a page.
      if(mode==="stats")return NextResponse.json({returned:items.length,limited:items.length===limit,
        total:null,scope:"CURRENT_COLLEGE",status:"success"}, {headers});
      if(mode==="refresh")return NextResponse.json({status:"success",
        cache:"NO_PERSISTED_CLASS_SEARCH_CACHE",refreshed:false}, {headers});
      if(mode==="popular")return NextResponse.json({sections:items,data:items,
        popularityAvailable:true,order:"USAGE_DESC",message:"OK"}, {headers});
      return NextResponse.json({sections:items,data:items}, {headers});
    }
    const cohortId = url.searchParams.get("cohortId");
    if (!cohortId) {
      return NextResponse.json({
        error: "COHORT_SCOPE_REQUIRED",
        message: "Choose a batch to view its classes.",
        fieldErrors: { cohortId: "Choose a batch to view its classes." },
      }, { status: 400 });
    }
    const sections = await listSections(
      context,
      cohortId,
      url.searchParams.get("academicPeriodId"),
    );

    return NextResponse.json({ sections });
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
    const body: unknown = await request.json();
    // Do not interpret the old no-body refresh or click/select actions as a
    // section create. A typed create payload remains mandatory.
    if(body&&typeof body==="object"&&!Array.isArray(body)&&
      "action" in body&&body.action==="SELECT"){
      const selected=z.strictObject({
        action:z.literal("SELECT"),sectionId:z.uuid(),
        idempotencyKey:z.uuid(),
      }).parse(body);
      const result=await recordClassSearchSelection(context,
        selected.sectionId,selected.idempotencyKey);
      return NextResponse.json({status:"success",message:"Class selection recorded",
        ...result},{headers:{"Cache-Control":"private, no-store"}});
    }
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        ("action" in body && (
          body.action === "REFRESH" || body.action === "SELECT"
        ))) {
      return NextResponse.json({
        error: "INVALID_SECTION_CREATE",
        message: "Enter section details before creating a class.",
      }, { status: 400 });
    }
    const section = await createSection(
      context,
      body,
    );

    return NextResponse.json(
      { section },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
