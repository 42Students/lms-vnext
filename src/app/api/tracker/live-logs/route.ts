import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {readTrackerLiveLogs,safeTrackerCloudLogDetail,trackerCloudLogQuerySchema} from "@/modules/bug-tracker/tracker-cloud-logs";
import {alertEnvironment} from "@/modules/log-alerts/signature";
import {isSuperAdmin} from "@/modules/identity/context";

export const runtime="nodejs";
const filters=["windowMinutes","pageToken","query","minimumSeverity","anchorAt","anchor","environment","size","level","search","window"] as const;
const actions=z.strictObject({
  action:z.enum(["QUERY","DETAIL","DEPLOYS","DEPLOY_HEALTH"]),
  filters:z.record(z.string(),z.unknown()).optional(),
  id:z.string().min(1).max(1024).optional(),
  environment:z.enum(["PRODUCTION","UAT","DEVELOPMENT"]).optional(),
  at:z.iso.datetime({offset:true}).optional(),
});
function normalizedFilters(raw:Record<string,unknown>){
  const legacy:Record<string,string>={anchor:"anchorAt",search:"query",level:"minimumSeverity",window:"windowMinutes"};
  if(Object.keys(raw).some(key=>!filters.includes(key as typeof filters[number])))return null;
  const next:Record<string,unknown>={};
  for(const [key,value] of Object.entries(raw)){
    const target=legacy[key]??key;
    if(target in next)return null;
    next[target]=value;
  }
  if(next.environment!==undefined && next.environment!==alertEnvironment())return null;
  delete next.environment;
  if(next.size!==undefined){
    const size=Number(next.size);
    if(!Number.isSafeInteger(size)||size<1||size>12)return null;
  }
  const size=next.size===undefined?12:Number(next.size);
  delete next.size;
  // Legacy level values are case-insensitive; the provider is restricted to
  // WARNING/ERROR and never accepts raw Cloud Logging filter expressions.
  if(typeof next.minimumSeverity==="string")next.minimumSeverity=next.minimumSeverity.toUpperCase();
  const parsed=trackerCloudLogQuerySchema.safeParse(next);
  return parsed.success?{query:parsed.data,size}:null;
}
function authorized(context:Awaited<ReturnType<typeof getCurrentRequestContext>>){
  return isSuperAdmin(context)&&context.user.platformStatus==="ACTIVE"&&
    !context.adminScope?.collegeId&&!context.adminScope?.organizationId;
}
async function execute(context:Awaited<ReturnType<typeof getCurrentRequestContext>>,
  filtersRaw:Record<string,unknown>,detailId?:string){
  const parsed=normalizedFilters(filtersRaw);
  if(!parsed)return NextResponse.json({message:"Check the log filters."},{status:400});
  try{
    const page=await readTrackerLiveLogs(context,parsed.query);
    if(detailId){
      const item=page.items.find(row=>row.id===detailId);
      if(!item)return NextResponse.json({message:"Log entry not found in this page."},{status:404});
      return NextResponse.json({entry:safeTrackerCloudLogDetail(item)},{headers:{"Cache-Control":"private, no-store"}});
    }
    return NextResponse.json({...page,items:page.items.slice(0,parsed.size),
      environment:alertEnvironment(),size:parsed.size},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch{
    return NextResponse.json({message:"Live logs could not be loaded. Try again."},{status:503});
  }
}
export async function GET(request:Request){
  const context=await getCurrentRequestContext();
  if(!authorized(context))return NextResponse.json({message:"Not authorized."},{status:403});
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(key=>url.searchParams.getAll(key).length>1))
    return NextResponse.json({message:"Check the log filters."},{status:400});
  return execute(context,Object.fromEntries(url.searchParams));
}
export async function POST(request:Request){
  if(!isSameOriginRequest(request))return NextResponse.json({message:"Not authorized."},{status:403});
  const context=await getCurrentRequestContext();
  if(!authorized(context))return NextResponse.json({message:"Not authorized."},{status:403});
  const payload:unknown=await request.json().catch(()=>null);
  const parsed=actions.safeParse(payload);
  if(!parsed.success)return NextResponse.json({message:"Check the log request."},{status:400});
  if(parsed.data.action==="QUERY"||parsed.data.action==="DETAIL"){
    if(parsed.data.action==="DETAIL"&&!parsed.data.id)
      return NextResponse.json({message:"Log entry ID is required."},{status:400});
    return execute(context,parsed.data.filters??{},parsed.data.action==="DETAIL"?parsed.data.id:undefined);
  }
  const environment=parsed.data.environment??alertEnvironment();
  if(environment!==alertEnvironment())
    return NextResponse.json({message:"Environment is not available in this workspace."},{status:400});
  if(parsed.data.action==="DEPLOY_HEALTH"&&!parsed.data.at)
    return NextResponse.json({message:"Deployment timestamp is required."},{status:400});
  // Deployment markers are not persisted in vNext. Never report a healthy
  // deploy or a regression inferred from an unrelated error log page.
  return NextResponse.json({environment,configured:false,available:false,
    ...(parsed.data.action==="DEPLOYS"?{deploys:[]}:{
      at:parsed.data.at,healthy:null,regressions:null}),
    message:"Deployment health history is not configured for this environment."},
    {headers:{"Cache-Control":"private, no-store"}});
}
