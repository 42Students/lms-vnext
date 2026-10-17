import {PageHeader} from "@/components/ui/page-header";
export function CollegeCourseMissingScope({area}:{area:string}){
 return <main role="alert" className="space-y-3 rounded-lg border border-border bg-surface p-5">
  <PageHeader eyebrow="College Admin · Courses & Content" title={area}/>
  <h2 className="font-semibold">Admin not assigned to a college</h2>
  <p className="text-sm text-body">Ask a Super Admin to assign a college before opening {area.toLowerCase()}.</p>
 </main>;
}
