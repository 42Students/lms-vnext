import {notFound} from "next/navigation";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";

export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false},title:"Shared applicants · 42Students"};
export default async function CompanySharePage({
 params,searchParams,
}:{params:Promise<{token:string}>;searchParams:Promise<{page?:string}>}){
 const {token}=await params;
 const {page}=await searchParams;
 const result=await getPublicCompanyApplicantShare(token,page??1);
 if(result.kind!=="READY")notFound();
 const href=(p:number)=>"/company-share/"+encodeURIComponent(token)+"?page="+p;
 return <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
  <header>
   <p className="text-sm text-muted-foreground">42Students · Company applicant share</p>
   <h1 className="mt-2 text-2xl font-semibold text-foreground">{result.title}</h1>
   <p className="mt-2 text-sm text-body">Current shortlisted applicants only. Access expires
    or can be revoked. Private notes, resumes, telephone numbers and scores are not shared.</p>
  </header>
  <p role="status" className="text-sm text-body">
   {result.total} shortlisted applicants · Page {result.page} of {result.totalPages}
  </p>
  {result.rows.length===0?<p>No current shortlist records on this page.</p>:
   <div className="overflow-x-auto rounded-xl border border-border bg-surface">
    <table className="w-full min-w-[30rem] text-left text-sm">
     <thead><tr>{["Application ID","Learner","Email"].map(x=><th key={x}
      className="px-4 py-3" scope="col">{x}</th>)}</tr></thead>
     <tbody>{result.rows.map(row=><tr key={row.applicationId} className="border-t border-border">
      <td className="break-all px-4 py-3">{row.applicationId}</td>
      <td className="px-4 py-3">{row.displayName}</td>
      <td className="break-all px-4 py-3">{row.email??"Not recorded"}</td>
     </tr>)}</tbody>
    </table>
   </div>}
  <nav className="flex gap-5 text-sm" aria-label="Share pages">
   {result.page>1?<a href={href(result.page-1)}>Previous</a>:null}
   {result.page<result.totalPages?<a href={href(result.page+1)}>Next</a>:null}
  </nav>
  <a className="font-semibold text-primary-text underline"
   href={"/api/placements/company-share/"+encodeURIComponent(token)+"/export"}>
   Download capped CSV
  </a>
 </main>;
}
