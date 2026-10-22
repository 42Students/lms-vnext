import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function CollegeResourcesLoading(){
 return <section className="min-w-0 space-y-4" aria-busy="true" aria-label="Loading resources">
  <PageHeader title="Resources"
   description="Give a lesson reading material: files, links and notes, together in one resource." />
  <GracefulPageLoading label="Loading college resources…" shape="directory" />
 </section>;
}
