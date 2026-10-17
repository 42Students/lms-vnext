import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {hasTpoTooling} from "@/modules/placements/tpo-workspace-access-model";
import {findTpoPeopleAndCompanies} from "@/modules/placements/tpo-find-people-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {getPlacementTpoOperations} from "@/modules/placements/tpo-operations-service";

export const runtime="nodejs";
const termSchema=z.string().trim().min(2).max(100);

/** TPO-home-28: bounded, permission-scoped live record suggestions. */
export async function GET(request:NextRequest){
 try{
  const parsed=termSchema.safeParse(request.nextUrl.searchParams.get("q")??"");
  if(!parsed.success)return NextResponse.json({error:"Enter at least 2 characters."},{status:400});
  const context=await getCurrentRequestContext();
  if(!hasTpoTooling(context))return NextResponse.json({error:"Access denied"},{status:403});
  const collegeId=context.membership!.collegeId;
  const q=parsed.data;
  const [people,batches,operations]=await Promise.all([
   findTpoPeopleAndCompanies(context,collegeId,q),
   listTpoBatches(context),
   getPlacementTpoOperations(context,collegeId),
  ]);
  const term=q.toLocaleLowerCase();
  const matches=(...parts:(string|null|undefined)[])=>parts.some(value=>value?.toLocaleLowerCase().includes(term));
  const results=[
   ...people.students.slice(0,5).map(person=>({
    group:"Students",label:person.name??"Student",
    href:"/tpo/students?q="+encodeURIComponent(person.name??"")+"&student="+encodeURIComponent(person.id),
   })),
   ...people.recruiters.slice(0,5).map(person=>({
    group:"Recruiter Leads",label:person.name,href:"/tpo/recruiters/"+encodeURIComponent(person.id),
   })),
   ...people.companies.slice(0,5).map(company=>({
    group:"Companies",label:company.name,href:"/tpo/companies?name="+encodeURIComponent(company.name),
   })),
   ...batches.batches.filter(batch=>matches(batch.name,batch.code,batch.program,batch.department))
    .slice(0,5).map(batch=>({group:"Batches",label:batch.name,
     href:"/tpo/batches/"+encodeURIComponent(batch.id)})),
   ...operations.jobs.filter(item=>matches(item.job.title,item.job.company.name))
    .slice(0,5).map(item=>({group:"Drives",label:item.job.title+" · "+item.job.company.name,
     href:"/tpo/placements/jobs/"+encodeURIComponent(item.job.id)})),
  ];
  return NextResponse.json({results},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
