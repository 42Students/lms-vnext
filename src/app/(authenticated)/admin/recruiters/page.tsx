import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import SuperAdminHrPage from "../hr/page";
/** Legacy Recruiter accounts is a Placements section, not a separate
 * workspace role. /admin/hr and /admin/recruiters share one scoped data path. */
export default async function SuperAdminRecruitersPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 return <section className="min-w-0 space-y-4" aria-label="Placements · Recruiter accounts">
  <PageHeader eyebrow="Super Admin · Placements" title="Recruiter accounts"
   description="Manage employer recruiters in the selected organization and college scope."
   actions={<Link href="/admin/placements" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
     Back to Placements
   </Link>}/>
  <SuperAdminHrPage searchParams={searchParams}/>
 </section>;
}
