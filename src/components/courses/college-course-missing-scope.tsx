import { Alert } from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
export function CollegeCourseMissingScope({area}:{area:string}){
 return <Alert tone="error" role="alert" className="min-w-0 space-y-3">
  <PageHeader eyebrow="College Admin · Courses & Content" title={area}/>
  <h2 className="font-semibold text-foreground">Admin not assigned to a college</h2>
  <p className="text-sm text-body">Ask a Super Admin to assign a college before opening {area.toLowerCase()}.</p>
 </Alert>;
}
