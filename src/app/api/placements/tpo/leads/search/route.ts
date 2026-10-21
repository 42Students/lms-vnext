import {NextResponse} from "next/server";
import {and,asc,eq,or,sql} from "drizzle-orm";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getDb} from "@/db/client";
import {placementTpoLeads} from "@/db/schema";
import {apiErrorResponse} from "@/lib/api-error";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {tpoCrmCollegeIdSchema} from "@/modules/placements/tpo-crm-validation";
import {tpoCrmTablesReady} from "@/modules/placements/tpo-crm-storage-readiness";
export const runtime="nodejs";

/** Remote and bounded recruiter lookup: tenant-scoped, no contact fields. */
export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams;
  const keys=[...params.keys()];
  if(keys.length!==new Set(keys).size||keys.some(key=>!["collegeId","q","page"].includes(key)))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const collegeId=tpoCrmCollegeIdSchema.safeParse(params.get("collegeId"));
  const query=(params.get("q")??"").trim();
  const pageText=params.get("page")??"1";
  if(!collegeId.success||query.length<2||query.length>100||
    !/^[1-9][0-9]{0,2}$/.test(pageText))
   return NextResponse.json({error:"INVALID_QUERY"},{status:400});
  const context=await getCurrentRequestContext();
  await requirePlacementManageScope(context,collegeId.data);
  if(!await tpoCrmTablesReady())return NextResponse.json({error:"NOT_REGISTERED"},{status:503});
  const page=Math.min(500,Number(pageText));
  const matches=await getDb().select({
   id:placementTpoLeads.id,name:placementTpoLeads.name,
   companyName:placementTpoLeads.companyName,
  }).from(placementTpoLeads).where(and(
   eq(placementTpoLeads.collegeId,collegeId.data),
   or(sql`position(lower(${query}) in lower(${placementTpoLeads.name}))>0`,
    sql`position(lower(${query}) in lower(coalesce(${placementTpoLeads.companyName},'')))>0`),
  )).orderBy(asc(placementTpoLeads.name),asc(placementTpoLeads.id))
   .limit(21).offset((page-1)*20);
  return NextResponse.json({leads:matches.slice(0,20),hasMore:matches.length>20,page},{
   headers:{"Cache-Control":"private, no-store"},
  });
 }catch(error){return apiErrorResponse(error);}
}
