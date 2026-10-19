import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { tpoShareableShortlistQuerySchema } from "@/modules/placements/tpo-shareable-shortlist-model";
import { getTpoShareableShortlist } from "@/modules/placements/tpo-shareable-shortlist-service";
import { listTpoCompanyApplicantShares } from "@/modules/placements/company-share/manage-service";
import { CompanyShareControls } from "./company-share-controls";
import {companySharePreferenceKey} from "@/modules/placements/company-share/remembered-settings-model";
import {tpoFilteredSharePreviewExportHref} from "@/modules/placements/tpo-share-preview-export-href";
import {companyShareStatusSchema,companyShareStatusLabel} from "@/modules/placements/company-share/status-model";
import {companyShareLinksHref,recoverCompanyShareLinkPage,companySharePreviewSearchState} from "@/modules/placements/company-share/link-page-model";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

type SearchParams = { page?: string | string[]; shareStatus?: string|string[]; sharePage?:string|string[]; q?:string|string[] };
const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function TpoShortlistSharePreviewPage({
  params, searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const [{ jobId }, search] = await Promise.all([params, searchParams]);
  const parsed = tpoShareableShortlistQuerySchema.safeParse({
    jobId, ...(first(search.page) ? { page: first(search.page) } : {}),
    q:first(search.q)??"",
  });
  if (!parsed.success) notFound();
  let data: Awaited<ReturnType<typeof getTpoShareableShortlist>>;
  try {
    data = await getTpoShareableShortlist(context, parsed.data);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
      error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }
  const parsedStatus=companyShareStatusSchema.safeParse(first(search.shareStatus)??"ALL");
  const shareStatus=parsedStatus.success?parsedStatus.data:"ALL";
  const linkPage=recoverCompanyShareLinkPage(first(search.sharePage)??1);
  const shares = await listTpoCompanyApplicantShares(context, data.job.id,shareStatus,linkPage.page);
  const path = "/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/share-preview";
  const preservedHistory=companySharePreviewSearchState(shareStatus,linkPage.page);
  return <div className="min-w-0 space-y-5">
    <Link
      href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/shortlist"}
      className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline hover:underline md:min-h-9">
      ← Current internal shortlist
    </Link>
    <PageHeader eyebrow="TPO · Placements"
      title={data.job.title + " · Recruiter-visible shortlist preview"}
      description="Read-only, current submitted/shortlisted candidates. This is a TPO report, not a sent share or authorization for an external recipient."
      actions={<a href={tpoFilteredSharePreviewExportHref(data.job.id,parsed.data.q)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary md:min-h-9">
        Export capped CSV
      </a>}
    />
    <form action={path} method="get" className="flex flex-wrap items-end gap-3">
      {preservedHistory.shareStatus?<input type="hidden" name="shareStatus" value={preservedHistory.shareStatus}/>:null}
      {preservedHistory.sharePage?<input type="hidden" name="sharePage" value={preservedHistory.sharePage}/>:null}
      <label className="grid gap-2 text-sm font-semibold text-body">Search shortlisted learner
        <Input type="search" name="q" defaultValue={parsed.data.q} maxLength={80}
          placeholder="Learner name" />
      </label>
      <Button type="submit" >
        Search
      </Button>
      <Link href={path} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Clear</Link>
    </form>
    <p className="text-sm text-body">
      {data.total} currently shortlisted application(s) in this drive.
      This preview deliberately includes only application ID, learner name and email,
      the fields exposed by the current recruiter round workspace. The CSV is capped
      at 500 application rows with an explicit notice if truncated. It performs no sharing.
    </p>
    <DataTable<(typeof data.rows)[number]> caption="Shortlisted applicant cards"
      rows={data.rows} getRowKey={item=>item.applicationId}
      empty={<p role="status" className="text-sm text-body">No recruiter-visible shortlisted applications are recorded on this page. Screening state may have changed; absence here is not proof of no applicants.</p>}
      columns={[
        {key:"application",header:"Application ID",mobilePriority:"secondary",cell:item=><span className="break-all font-mono text-xs">{item.applicationId}</span>},
        {key:"learner",header:"Learner",mobilePriority:"primary",cell:item=><strong>{item.displayName}</strong>},
        {key:"email",header:"Email",mobilePriority:"secondary",cell:item=><span className="break-all">{item.email??"Not recorded"}</span>},
      ]}/>
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(data.job.id)+"/share-audit"}
     className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">
     View company-share access history
    </Link>
    <Tabs ariaLabel="Company-share link status filters" value={shareStatus} renderPanel={false}
      items={companyShareStatusSchema.options.map(status=>({
        value:status,
        label:companyShareStatusLabel(status),
        href:companyShareLinksHref(data.job.id,status,1,parsed.data.q,data.page),
      }))}/>
    {(linkPage.wasInvalid||!parsedStatus.success)?<p role="status"
      className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm text-body">
      An invalid company-share status or page was reset to the default view.
    </p>:null}
    <CompanyShareControls jobId={data.job.id} preferenceKey={companySharePreferenceKey(data.job.collegeId,data.job.companyRelationshipId)} ready={shares.ready} status={shareStatus} linkPage={shares.page}
      initialLinks={shares.links.map(link => ({
        id: link.id, expiresAt: link.expiresAt.toISOString(),
        revokedAt: link.revokedAt?.toISOString() ?? null,
        audit:link.audit,
      }))} />
    <nav aria-label="Company-share link pages" className="flex flex-wrap items-center gap-3 text-sm">
      <span>{shares.total} matching link(s) · Page {shares.page} of {shares.totalPages}</span>
      {shares.page>1?<Link href={companyShareLinksHref(data.job.id,shareStatus,shares.page-1,parsed.data.q,data.page)}
        className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline md:min-h-9">Previous links</Link>:null}
      {shares.page<shares.totalPages?<Link href={companyShareLinksHref(data.job.id,shareStatus,shares.page+1,parsed.data.q,data.page)}
        className="font-semibold text-[var(--lms-teal-deep)] underline">Next links</Link>:null}
    </nav>
    <nav aria-label="Share preview pagination"
      className="flex flex-wrap justify-between gap-3 text-sm">
      <span>Page {data.page} of {data.totalPages}</span>
      <div className="flex gap-4">
        {data.page > 1 ? <Link href={path + "?" + new URLSearchParams({page:String(data.page-1),...(parsed.data.q?{q:parsed.data.q}:{}),shareStatus})}
          className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline hover:underline md:min-h-9">← Previous</Link> : null}
        {data.page < data.totalPages ? <Link href={path + "?" + new URLSearchParams({page:String(data.page+1),...(parsed.data.q?{q:parsed.data.q}:{}),shareStatus})}
          className="font-semibold text-[var(--lms-teal-deep)] hover:underline">Next →</Link> : null}
      </div>
    </nav>
  </div>;
}
