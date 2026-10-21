import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {ErrorState} from "@/components/ui/error-state";

/** ARCHIVED is not DELETED. Never misrepresent archived records as recovered deletions. */
export default async function CollegeDeletedWorkspacesPage(){
 const context=await getCurrentRequestContext();
 if(!getProjectAdminCollegeId(context))return <div className="min-w-0 space-y-4">
  <PageHeader title="Deleted workspaces"/>
  <ErrorState title="No college selected"
    description="Choose an active college before viewing workspace retention information."
    action={<Link href="/dashboard" className="font-semibold text-link underline">Back to dashboard</Link>}/>
 </div>;
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Deleted workspaces"
    actions={<Link href="/college/projects" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Workspaces</Link>}/>
  <Alert tone="info">A distinct deleted-workspace read model is not registered.
    Archived workspaces are separate from deleted workspaces.
    No deleted count or recoverability state is inferred from the archive.</Alert>
  <Link href="/college/projects?status=ARCHIVED"
    className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
    View archived workspaces
  </Link>
 </div>;
}
