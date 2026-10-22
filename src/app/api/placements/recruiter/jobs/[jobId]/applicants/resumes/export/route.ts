import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {getHrJobRead} from "@/modules/placements/hr-job-read-service";
import {hrApplicantFilterSchema} from "@/modules/placements/hr-job-applicants-model";
import {grantRecruiterSharedResume} from "@/modules/placements/recruiter-applicant-resume-service";
import {makeStoredZip,type ZipEntry} from "@/modules/placements/company-share/zip-model";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow, noarchive"};
const MAX_FILES=20;
const MAX_FILE_BYTES=5*1024*1024;
const MAX_TOTAL_BYTES=60*1024*1024;
const extensions:Record<string,string>={
 "application/pdf":"pdf",
 "application/msword":"doc",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx",
 "application/octet-stream":"bin",
};

/** Only download a short-lived URL minted by the private attested receipt
 * service. No query-supplied URLs, redirects or remote filenames are accepted. */
async function readBoundedResume(url:string,contentType:string):
 Promise<{bytes:Uint8Array;extension:string}|null>{
 let address:URL;
 try{address=new URL(url);}catch{return null;}
 if(address.protocol!=="https:"||address.username||address.password)return null;
 const extension=extensions[contentType.split(";")[0]!.trim().toLowerCase()];
 if(!extension)return null;
 try{
  const response=await fetch(address,{redirect:"error",cache:"no-store",
   signal:AbortSignal.timeout(10000)});
  if(!response.ok||!response.body)return null;
  const declared=response.headers.get("content-length");
  if(declared!==null&&Number(declared)>MAX_FILE_BYTES)return null;
  const parts:Uint8Array[]=[];
  let size=0;
  const reader=response.body.getReader();
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    size+=value.byteLength;
    if(size>MAX_FILE_BYTES){await reader.cancel();return null;}
    parts.push(value);
   }
  }finally{reader.releaseLock();}
  if(size===0)return null;
  const bytes=new Uint8Array(size);
  let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  return {bytes,extension};
 }catch{return null;}
}

type Params={params:Promise<{jobId:string}>};
/** Employer-specific ZIP. Each applicant is independently reauthorized against
 * persisted SHORTLISTED, active-college and CLEAN receipt checks. */
export async function GET(request:Request,{params}:Params){
 if(new URL(request.url).searchParams.size>0)
  return NextResponse.json({error:"INVALID_QUERY"},{status:400,headers});
 try{
  const context=await getCurrentRequestContext();
  if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)
   return NextResponse.json({error:"RESUMES_NOT_AVAILABLE"},{status:404,headers});
  const {jobId}=await params;
  const filters=hrApplicantFilterSchema.parse({tab:"applicants",stage:"ALL",page:1});
  const first=await getHrJobRead(context,jobId,filters);
  const ids:string[]=[];
  const seen=new Set<string>();
  // Bounded to ten authorized pages and twenty eligible file requests.
  for(let page=1;page<=Math.min(first.applicantsPage.pages,10)&&ids.length<MAX_FILES;page++){
   const data=page===1?first:await getHrJobRead(context,jobId,{...filters,page});
   for(const row of data.applicants.rows){
    if(row.resumeShared&&row.status==="SUBMITTED"&&!seen.has(row.id)){
     seen.add(row.id);
     ids.push(row.id);
     if(ids.length===MAX_FILES)break;
    }
   }
  }
  if(ids.length===0)
   return NextResponse.json({error:"RESUMES_NOT_AVAILABLE"},{status:409,headers});
  const entries:ZipEntry[]=[];
  let missing=0;
  let totalBytes=0;
  for(const id of ids){
   try{
    const grant=await grantRecruiterSharedResume(context,jobId,id);
    const file=await readBoundedResume(grant.url,grant.contentType);
    if(!file||totalBytes+file.bytes.byteLength>MAX_TOTAL_BYTES){missing++;continue;}
    entries.push({name:"applicant-"+id+"."+file.extension,bytes:file.bytes});
    totalBytes+=file.bytes.byteLength;
   }catch{
    // Expired grant, rescinded consent, scan failure and inaccessible object
    // have the same non-disclosing outcome; do not expose which failed.
    missing++;
   }
  }
  if(entries.length===0)
   return NextResponse.json({error:"RESUMES_NOT_AVAILABLE"},{status:409,headers});
  const manifest=[
   "Recruiter drive - shared resumes",
   "Included verified files: "+entries.length,
   "Unavailable or over size limit: "+missing,
   "Maximum candidates attempted per ZIP: "+MAX_FILES,
   "Only the first ten authorized applicant pages are searched.",
   "Additional shared applicants may not be included.",
   "Only currently consented and CLEAN-verified resumes are downloaded.",
   "This ZIP is not the complete applicant history.",
  ].join("\n")+"\n";
  entries.push({name:"manifest.txt",bytes:new TextEncoder().encode(manifest)});
  const archive=new Uint8Array(makeStoredZip(entries));
  return new Response(archive.buffer as ArrayBuffer,{status:200,headers:{...headers,
   "Content-Type":"application/zip",
   "Content-Disposition":'attachment; filename="recruiter-shared-resumes.zip"',
  }});
 }catch{
  // Never reveal private applicant, relationship or object storage scope.
  return NextResponse.json({error:"RESUMES_NOT_AVAILABLE"},{status:404,headers});
 }
}
