import Link from "next/link";
import TrackerIssueDetailPage from "@/app/(authenticated)/tracker/issues/[publicId]/page";
/** Dedicated findings detail preserves the existing persisted workflow, retest and immutable activity trail. */
export default async function AuditFindingDetailPage({params}:{params:Promise<{publicId:string}>}){
 return <div className="min-w-0 space-y-4">
  <Link href="/tracker/audit-findings" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← Back to audit findings</Link>
  <TrackerIssueDetailPage params={params}/>
 </div>;
}
