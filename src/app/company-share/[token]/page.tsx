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
import {ShareCodeForm} from "./share-code-form";

export const dynamic="force-dynamic";
export const metadata={robots:{index:false,follow:false},title:"Shared applicants · 42Students",other:{referrer:"no-referrer"}};
export default async function CompanySharePage({
 params,searchParams,
}:{params:Promise<{token:string}>;searchParams:Promise<{page?:string;q?:string;access?:string}>}){
 const {token}=await params;
 const {page,q,access}=await searchParams;
 const proof=(await cookies()).get("company_share_access")?.value??null;
 const result=await getPublicCompanyApplicantShare(token,page??1,"VIEW",q??"",proof).catch(()=>null);
 if(result===null)return <main className={`${authStyles.page} mx-auto min-h-dvh max-w-[1000px] px-4 py-12`}>
  <section role="alert" className="mx-auto mt-12 max-w-[480px] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5">
   <ErrorState title="We couldn't load this share" description="We could not load this share. Please retry." action={<Link href={"/company-share/"+encodeURIComponent(token)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-body hover:border-primary hover:text-primary-text md:min-h-9">Retry</Link>}/>
  </section>
 </main>;
 if(result.kind==="CODE_REQUIRED")return <main className={`${authStyles.page} mx-auto min-h-dvh max-w-[1000px] px-4 py-12`}>
  <section className="mx-auto mt-12 min-w-0 max-w-[480px] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6">
   <h1 className="mb-4 break-words text-xl font-semibold leading-7 text-[var(--lms-heading)]">Applicants for {result.title}</h1>
   <p className="mb-4 break-words text-sm leading-[22px] text-body">Shared with {result.companyName}. Enter the one-time code the placement cell sent you.</p>
   {access==="invalid"?<p role="alert" className="mb-4 rounded-[var(--lms-control-radius)] border border-[var(--lms-error)] bg-[rgba(239,68,68,0.06)] px-3 py-2 text-sm text-error">That code did not work, or this share is no longer available.</p>:null}
   <ShareCodeForm action={"/company-share/"+encodeURIComponent(token)+"/access"}/>
   <p className="mt-3 text-xs leading-[20px] text-muted-foreground">If your invitation did not include a code, ask the placement cell. Email delivery is not available from this protected share.</p>
   <p className="mt-3 break-words text-xs leading-[20px] text-muted-foreground">The link works until {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"numeric",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.expiresAt))}. Everything you open is logged.</p>
  </section>
 </main>;
 if(result.kind!=="READY")return <main className={`${authStyles.page} mx-auto min-h-dvh max-w-[1000px] px-4 py-12`}>
  <section role="alert" className="mx-auto mt-12 max-w-[480px] space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6">
   <PageHeader title="This link is not valid any more." />
   <p className="text-sm text-body leading-[22px]">It may have expired or been withdrawn. Please ask the placement cell for a new one.</p>
   <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Home</Link>
  </section>
 </main>;
 const columns=["APPLICATION_ID",...safeCompanyShareColumns(result.selectedColumns).filter(key=>key!=="APPLICATION_ID")] as const;
 const href=(p:number)=>companyShareApplicantHref(token,p,result.search);
 const tableColumns: DataTableColumn<(typeof result.rows)[number]>[] = columns.map((key,index)=>({
  key,
  header: COMPANY_SHARE_COLUMNS[key],
  mobileLabel: COMPANY_SHARE_COLUMNS[key],
  mobilePriority: index===0?"primary":"secondary",
  cell: row=>{
   const value=key==="APPLICATION_ID"?row.applicationId:row.cells[key];
   if(!value)return "-";
   if(key==="STAGE")return value==="SHORTLISTED"?"Shortlisted":value;
   if(key==="RESUME"||key==="GITHUB"||key==="PORTFOLIO"){
    try{
     const url=new URL(value);
     if(url.protocol==="https:"&&!url.username&&!url.password)return <a href={url.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary-text underline underline-offset-2 hover:text-[var(--lms-link-text)]">Open</a>;
    }catch{}
    return value==="Link not shown"?value:"-";
   }
   return value;
  },
 }));
 return <main className={`${authStyles.page} relative isolate mx-auto min-w-0 max-w-[1000px] space-y-4 px-4 py-12`}>
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] flex -rotate-[20deg] scale-[1.4] select-none flex-wrap content-start overflow-hidden text-lg font-semibold text-muted-foreground opacity-[0.07]">
   {Array.from({length:120},(_,index)=><span key={index} className="whitespace-nowrap px-9 py-7">{result.companyName} · confidential</span>)}
  </div>
  <div className="relative z-[2] min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
  <section aria-label="Shared applicant summary" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <h1 className="min-w-0 break-words text-xl font-semibold leading-7 text-[var(--lms-heading)]">{result.total.toLocaleString("en-IN")} applicants for {result.title}</h1>
    <a href={publicApplicantExportHref(token,result.search)} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-body hover:border-primary hover:text-primary-text md:min-h-9">Download list</a>
   </div>
   {result.shortlistBy?<p role="status" className="flex items-start gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-3 py-2 text-sm text-body leading-[22px]"><span aria-hidden="true" className="font-bold text-[var(--lms-info)]">ⓘ</span><span>Please shortlist by {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"numeric",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.shortlistBy))}.</span></p>:null}
   <p className="break-words text-sm text-muted-foreground leading-[22px]">Shared by the placement cell on {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"numeric",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.sharedAt))} for {result.companyName}. Please do not forward this page. Phone numbers appear only for shortlisted students.</p>
   <p className="break-words text-xs text-muted-foreground leading-[20px]">The link works until {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"numeric",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(result.expiresAt))}. Everything you open is logged.</p>
   <p className="break-words text-xs text-muted-foreground leading-[20px]">Only the authorized shortlist and selected applicant details are shared. Private notes remain confidential.</p>
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
  <p role="status" className="text-sm text-body leading-[22px]">
   {result.total.toLocaleString("en-IN")} applicants · Page {result.page} of {result.totalPages}
  </p>
  <DataTable columns={tableColumns} rows={result.rows}
   getRowKey={row=>row.applicationId} caption="Shared applicants"
   empty={<div role="status" className="flex flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-body leading-[22px]">No applicants found.</p>
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
