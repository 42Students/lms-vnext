import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {listSuperAdminCompanyDirectory} from "@/modules/placements/admin-company-directory-service";
export const runtime="nodejs";
/** Search currently authorized, active company relationships only. The
 * merge writer still independently checks same-college source/target scope. */
export async function GET(request:Request){
 try{
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(key=>key!=="q"&&key!=="page")||
     url.searchParams.getAll("q").length>1||
     url.searchParams.getAll("page").length>1)
    return Response.json({error:"INVALID_REQUEST"},{status:400});
  const q=url.searchParams.get("q")??"",page=url.searchParams.get("page")??"1";
  const data=await listSuperAdminCompanyDirectory(await getCurrentRequestContext(),{q,page});
  const unique=new Map(data.rows.filter(item=>item.companyStatus==="ACTIVE").map(item=>[
   item.companyId,{id:item.companyId,name:item.name},
  ]));
  return Response.json({items:[...unique.values()],page:data.query.page,more:data.truncated},
   {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
