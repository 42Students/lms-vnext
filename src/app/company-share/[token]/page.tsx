import authStyles from "@/components/public/public-auth-skin.module.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
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
 const result=await getPublicCompanyApplicantShare(token,page??1,"VIEW",q??"",proof).catch(()=>null);
 if(result===null)return <main className={`${authStyles.page} mx-auto flex min-h-dvh max-w-xl min-w-0 flex-col justify-center px-4 pb-8 pt-24 min-[768px]:py-12`}>
  <ErrorState title="Shared applicants" description="This page is temporarily unavailable. Try Again."
    action={<Link href={"/company-share/"+encodeURIComponent(token)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-[650] text-primary-text underline hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 text-sm">Try Again</Link>}/>
 </main>;
 if(result.kind==="CODE_REQUIRED")return <main className={`${authStyles.page} mx-auto flex min-h-dvh min-w-0 max-w-[480px] flex-col justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24 min-[768px]:py-12`}>
  <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
   <PageHeader title="Open shared applicants" />
   <div role="note" className="rounded-md border border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-4 py-3 text-sm leading-6 text-body">
     This company share is protected. Enter the six-digit code supplied separately by the placement cell before viewing applicant data.
   </div>
   <p className="max-w-prose break-words text-sm text-body leading-[22px]">Ask the placement cell for the code sent separately with this company share link.</p>
   <p className="max-w-prose break-words text-xs text-muted-foreground leading-[20px]">A code cannot be emailed or resent from this page yet. If the invitation did not include one, ask the placement cell for access rather than retrying guessed codes.</p>
   {access==="invalid"?<p role="alert" className="text-sm text-error leading-[22px]">
    That code did not work, or this share is no longer available.</p>:null}
   <form method="post" action={"/company-share/"+encodeURIComponent(token)+"/access"} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
    <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">6-digit code<span aria-hidden="true" className="ml-1 text-[var(--lms-error)]">*</span>
     <Input name="code" type="text" required inputMode="numeric" autoComplete="one-time-code"
      pattern="[0-9]{6}" minLength={6} maxLength={6}
      className="min-h-11 w-full max-w-full sm:w-48 md:min-h-9" />
    </label>
    <Button type="submit" className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9">Open</Button>
   </form>
   <p className="max-w-prose break-words text-xs text-muted-foreground leading-[20px]">After ten wrong codes within an hour the share is locked and the placement cell is notified.</p>
  </section>
 </main>;
 if(result.kind!=="READY")return <main className={`${authStyles.page} mx-auto flex min-h-dvh max-w-xl min-w-0 flex-col justify-center px-4 pb-8 pt-24 min-[768px]:py-12`}>
  <section role="alert" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
   <PageHeader title="This link is not valid any more." />
   <p className="text-sm text-body leading-[22px]">It may have expired or been withdrawn. Please ask the placement cell for a new one.</p>
   <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Home</Link>
  </section>
 </main>;
 const columns=safeCompanyShareColumns(result.selectedColumns);
 const orderedColumns=[...columns].sort((a,b)=>Number(b==="APPLICATION_ID")-Number(a==="APPLICATION_ID"));
 const href=(p:number)=>companyShareApplicantHref(token,p,result.search);
 const tableColumns: DataTableColumn<(typeof result.rows)[number]>[] = orderedColumns.map((key,index)=>({
  key,
  header: COMPANY_SHARE_COLUMNS[key],
  mobileLabel: COMPANY_SHARE_COLUMNS[key],
  mobilePriority: index===0?"primary":"secondary",
  cell: row=>row.cells[key]??"—",
 }));
 return <main className={`${authStyles.page} relative isolate mx-auto min-w-0 max-w-[1000px] space-y-4 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24 min-[768px]:px-6 min-[768px]:py-12`}>
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 grid select-none grid-cols-2 place-items-center overflow-hidden text-center text-lg font-semibold uppercase tracking-widest text-muted-foreground opacity-20 md:grid-cols-3">
   {Array.from({length:18},(_,index)=><span key={index} className="block w-[150%] -rotate-30 whitespace-nowrap">{result.companyName} · confidential</span>)}
  </div>
  <div className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
  <section aria-label="Shared applicant summary" className="min-w-0 space-y-2 border-b border-[var(--lms-canvas-border)] pb-4">
   <p className="text-sm text-muted-foreground leading-[22px]">42Students · Company applicant share</p>
   <PageHeader title={"Shared with "+result.companyName} />
   <p className="mt-1 max-w-3xl break-words [overflow-wrap:anywhere] text-base font-medium leading-6 text-foreground">{result.title}</p>
   <p className="max-w-3xl break-words text-sm text-body leading-[22px]">
    Shared by {result.collegeName} on {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.sharedAt))}
    {" "}for {result.companyName}. Please do not forward this page.
   </p>
   <p className="max-w-3xl break-words text-sm text-body leading-[22px]">
    The link works until {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.expiresAt))}. Everything you open is logged.
   </p>
   <p className="max-w-3xl break-words text-xs text-muted-foreground leading-[20px]">
    Current shortlisted applicants only. Access can be revoked. Only the placement cell\u0027s chosen columns are disclosed; private notes are never shared.
   </p>
   {result.shortlistBy?<p role="status" className="mt-2 border-l-2 border-primary bg-primary-subtle px-3 py-2 text-sm font-semibold text-body leading-[22px]">Please shortlist by {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(result.shortlistBy))}.</p>:null}
  </section>
  <form action={"/company-share/"+encodeURIComponent(token)} method="get"
    className="flex min-w-0 flex-col items-stretch gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:flex-row md:flex-wrap md:items-end">
    <label className="grid w-full min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:w-auto">Search learner name
     <Input name="q" type="search" defaultValue={result.search} maxLength={80}
      className="min-h-11 w-full md:min-h-9 md:w-64" placeholder="Name contains..." />
    </label>
    <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply search</Button>
    <a href={companyShareApplicantHref(token,1,"")} className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear</a>
  </form>
  <h2 className="text-base font-semibold text-[var(--lms-heading)]">Applicants ({result.total.toLocaleString("en-IN")})</h2>
  <p role="status" className="text-sm text-body leading-[22px]">Page {result.page} of {result.totalPages}</p>
  <DataTable columns={tableColumns} rows={result.rows}
   getRowKey={row=>row.applicationId} caption="Shared applicants"
   empty={<div role="status" className="flex flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-body leading-[22px]">No current shortlist records on this page.</p>
    {result.search?<Link href={companyShareApplicantHref(token,1,"")}
      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear</Link>:null}
   </div>}/>
  <Pagination page={result.page} pageCount={result.totalPages}
   hrefForPage={href} label="Share pages"/>
  <section aria-label="Download options" className="min-w-0 space-y-2 border-t border-[var(--lms-canvas-border)] pt-3">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <h2 className="text-sm font-semibold text-[var(--lms-heading)]">Download options</h2>
    <a className="inline-flex min-h-11 max-w-full items-center break-words font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
     href={publicApplicantExportHref(token,result.search)}>
     Download list (CSV, up to 500 applicants)
    </a>
   </div>
   <p role="note" className="max-w-3xl text-xs text-muted-foreground leading-[20px]">
    Resume ZIP download is not available for this protected share. Ask the placement cell about separately authorized applicant documents.
   </p>
  </section>
  </div>
 </main>;
}
