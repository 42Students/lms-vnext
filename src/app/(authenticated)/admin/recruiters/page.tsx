import {PageHeader} from "@/components/ui/page-header";
import SuperAdminHrPage from "../hr/page";
import { TextLink } from "@/components/ui/text-link";
/** Legacy Recruiter accounts is a Placements section, not a separate
 * workspace role. /admin/hr and /admin/recruiters share one scoped data path. */
export default async function SuperAdminRecruitersPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 return <section className="min-w-0 space-y-4" aria-label="Placements · Recruiter accounts">
  <PageHeader eyebrow="Super Admin · Placements" title="Recruiter accounts"
   description="Manage employer recruiters in the selected organization and college scope."
   actions={<TextLink href="/admin/placements" className="inline-flex min-h-11 items-center md:min-h-9">
     Back to Placements
   </TextLink>}/>
  <SuperAdminHrPage searchParams={searchParams}/>
 </section>;
}
