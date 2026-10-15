import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {listTpoCompanyShareAudit} from "@/modules/placements/company-share/manage-service";
export const dynamic="force-dynamic";
export default async function TpoCompanyShareAuditPage({params}:{
 params:Promise<{jobId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {jobId}=await params;
 const result=await listTpoCompanyShareAudit(context,jobId);
 const back="/tpo/placements/jobs/"+encodeURIComponent(jobId)+"/share-preview";
 return <div className="space-y-5">
  <Link href={back} className="text-sm font-semibold text-primary-text underline">
   Back to company-share preview
  </Link>
  <h1 className="text-2xl font-semibold text-foreground">Company-share access history</h1>
  {result.ready?<a href={"/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/company-shares/audit/export"}
    className="inline-flex min-h-10 items-center rounded bg-primary px-4 text-sm font-semibold text-on-primary">
    Export access history CSV
  </a>:null}
  {!result.ready?<p role="status" className="rounded border border-border p-5">
   Access history is unavailable until the share-audit migration is registered.
  </p>:result.entries.length===0?<p role="status" className="rounded border border-border p-5">
   No share-page views or CSV downloads are recorded for this drive.
  </p>:<div className="overflow-x-auto rounded-xl border border-border">
   <table className="w-full min-w-[28rem] text-left text-sm">
    <thead><tr><th className="p-3">Link prefix</th><th className="p-3">Action</th>
     <th className="p-3">UTC timestamp</th></tr></thead>
    <tbody>{result.entries.map((entry,index)=><tr key={index} className="border-t border-border">
     <td className="p-3 font-mono">{entry.sharePrefix}</td>
     <td className="p-3">{entry.kind}</td>
     <td className="p-3">{entry.at}</td>
    </tr>)}</tbody>
   </table>
  </div>}
  {result.limited?<p role="status" className="text-sm text-body">
   Only the 100 most recent access events are shown.
  </p>:null}
 </div>;
}
