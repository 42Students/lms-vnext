import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {readTrackerLiveLogs,trackerCloudLogQuerySchema} from "@/modules/bug-tracker/tracker-cloud-logs";
import {isSuperAdmin} from "@/modules/identity/context";

export const runtime="nodejs";
export async function GET(request:Request){
  const context=await getCurrentRequestContext();
  if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
     context.adminScope?.collegeId||context.adminScope?.organizationId)
    return NextResponse.json({message:"Not authorized."},{status:403});
  const url=new URL(request.url);
  const keys=["windowMinutes","pageToken","query"] as const;
  if([...url.searchParams.keys()].some(key=>!keys.includes(key as typeof keys[number]))||
    keys.some(key=>url.searchParams.getAll(key).length>1))
    return NextResponse.json({message:"Check the log filters."},{status:400});
  const parsed=trackerCloudLogQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if(!parsed.success)return NextResponse.json({message:"Check the log filters."},{status:400});
  try{
    const page=await readTrackerLiveLogs(context,parsed.data);
    return NextResponse.json(page,{headers:{"Cache-Control":"private, no-store"}});
  }catch{
    return NextResponse.json({message:"Live logs could not be loaded. Try again."},{status:503});
  }
}
