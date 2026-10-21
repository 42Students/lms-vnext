import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {companyShareSelectedCsv} from "@/modules/placements/company-share/column-model";
import {companyShareCsvResponseHeaders} from "@/modules/placements/company-share/export-headers-model";
import {makeStoredZip,type ZipEntry} from "@/modules/placements/company-share/zip-model";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const privateHeaders={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow, noarchive"};
const maxResumeBytes=12*1024*1024;
const maxZipFiles=20;
const mimeExtensions:Record<string,string>={
 "application/pdf":"pdf",
 "application/msword":"doc",
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx",
 "application/octet-stream":"bin",
};
async function boundedSignedResume(url:string):Promise<{bytes:Uint8Array;extension:string}|null>{
 // These URLs are minted only by the attested private read-grant service,
 // never accepted directly from user query params or filename headers.
 let parsed:URL;
 try{parsed=new URL(url);}
 catch{return null;}
 if(parsed.protocol!=="https:"||parsed.username||parsed.password)return null;
 try{
  const res=await fetch(url,{redirect:"error",cache:"no-store",
   signal:AbortSignal.timeout(10000),headers:{Accept:"application/octet-stream"}});
  if(!res.ok||!res.body)return null;
  const declared=Number(res.headers.get("content-length"));
  if(Number.isFinite(declared)&&declared>maxResumeBytes)return null;
  const mime=(res.headers.get("content-type")??"application/octet-stream").split(";")[0]!.trim().toLowerCase();
  const extension=mimeExtensions[mime];
  if(!extension)return null;
  const chunks:Uint8Array[]=[];
  let size=0;
  const reader=res.body.getReader();
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    size+=value.byteLength;
    if(size>maxResumeBytes){await reader.cancel();return null;}
    chunks.push(value);
   }
  }finally{reader.releaseLock();}
  if(size===0)return null;
  const content=new Uint8Array(size);
  let cursor=0;
  for(const part of chunks){content.set(part,cursor);cursor+=part.byteLength;}
  return {bytes:content,extension};
 }catch{return null;}
}
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const proof=(await cookies()).get("company_share_access")?.value??null;
 const query=new URL(request.url).searchParams;
 const format=query.get("format")??"csv";
 if(!["csv","zip"].includes(format)||query.getAll("format").length>1||
    query.getAll("q").length>1)
  return NextResponse.json({error:"INVALID_EXPORT_FORMAT"},{status:400,headers:privateHeaders});
 // The existing token + code proof, selected-applicant scope, CLEAN file
 // attestation and access audit apply to both exports. The views table's
 // CSV enum currently means an export read; ZIP needs no new claim of
 // unaudited access or a second unverified resume lookup.
 const result=await getPublicCompanyApplicantShare(token,1,"CSV",query.get("q")??"",proof);
 if(result.kind!=="READY")return NextResponse.json({error:"SHARE_UNAVAILABLE"},{
  status:404,headers:privateHeaders,
 });
 if(format==="csv")
  return new Response("\uFEFF"+companyShareSelectedCsv(result.rows,result.selectedColumns,result.truncated),{
   status:200,headers:companyShareCsvResponseHeaders(),
  });
 if(!result.selectedColumns.includes("RESUME"))
  return NextResponse.json({error:"RESUMES_NOT_SHARED"},{
   status:403,headers:privateHeaders,
  });
 const selected=result.rows.filter(row=>{
  const link=row.cells.RESUME;
  return typeof link==="string"&&link.startsWith("https://");
 });
 if(!selected.length)return NextResponse.json({error:"NO_VERIFIED_RESUMES"},{
  status:409,headers:privateHeaders,
 });
 const entries:ZipEntry[]=[];
 let unavailable=0;
 // Limit memory and provider reads; additional rows are explicitly reported
 // in the included manifest rather than silently interpreted as all files.
 for(const row of selected.slice(0,maxZipFiles)){
  const link=row.cells.RESUME;
  if(typeof link!=="string"){unavailable++;continue;}
  const resume=await boundedSignedResume(link);
  if(!resume){unavailable++;continue;}
  entries.push({name:"applicant-"+row.applicationId+"."+resume.extension,bytes:resume.bytes});
 }
 if(!entries.length)return NextResponse.json({error:"NO_READABLE_RESUMES"},{
  status:409,headers:privateHeaders,
 });
 const manifest=[
  "Company shortlisted applicant resumes",
  "Included verified resume files: "+entries.length,
  "Read failed or exceeded size limit: "+unavailable,
  "Selected verified links: "+selected.length,
  "Maximum attempted in this ZIP: "+maxZipFiles,
  "Additional verified links not attempted: "+Math.max(0,selected.length-maxZipFiles),
  "Only explicitly shared, CLEAN-scanned files are included.",
  "This export is not a complete applicant history.",
 ].join("\n")+"\n";
 entries.push({name:"manifest.txt",bytes:new TextEncoder().encode(manifest)});
 const archive=makeStoredZip(entries);
 return new Response(archive,{
  status:200,headers:{...privateHeaders,
   "Content-Type":"application/zip",
   "Content-Disposition":'attachment; filename="company-shortlisted-resumes.zip"',
  },
 });
}
