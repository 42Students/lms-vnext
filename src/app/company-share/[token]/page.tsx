import type { Metadata } from "next";
import authStyles from "@/components/public/public-auth-skin.module.css";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import {cookies} from "next/headers";
import {getPublicCompanyApplicantShare} from "@/modules/placements/company-share/public-service";
import {canEmailAuthorizedCompanyShareCode} from "@/modules/placements/company-share/access-service";
import {getCurrentRequestContext} from "@/auth/request-context";
import {companyShareApplicantHref} from "@/modules/placements/company-share/public-filter-model";
import {publicApplicantExportHref} from "@/modules/placements/company-share/export-href-model";
import {COMPANY_SHARE_COLUMNS,safeCompanyShareColumns} from "@/modules/placements/company-share/column-model";
import {ShareCodeForm} from "./share-code-form";
import {ShareEmailCodeButton} from "./email-code-button";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { formatNumberIN } from "@/lib/safe-format";
import { createDateFormatter } from "@/lib/format-date";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
export const dynamic="force-dynamic";
/** Share URLs contain bearer tokens and protected applicant search queries. */
export const metadata: Metadata = {
 robots: { index: false, follow: false, noarchive: true },
 referrer: "no-referrer",
 title: "Shared applicants · 42Students",
};
export default async function CompanySharePage({
 params,searchParams,
}:{params:Promise<{token:string}>;searchParams:Promise<{page?:string;q?:string;access?:string}>}){
 const {token}=await params;
 const {page,q,access}=await searchParams;
 const proof=(await cookies()).get("company_share_access")?.value??null;
 const result=await getPublicCompanyApplicantShare(token,page??1,"VIEW",q??"",proof).catch(()=>null);
 if(result===null)return <main className={`${authStyles.page} mx-auto max-w-[1000px] px-4 py-12`}>
  <section aria-label="Shared applicants unavailable" className="mx-auto mt-12 max-w-[480px] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5">
   <ErrorState title="We couldn't load this share" description="We could not load this share. Please retry." action={<ButtonLink variant="secondary" className="min-h-11 w-full sm:w-auto" href={"/company-share/"+encodeURIComponent(token)}>Retry</ButtonLink>}/>
  </section>
 </main>;
 if(result.kind==="CODE_REQUIRED"){
  const context=await getCurrentRequestContext().catch(()=>null);
  const canEmailCode=context?await canEmailAuthorizedCompanyShareCode(context,token).catch(()=>false):false;
  return <main className={`${authStyles.page} mx-auto max-w-[1000px] px-4 py-12`}>
  <section className="mx-auto mt-12 min-w-0 max-w-[480px] rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6">
   <Heading level={1} size="xl" className="mb-4 break-words leading-7 text-[var(--lms-heading)]">Applicants for {result.title}</Heading>
   <p className="mb-4 break-words text-sm leading-[22px] text-body">Shared with {result.companyName}. Enter the six-character code the placement cell sent you.</p>
   {access==="invalid"?<p role="alert" className="mb-4 rounded-[var(--lms-control-radius)] border border-[var(--lms-error)] bg-[color-mix(in_srgb,var(--lms-error)_6%,transparent)] px-3 py-2 text-sm text-error">That code did not work, or this share is no longer available.</p>:null}
   <ShareCodeForm action={"/company-share/"+encodeURIComponent(token)+"/access"}/>
   <div className="mt-3 space-y-2 border-t border-[var(--lms-canvas-border)] pt-3">
    {canEmailCode?<ShareEmailCodeButton token={token}/>:null}
    <p className="text-xs leading-[20px] text-muted-foreground">{canEmailCode?
    "A code can be emailed only to your verified recruiter account. You can request it once per minute, up to three times per hour.":
    <>To protect applicant privacy, email codes are available only to an authenticated recruiter with access to this company and college. <TextLink href="/login">Sign in</TextLink> with that account, or ask the placement cell for the original code.</>}</p>
   </div>
   <p className="mt-3 break-words text-xs leading-[20px] text-muted-foreground">The link works until {createDateFormatter("en-IN", {day:"numeric",month:"numeric",year:"numeric",timeZone:DEFAULT_TIME_ZONE}).format(new Date(result.expiresAt))}. Everything you open is logged.</p>
  </section>
 </main>;
 }
 if(result.kind!=="READY")return <main className={`${authStyles.page} mx-auto max-w-[1000px] px-4 py-12`}>
  <section aria-label="Restricted applicant share" className="mx-auto mt-12 max-w-[480px] space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-5 md:p-6">
   <PageHeader title="This link is not valid any more." />
   <p className="text-sm text-body leading-[22px]">It may have expired or been withdrawn. Please ask the placement cell for a new one.</p>
   <TextLink href="/" className="inline-flex min-h-11 items-center md:min-h-9">Home</TextLink>
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
    // A pasted link must be unambiguous before URL canonicalization:
    // URL() otherwise silently strips whitespace/control characters.
    if(value!==value.trim()||/[\\\x00-\x1f\x7f]/.test(value))
      return value==="Link not shown"?value:"-";
    try{
     const url=new URL(value);
     if(url.protocol==="https:"&&!url.username&&!url.password)return <TextLink href={url.href} rel="noopener noreferrer" aria-label={"Open "+COMPANY_SHARE_COLUMNS[key]+" for "+(row.displayName??row.applicationId)+" (external website)"} className="inline-flex min-h-11 items-center md:min-h-9">Open</TextLink>;
    }catch{}
    return value==="Link not shown"?value:"-";
   }
   return value;
  },
 }));
 return <main className={`${authStyles.page} relative isolate mx-auto min-w-0 max-w-[1000px] space-y-4 px-4 py-12`}>
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1] flex -rotate-[20deg] scale-[1.4] select-none flex-wrap content-start overflow-hidden text-lg font-semibold text-muted-foreground opacity-10">
   {Array.from({length:120},(_,index)=><span key={index} className="whitespace-nowrap px-9 py-7">{result.companyName} · confidential</span>)}
  </div>
  <div className="relative z-[2] min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
  <section aria-label="Shared applicant summary" className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <Heading level={1} size="xl" className="min-w-0 break-words leading-7 text-[var(--lms-heading)]">{formatNumberIN(result.total)} applicants for {result.title}</Heading>
    <ButtonLink variant="secondary" href={publicApplicantExportHref(token,result.search)}>Download list</ButtonLink>
   </div>
   {result.shortlistBy?<p role="status" className="flex items-start gap-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-info)] bg-[var(--lms-info-subtle)] px-3 py-2 text-sm text-body leading-[22px]"><span aria-hidden="true" className="font-bold text-[var(--lms-info)]">ⓘ</span><span>Please shortlist by {createDateFormatter("en-IN", {day:"numeric",month:"numeric",year:"numeric",timeZone:DEFAULT_TIME_ZONE}).format(new Date(result.shortlistBy))}.</span></p>:null}
   <p className="break-words text-sm text-muted-foreground leading-[22px]">Shared by the placement cell on {createDateFormatter("en-IN", {day:"numeric",month:"numeric",year:"numeric",timeZone:DEFAULT_TIME_ZONE}).format(new Date(result.sharedAt))} for {result.companyName}. Please do not forward this page. Phone numbers appear only for shortlisted students.</p>
   <p className="break-words text-xs text-muted-foreground leading-[20px]">The link works until {createDateFormatter("en-IN", {day:"numeric",month:"numeric",year:"numeric",timeZone:DEFAULT_TIME_ZONE}).format(new Date(result.expiresAt))}. Everything you open is logged.</p>
   <p className="break-words text-xs text-muted-foreground leading-[20px]">Only the authorized shortlist and selected applicant details are shared. Private notes remain confidential.</p>
  </section>
  <form action={"/company-share/"+encodeURIComponent(token)} method="get"
    className="flex min-w-0 flex-col items-stretch gap-3 border-b border-[var(--lms-canvas-border)] pb-4 md:flex-row md:flex-wrap md:items-end">
    <Label stack className="w-full min-w-0 md:w-auto">Search learner name
     <Input name="q" type="search" defaultValue={result.search} maxLength={80}
      className="min-h-11 w-full md:min-h-9 md:w-64" placeholder="Name contains..." />
    </Label>
    <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Apply search</Button>
    <TextLink href={companyShareApplicantHref(token,1,"")} className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">Clear</TextLink>
  </form>
  <p role="status" className="text-sm text-body leading-[22px]">
   {formatNumberIN(result.total)} applicants · Page {result.page} of {result.totalPages}
  </p>
  <DataTable columns={tableColumns} rows={result.rows} mobileMode="cards"
   getRowKey={row=>row.applicationId} caption="Shared applicants"
   empty={<div role="status" className="flex flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-body leading-[22px]">No applicants found.</p>
    {result.search?<TextLink href={companyShareApplicantHref(token,1,"")}
      className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:null}
   </div>}/>
  <Pagination page={result.page} pageCount={result.totalPages}
   hrefForPage={href} label="Share pages"/>
  <section aria-label="Download options" className="min-w-0 space-y-2 border-t border-[var(--lms-canvas-border)] pt-3">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
    <Heading level={2} size="sm" className="text-[var(--lms-heading)]">Download options</Heading>
    <TextLink className="inline-flex min-h-11 max-w-full items-center break-words md:min-h-9"
     href={publicApplicantExportHref(token,result.search)}>
     Download list (CSV, up to 500 applicants)
    </TextLink>
   </div>
   <p role="note" className="max-w-3xl text-xs text-muted-foreground leading-[20px]">
    Bulk resume archives were retired for this protected share: a bulk archive cannot preserve per-file clean-scan, access-grant expiry and individual download audit guarantees. When RESUME is a selected column, each authorized CLEAN resume may be opened using its own short-lived signed link. Ask the placement cell for any additional document permissions.
   </p>
  </section>
  </div>
 </main>;
}
