import {and,desc,eq,isNotNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10BugReports} from "@/db/schema/db10-bug-tracker";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { runAsSystem } from "@/db/tenant-context";

import { featureReady } from "@/config/features";
export const dynamic="force-dynamic";
export const metadata={title:"Public issue updates · 42 Tracker"};

/** Opt-in, non-identifying issue discovery. No reporter, institution,
 * description, evidence or private thread is ever queried for public SSR.
 * DB capability is explicitly gated until migration and review are enabled.
 */
async function PublicIssuesPage(){
 const enabled=featureReady("publicIssueCatalog");
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
 return <main className="mx-auto min-h-dvh w-full max-w-4xl space-y-5 bg-surface p-4 text-foreground md:p-8">
   <header className="border-b border-border pb-4">
    <Heading level={1} size="2xl" className="text-[var(--lms-heading)]">42 Tracker · Issues</Heading>
    <p className="mt-2 text-sm text-body">Public issue summaries are published only after verification and an explicit review. Reporter details and private issue reports are never public.</p>
    <ButtonLink variant="primary" href="/tracker" className="mt-3">Report issue (sign-in required)</ButtonLink>
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

// Public page, no actor: runs in a named system scope so row-level security (when enforced) still lets it read
// the one record its link points at. The scope name shows in the database session.
export default async function PublicIssuesPagePublic() {
  return runAsSystem("public-page:tracker-issues-public", () => PublicIssuesPage());
}
