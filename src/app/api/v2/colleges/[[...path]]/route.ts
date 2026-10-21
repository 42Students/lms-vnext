import {NextResponse} from "next/server";
import {and,inArray,sql} from "drizzle-orm";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {getDb} from "@/db/client";
import {collegeMemberships} from "@/db/schema";
import {listColleges} from "@/modules/colleges/service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
type RouteContext={params:Promise<{path?:string[]}>};
const synonyms:Record<string,string>={
 iit:"indian institute of technology",nit:"national institute of technology",
 iiit:"international institute of information technology",
 bits:"birla institute of technology and science",
 vit:"vellore institute of technology",srm:"srm institute of science and technology",
 rvce:"rv college of engineering",pes:"pes university",
 bmsce:"bms college of engineering",
};
const clean=(text:string|null|undefined)=>(text??"").trim().toLocaleLowerCase("en-IN");
function fuzzy(a:string,b:string):boolean{
 if(a.length<3||b.length<3||Math.abs(a.length-b.length)>2)return false;
 let previous=Array.from({length:b.length+1},(_,n)=>n);
 for(let i=1;i<=a.length;i++){
  const next=[i];
  let minimum=i;
  for(let j=1;j<=b.length;j++){
   next[j]=Math.min(next[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
   minimum=Math.min(minimum,next[j]);
  }
  if(minimum>2)return false;
  previous=next;
 }
 return previous[b.length]<=2;
}
function searchScore(row:{name:string;code:string;city:string|null;state:string|null},query:string):number{
 if(!query)return 1;
 const terms=[query,...(synonyms[query]?[synonyms[query]]:[])];
 let score=0;
 for(const term of terms)for(const value of [row.name,row.code,row.city,row.state].map(clean)){
  score=Math.max(score,value===term?100:value.startsWith(term)?80:
    value.includes(" "+term)?60:value.includes(term)?40:
    fuzzy(term,value)?20:0);
 }
 return score;
}
function positiveInt(raw:string|null,fallback:number,max:number){
 const parsed=Number(raw);
 return raw&&Number.isSafeInteger(parsed)&&parsed>0?Math.min(max,parsed):fallback;
}
async function scopedCatalog(){
 const context=await getCurrentRequestContext();
 const colleges=await listColleges(context);
 if(!colleges.length)return {colleges,activity:new Map<string,number>()};
 const registrations=await getDb().select({
  collegeId:collegeMemberships.collegeId,
  total:sql<number>`count(*)::integer`,
 }).from(collegeMemberships)
  .where(inArray(collegeMemberships.collegeId,colleges.map(item=>item.id)))
  .groupBy(collegeMemberships.collegeId);
 return {colleges,activity:new Map(registrations.map(row=>[row.collegeId,row.total]))};
}
export async function GET(request:Request,{params}:RouteContext){
 try{
  const {path=[]}=await params;
  const action=path[0]??"search";
  const url=new URL(request.url),query=url.searchParams;
  if([...query.keys()].some(key=>!["q","query","limit","page","state","city","code","name"].includes(key)))
   return NextResponse.json({error:"INVALID_FILTER"},{status:400,headers:noStore});
  const {colleges,activity}=await scopedCatalog();
  const entries=colleges.map(row=>({...row,activityCount:activity.get(row.id)??0}));
  const limit=positiveInt(query.get("limit"),25,100);
  const page=positiveInt(query.get("page"),1,10000);
  let rows=entries;
  if(action==="states"){
   const states=[...new Set(entries.map(row=>row.state?.trim()).filter((v):v is string=>Boolean(v)))].sort((a,b)=>a.localeCompare(b,"en-IN"));
   return NextResponse.json({states,count:states.length},{headers:noStore});
  }
  if(action==="categories"){
   // Old ad-hoc categories have no vNext entity. Group by the intentional
   // organization tenant boundary instead; never infer college categories.
   const ids=[...new Set(entries.map(row=>row.organizationId))];
   return NextResponse.json({categories:ids.map(id=>({id,kind:"ORGANIZATION"})),
    mapping:"ORGANIZATION_SCOPE"},{headers:noStore});
  }
  if(action==="stats"){
   const byState:Record<string,number>={};
   for(const row of entries)byState[row.state??"Unknown"]=(byState[row.state??"Unknown"]??0)+1;
   return NextResponse.json({totalAuthorizedColleges:entries.length,byState,
    authorizedMemberships:entries.reduce((total,row)=>total+row.activityCount,0),
    scope:"AUTHORIZED_ONLY"},{headers:noStore});
  }
  if(action==="exists"){
   const code=clean(query.get("code")),name=clean(query.get("name"));
   if(!code&&!name)return NextResponse.json({error:"CODE_OR_NAME_REQUIRED"},{status:400,headers:noStore});
   return NextResponse.json({exists:entries.some(row=>
    Boolean(code&&clean(row.code)===code||name&&clean(row.name)===name)),
    scope:"AUTHORIZED_ONLY"},{headers:noStore});
  }
  if(action==="state"&&path[1])rows=rows.filter(row=>clean(row.state)===clean(path[1]));
  else if(action==="city"&&path[1])rows=rows.filter(row=>clean(row.city)===clean(path[1]));
  else if(action==="category"&&path[1])rows=rows.filter(row=>row.organizationId===path[1]);
  else if(!["state","city","category","popular","search","select"].includes(action))
   return NextResponse.json({error:"NOT_FOUND"},{status:404,headers:noStore});
  if((action==="state"||action==="city"||action==="category")&&!path[1])
   return NextResponse.json({error:"FILTER_REQUIRED"},{status:400,headers:noStore});
  if(action==="search"||action==="select"){
   const term=clean(query.get("q")??query.get("query"));
   if(term.length>100)return NextResponse.json({error:"QUERY_TOO_LONG"},{status:400,headers:noStore});
   rows=rows.map(row=>({...row,rank:searchScore(row,term)})).filter(row=>row.rank>0)
    .sort((a,b)=>b.rank-a.rank||b.activityCount-a.activityCount||
      a.name.localeCompare(b.name,"en-IN")||a.id.localeCompare(b.id));
  }else{
   rows.sort((a,b)=>b.activityCount-a.activityCount||
    a.name.localeCompare(b.name,"en-IN")||a.id.localeCompare(b.id));
  }
  const total=rows.length;
  const visible=rows.slice((page-1)*limit,page*limit);
  const data=action==="select"
   ?visible.map(row=>({id:row.id,name:row.name,code:row.code}))
   :visible.map(({activityCount,...row})=>({...row,
      popularity:activityCount,popularityKind:"REGISTERED_MEMBERSHIPS"}));
  return NextResponse.json({items:data,total,page,pageSize:limit,
   hasMore:page*limit<total,scope:"AUTHORIZED_ONLY"},{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
export async function POST(request:Request,{params}:RouteContext){
 const {path=[]}=await params;
 if(path[0]!=="refresh")return NextResponse.json({error:"NOT_FOUND"},{status:404,headers:noStore});
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403,headers:noStore});
 try{
  await scopedCatalog();
  // Read-through SQL is authoritative in vNext, so no stale search cache
  // exists to flush. Preserve the old refresh action as a safe no-op.
  return NextResponse.json({refreshed:true,cache:"LIVE_DATABASE"},{headers:noStore});
 }catch(error){return apiErrorResponse(error);}
}
