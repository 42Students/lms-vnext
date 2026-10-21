import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { canReadSkillCatalog } from "@/modules/skills/catalog-access";
import { skillsCatalogRuntimeEnabled } from "@/modules/skills/catalog-readiness";
import {
  listSkillSynonymsForParent, searchSkillsByExactSynonym, skillSynonymExists,
} from "@/modules/skills/catalog-service";

export const runtime = "nodejs";
type Context = {params:Promise<{path:string[]}>};

/** Read-only alias tools for permitted catalog importers/editors.
 * Never creates cross-tenant users, tracks lookup activity or mutates terms. */
export async function GET(request:Request,{params}:Context) {
  if(!skillsCatalogRuntimeEnabled())return NextResponse.json({
    error:"DB10_SKILLS_MIGRATIONS_PENDING",
    message:"Synonym catalog is not ready; entered skill names can be saved without selecting an alias.",
  },{status:503,headers:{"Cache-Control":"private, no-store"}});
  try{
    const context=await getCurrentRequestContext();
    if(!canReadSkillCatalog(context))
      return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const {path}=await params;
    const url=new URL(request.url);
    const term=url.searchParams.get("term")??url.searchParams.get("synonym")??"";
    if(path[0]==="for"&&path.length===2){
      const items=await listSkillSynonymsForParent(context,path[1]);
      if(items===null)return NextResponse.json({error:"SKILL_NOT_FOUND"},{status:404});
      return NextResponse.json({status:"success",data:items},
        {headers:{"Cache-Control":"private, no-store"}});
    }
    if(path[0]==="exists"&&path.length===1)
      return NextResponse.json({status:"success",data:await skillSynonymExists(context,term)},
        {headers:{"Cache-Control":"private, no-store"}});
    if(path[0]==="exact"&&path.length===1)
      return NextResponse.json({status:"success",data:await searchSkillsByExactSynonym(context,term)},
        {headers:{"Cache-Control":"private, no-store"}});
    return NextResponse.json({error:"NOT_FOUND"},{status:404});
  }catch(error){return apiErrorResponse(error);}
}
