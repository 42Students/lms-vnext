import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {apiErrorResponse} from "@/lib/api-error";
import {recruiterCalendarQuerySchema,listRecruiterCalendarEvents}
 from "@/modules/placements/recruiter-calendar-service";
import {recruiterCalendarIcs} from "@/modules/placements/recruiter-calendar-ics-model";

import { CACHE } from "@/security/responses";
import { attachmentHeader } from "@/security/downloads";
import { zUuid } from "@/lib/schema-primitives";
export const runtime="nodejs";
const querySchema=z.strictObject({
 from:z.iso.date(),to:z.iso.date(),collegeId:zUuid.optional(),
});

export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ request, context: actor }) => {
    const context = actor!;
    if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const search=new URL(request.url).searchParams;
    const keys=[...search.keys()];
    if(keys.some(key=>!["from","to","collegeId"].includes(key))||
    new Set(keys).size!==keys.length)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const parsed=querySchema.safeParse(Object.fromEntries(search));
    if(!parsed.success||!recruiterCalendarQuerySchema.safeParse({
   from:parsed.data?.from,to:parsed.data?.to,
  }).success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const granted=context.recruiter?.grants??[];
    const collegeId=parsed.data.collegeId??(granted.length===1?granted[0]!.collegeId:null);
    if(!collegeId||!granted.some(grant=>grant.collegeId===collegeId))
   return NextResponse.json({error:"FORBIDDEN"},{status:403});
    const calendar=await listRecruiterCalendarEvents(context,{
   from:parsed.data.from,to:parsed.data.to,
  },collegeId);
    const exported=recruiterCalendarIcs(calendar.events,calendar.resultsDue,new Date());
    return new Response(exported.ics,{headers:{
   "Content-Type":"text/calendar; charset=utf-8",
   "Content-Disposition":attachmentHeader("recruiter-drives.ics"),
   "Cache-Control":CACHE.PRIVATE,
   "X-Content-Type-Options":"nosniff",
   ...(exported.truncated?{"X-Export-Truncated":"true"}:{}),
  }});
  },
);
