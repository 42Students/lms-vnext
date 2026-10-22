import Link from "next/link";
import {and,desc,eq,isNotNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10BugReports} from "@/db/schema/db10-bug-tracker";

export const dynamic="force-dynamic";
export const metadata={title:"Public issue updates · 42 Tracker"};

/** Opt-in, non-identifying issue discovery. No reporter, institution,
 * description, evidence or private thread is ever queried for public SSR.
 * DB capability is explicitly gated until migration and review are enabled.
 */
export default async function PublicIssuesPage(){
 const enabled=process.env["PUBLIC_ISSUE_CATALOG_READY"]==="true";
 const result=!enabled?{ok:false as const,items:[]}:
   await getDb().select({
     publicId:db10BugReports.publicId,
     issueType:db10BugReports.issueType,
     status:db10BugReports.status,
     approvedAt:db10BugReports.publicCatalogApprovedAt,
   }).from(db10BugReports).where(and(
     isNotNull(db10BugReports.publicCatalogApprovedAt),
     eq(db10BugReports.productionVerified,true),
     eq(db10BugReports.status,"CLOSED"),
   )).orderBy(desc(db10BugReports.publicCatalogApprovedAt),desc(db10BugReports.id))
     .limit(20).then(items=>({ok:true as const,items}))
     .catch(()=>({ok:false as const,items:[]}));
 return <main className="mx-auto min-h-dvh w-full max-w-4xl space-y-5 bg-white p-4 text-foreground md:p-8">
   <header className="border-b border-border pb-4">
    <h1 className="text-[24px] font-semibold text-[var(--lms-heading)]">42 Tracker · Issues</h1>
    <p className="mt-2 text-sm text-body">Public issue summaries are published only after verification and an explicit review. Reporter details and private issue reports are never public.</p>
    <Link href="/tracker" className="mt-3 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">Report issue (sign-in required)</Link>
   </header>
   {!result.ok?<p role="status" className="text-sm text-body">Public issue updates are temporarily unavailable. Try again later; individual reports stay private.</p>:
    result.items.length===0?<p role="status" className="text-sm text-body">There are no approved public issue summaries.</p>:
    <ol aria-label="Reviewed public issue summaries" className="divide-y divide-border border-y border-border">
      {result.items.map(item=><li key={item.publicId} className="py-3">
        <p className="text-sm font-semibold text-foreground">{item.issueType}</p>
        <p className="mt-1 text-xs text-body">Reference {item.publicId} · Closed · Production verified</p>
       </li>)}
    </ol>}
 </main>;
}
