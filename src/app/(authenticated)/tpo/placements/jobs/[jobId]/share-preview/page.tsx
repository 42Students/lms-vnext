import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
  return <div className="space-y-5">
    <Link
      href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/shortlist"}
      className="font-semibold text-primary-text hover:underline">
      ← Current internal shortlist
    </Link>
    <PageHeader eyebrow="TPO · Placements"
      title={data.job.title + " · Recruiter-visible shortlist preview"}
      description="Read-only, current submitted/shortlisted candidates. This is a TPO report, not a sent share or authorization for an external recipient."
      actions={<a href={tpoFilteredSharePreviewExportHref(data.job.id,parsed.data.q)}
        className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
        Export capped CSV
      </a>}
    />
    <form action={path} method="get" className="flex flex-wrap items-end gap-3">
      {preservedHistory.shareStatus?<input type="hidden" name="shareStatus" value={preservedHistory.shareStatus}/>:null}
      {preservedHistory.sharePage?<input type="hidden" name="sharePage" value={preservedHistory.sharePage}/>:null}
      <label className="grid gap-2 text-sm font-semibold text-body">Search shortlisted learner
        <input type="search" name="q" defaultValue={parsed.data.q} maxLength={80}
          placeholder="Learner name" className="min-h-10 rounded border border-border bg-surface px-3"/>
      </label>
      <button type="submit" className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary">
        Search
      </button>
      <Link href={path} className="text-sm font-semibold text-primary-text underline">Clear</Link>
    </form>
    <p className="text-sm text-body">
      {data.total} currently shortlisted application(s) in this drive.
      This preview deliberately includes only application ID, learner name and email,
      the fields exposed by the current recruiter round workspace. The CSV is capped
      at 500 application rows with an explicit notice if truncated. It performs no sharing.
    </p>
    {data.rows.length === 0 ? <p role="status"
      className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
      No recruiter-visible shortlisted applications are recorded on this page.
      Screening state may have changed; absence here is not proof of no applicants.
    </p> : <>
      <ul aria-label="Shortlisted applicant cards" className="space-y-3 sm:hidden">
        {data.rows.map(item=><li key={item.applicationId}
          className="min-w-0 rounded-xl border border-border bg-surface p-4">
          <h3 className="break-words text-sm font-semibold text-foreground">{item.displayName}</h3>
          <dl className="mt-2 space-y-2 text-xs text-body">
            <div><dt className="font-semibold">Application</dt><dd className="break-all font-mono">{item.applicationId}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd className="break-all">{item.email ?? "Not recorded"}</dd></div>
          </dl>
        </li>)}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface sm:block">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-surface-secondary text-muted-foreground">
          <tr>{["Application ID", "Learner", "Email"].map((name) =>
            <th key={name} scope="col" className="px-4 py-3 font-semibold">{name}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.rows.map((item) => <tr key={item.applicationId}>
            <td className="px-4 py-3 font-mono text-xs text-body">{item.applicationId}</td>
            <td className="px-4 py-3 font-semibold text-foreground">{item.displayName}</td>
            <td className="px-4 py-3 text-body">{item.email ?? "Not recorded"}</td>
          </tr>)}
        </tbody>
      </table>
    </div></>}
    <Link href={"/tpo/placements/jobs/"+encodeURIComponent(data.job.id)+"/share-audit"}
     className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
     View company-share access history
    </Link>
    <nav aria-label="Company-share link status filters"
      className="flex flex-wrap gap-3 text-sm">
      {companyShareStatusSchema.options.map(status=><Link key={status}
       aria-current={shareStatus===status?"page":undefined}
       className="rounded border border-border px-3 py-2 font-semibold text-primary-text"
       href={companyShareLinksHref(data.job.id,status,1,parsed.data.q,data.page)}>
       {companyShareStatusLabel(status)}
      </Link>)}
    </nav>
    {(linkPage.wasInvalid||!parsedStatus.success)?<p role="status"
      className="rounded border border-border bg-surface p-3 text-sm text-body">
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
        className="font-semibold text-primary-text underline">Previous links</Link>:null}
      {shares.page<shares.totalPages?<Link href={companyShareLinksHref(data.job.id,shareStatus,shares.page+1,parsed.data.q,data.page)}
        className="font-semibold text-primary-text underline">Next links</Link>:null}
    </nav>
    <nav aria-label="Share preview pagination"
      className="flex flex-wrap justify-between gap-3 text-sm">
      <span>Page {data.page} of {data.totalPages}</span>
      <div className="flex gap-4">
        {data.page > 1 ? <Link href={path + "?" + new URLSearchParams({page:String(data.page-1),...(parsed.data.q?{q:parsed.data.q}:{}),shareStatus})}
          className="font-semibold text-primary-text hover:underline">← Previous</Link> : null}
        {data.page < data.totalPages ? <Link href={path + "?" + new URLSearchParams({page:String(data.page+1),...(parsed.data.q?{q:parsed.data.q}:{}),shareStatus})}
          className="font-semibold text-primary-text hover:underline">Next →</Link> : null}
      </div>
    </nav>
  </div>;
}
