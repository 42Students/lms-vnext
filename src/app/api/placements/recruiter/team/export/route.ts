import { route } from "@/security/route";
import { gridExportFilename } from "@/modules/placements/grid-export-filename";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {getRecruiterCompanyTeam} from "@/modules/placements/recruiter-company-team-service";
import {buildHrTeamCsv} from "@/modules/placements/hr-team-csv-model";
import {hrTeamSearchSchema,searchHrTeam} from "@/modules/placements/hr-team-search-model";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const search=new URL(request.url).searchParams;
    const selected=z.string().uuid().parse(search.get("collegeId"));
    const q=hrTeamSearchSchema.parse(search.get("q")??undefined);
    const data=await getRecruiterCompanyTeam(context,selected);
    if(data.status!=="READY"||data.grant.collegeId!==selected)
   return NextResponse.json({error:"COLLEGE_NOT_FOUND"},{status:404});
    const result=buildHrTeamCsv(searchHrTeam(data.team,q));
    return new Response(result.csv,{headers:{
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="' + gridExportFilename("recruiter-company-team", "csv") + '"',
   "Cache-Control":"private, no-store",
   "X-Export-Capped":result.truncated?"true":"false",
  }});
  },
);
