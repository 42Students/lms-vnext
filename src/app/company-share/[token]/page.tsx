import { FilterBar } from "@/components/ui/filter-bar";
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
 if(result===null)return <main className={`${authStyles.page} mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10`}>
  <ErrorState title="Shared applicants" description="This page is temporarily unavailable. Try again."
    action={<Link href={"/company-share/"+encodeURIComponent(token)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 font-semibold text-primary-text underline hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Try again</Link>}/>
 </main>;
 if(result.kind==="CODE_REQUIRED")return <main className={`${authStyles.page} mx-auto flex min-h-dvh min-w-0 max-w-xl flex-col justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-10`}>
  <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6">
   <PageHeader title="Enter the 6-digit share code" />
   <p className="text-sm text-body">Ask the placement cell for the code sent separately with this company share link.</p>
   {access==="invalid"?<p role="alert" className="text-sm text-error">
    That code did not work, or this share is no longer available.</p>:null}
   <form method="post" action={"/company-share/"+encodeURIComponent(token)+"/access"} className="space-y-4">
    <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">6-digit code
     <Input name="code" type="text" required inputMode="numeric" autoComplete="one-time-code"
      pattern="[0-9]{6}" minLength={6} maxLength={6}
      className="max-w-full tracking-widest" />
    </label>
    <Button type="submit">Open shared applicants</Button>
   </form>
   <p className="text-xs text-muted-foreground">After ten wrong codes within an hour the share is locked and the placement cell is notified.</p>
  </section>
 </main>;
 if(result.kind!=="READY")return <main className={`${authStyles.page} mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-10`}>
  <section role="alert" className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
   <PageHeader title="This link is not valid any more." />
   <p className="text-sm text-body">It may have expired or been withdrawn. Please ask the placement cell for a new one.</p>
   <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Home</Link>
  </section>
 </main>;
 const columns=safeCompanyShareColumns(result.selectedColumns);
 const href=(p:number)=>companyShareApplicantHref(token,p,result.search);
 const tableColumns: DataTableColumn<(typeof result.rows)[number]>[] = columns.map((key,index)=>({
  key,
  header: COMPANY_SHARE_COLUMNS[key],
  mobileLabel: COMPANY_SHARE_COLUMNS[key],
  mobilePriority: index===0?"primary":"secondary",
  cell: row=>row.cells[key]??"Not recorded",
 }));
 return <main className={`${authStyles.page} relative isolate mx-auto min-w-0 max-w-5xl space-y-5 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5`}>
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 grid select-none grid-cols-2 place-items-center overflow-hidden text-center text-lg font-semibold uppercase tracking-widest text-muted-foreground opacity-20 sm:grid-cols-3">
   {Array.from({length:18},(_,index)=><span key={index} className="block w-[150%] -rotate-30 whitespace-nowrap">{result.companyName} · confidential</span>)}
  </div>
  <section aria-label="Shared applicant summary">
   <p className="text-sm text-muted-foreground">42Students · Company applicant share</p>
   <PageHeader title={"Shared with "+result.companyName} />
   <p className="mt-1 break-words text-lg font-medium text-foreground">{result.title}</p>
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
   {result.shortlistBy?<p role="status" className="mt-2 border-l-2 border-primary bg-primary-subtle px-3 py-2 text-sm font-semibold text-body">Please shortlist by {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(result.shortlistBy))}.</p>:null}
  </header>
  <FilterBar title="Filters"><form action={"/company-share/"+encodeURIComponent(token)} method="get"
    className="flex min-w-0 flex-wrap items-end gap-3 border-y border-border py-4 max-[767px]:[&_label]:w-full">
    <label className="grid gap-1 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search learner name
     <Input name="q" type="search" defaultValue={result.search} maxLength={80}
      className="w-full sm:w-64" placeholder="Name contains..." />
    </label>
    <Button type="submit">Apply search</Button>
    <a href={companyShareApplicantHref(token,1,"")} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear</a>
  </form></FilterBar>
  <p role="status" className="text-sm text-body">
   {result.total} shortlisted applicants · Page {result.page} of {result.totalPages}
  </p>
  <DataTable columns={tableColumns} rows={result.rows}
   getRowKey={row=>row.applicationId} caption="Shared applicants"
   empty={<div role="status" className="flex flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-body">No current shortlist records on this page.</p>
    {result.search?<Link href={companyShareApplicantHref(token,1,"")}
      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear</Link>:null}
   </div>}/>
  <Pagination page={result.page} pageCount={result.totalPages}
   hrefForPage={href} label="Share pages"/>
  <a className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
   href={publicApplicantExportHref(token,result.search)}>
   Download list (CSV, up to 500 applicants)
  </a>
 </main>;
}
