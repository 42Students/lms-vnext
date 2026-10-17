import Link from "next/link";
import {cookies} from "next/headers";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {companyShareApplicantHref} from "@/modules/placements/company-share/public-filter-model";
import {publicApplicantExportHref} from "@/modules/placements/company-share/export-href-model";
import {COMPANY_SHARE_COLUMNS,safeCompanyShareColumns} from "@/modules/placements/company-share/column-model";

export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false},title:"Shared applicants · 42Students",other:{referrer:"no-referrer"}};
export default async function CompanySharePage({
 params,searchParams,
}:{params:Promise<{token:string}>;searchParams:Promise<{page?:string;q?:string;access?:string}>}){
 const {token}=await params;
 const {page,q,access}=await searchParams;
 const proof=(await cookies()).get("company_share_access")?.value??null;
 const result=await getPublicCompanyApplicantShare(token,page??1,"VIEW",q??"",proof);
 if(result.kind==="CODE_REQUIRED")return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
  <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
   <h1 className="text-xl font-semibold">Enter the 6-digit share code</h1>
   <p className="text-sm text-body">Ask the placement cell for the code sent separately with this company share link.</p>
   {access==="invalid"?<p role="alert" className="text-sm text-error">
    That code did not work, or this share is no longer available.</p>:null}
   <form method="post" action={"/company-share/"+encodeURIComponent(token)+"/access"} className="space-y-4">
    <label className="grid gap-2 text-sm font-semibold">6-digit code
     <input name="code" required inputMode="numeric" autoComplete="one-time-code"
      pattern="[0-9]{6}" minLength={6} maxLength={6}
      className="min-h-11 rounded border border-border bg-surface px-3" />
    </label>
    <button type="submit" className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary">
     Open shared applicants
    </button>
   </form>
   <p className="text-xs text-muted-foreground">After ten wrong codes within an hour the share is locked and the placement cell is notified.</p>
  </section>
 </main>;
 if(result.kind!=="READY")return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
  <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
   <h1 className="text-xl font-semibold">This link is not valid any more.</h1>
   <p className="text-sm text-body">It may have expired or been withdrawn. Please ask the placement cell for a new one.</p>
   <Link href="/" className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">Home</Link>
  </section>
 </main>;
 const columns=safeCompanyShareColumns(result.selectedColumns);
 const href=(p:number)=>companyShareApplicantHref(token,p,result.search);
 return <main className="relative isolate mx-auto max-w-5xl space-y-5 px-4 py-8">
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 grid select-none grid-cols-2 place-items-center overflow-hidden text-center text-lg font-semibold uppercase tracking-widest text-muted-foreground opacity-20 sm:grid-cols-3">
   {Array.from({length:18},(_,index)=><span key={index} className="block w-[150%] -rotate-30 whitespace-nowrap">{result.companyName} · confidential</span>)}
  </div>
  <header>
   <p className="text-sm text-muted-foreground">42Students · Company applicant share</p>
   <h1 className="mt-2 text-2xl font-semibold text-foreground">Shared with {result.companyName}</h1>
   <p className="mt-1 text-lg font-medium text-foreground">{result.title}</p>
   <p className="mt-2 text-sm text-body">
    Shared by {result.collegeName} on {new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.sharedAt))}
    {" "}for {result.companyName}. Please do not forward this page.
   </p>
   <p className="mt-2 text-sm text-body">
    The link works until {new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.expiresAt))}. Everything you open is logged.
   </p>
   <p className="mt-2 text-sm text-muted-foreground">
    Current shortlisted applicants only. Access can be revoked. Only the placement cell\u0027s chosen columns are disclosed; private notes are never shared.
   </p>
   {result.shortlistBy?<p role="status" className="mt-2 rounded border border-border bg-surface-subtle p-3 text-sm font-semibold">Please shortlist by {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(result.shortlistBy))}.</p>:null}
  </header>
  <form action={"/company-share/"+encodeURIComponent(token)} method="get"
    className="flex flex-wrap items-end gap-3">
    <label className="grid gap-2 text-sm font-semibold text-body">Search learner name
     <input name="q" defaultValue={result.search} maxLength={80}
      className="min-h-10 rounded border border-border bg-surface px-3"
      placeholder="Name contains..." />
    </label>
    <button type="submit" className="min-h-10 rounded bg-primary px-4 text-on-primary">
     Apply search
    </button>
    <a href={companyShareApplicantHref(token,1,"")} className="text-sm text-primary-text underline">Clear</a>
  </form>
  <p role="status" className="text-sm text-body">
   {result.total} shortlisted applicants · Page {result.page} of {result.totalPages}
  </p>
  {result.rows.length===0?<p>No current shortlist records on this page.</p>:
   <>
    <ul aria-label="Shared applicants" className="space-y-3 sm:hidden">
     {result.rows.map((row,index)=><li key={row.applicationId}
      className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <h3 className="break-words font-semibold">{columns.includes("NAME")?
        row.cells.NAME??"Unnamed learner":"Applicant "+(index+1)}</h3>
      <dl className="mt-3 space-y-2 text-xs text-body">
       {columns.map(key=><div key={key}>
        <dt className="font-semibold">{COMPANY_SHARE_COLUMNS[key]}</dt>
        <dd className="break-all">{row.cells[key]??"Not recorded"}</dd>
       </div>)}
      </dl>
     </li>)}
    </ul>
    <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface sm:block">
     <table className="w-full min-w-[30rem] text-left text-sm">
      <thead><tr>{columns.map(key=><th key={key} className="px-4 py-3" scope="col">
       {COMPANY_SHARE_COLUMNS[key]}</th>)}</tr></thead>
      <tbody>{result.rows.map(row=><tr key={row.applicationId} className="border-t border-border">
       {columns.map(key=><td key={key} className="break-all px-4 py-3">
        {row.cells[key]??"Not recorded"}</td>)}
      </tr>)}</tbody>
     </table>
    </div>
   </>}
  <nav className="flex flex-wrap gap-5 text-sm" aria-label="Share pages">
   {result.page>1?<a href={href(result.page-1)}>Previous</a>:null}
   {result.page<result.totalPages?<a href={href(result.page+1)}>Next</a>:null}
  </nav>
  <a className="font-semibold text-primary-text underline"
   href={publicApplicantExportHref(token,result.search)}>
   Download list (CSV, up to 500 applicants)
  </a>
 </main>;
}
