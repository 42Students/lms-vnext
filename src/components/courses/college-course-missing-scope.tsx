import { Alert } from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
export function CollegeCourseMissingScope({area}:{area:string}){
 return <div className="min-w-0 space-y-3">
  <PageHeader eyebrow="College Admin · Courses & Content" title={area}/>
  <Alert tone="error" role="alert" title="Admin not assigned to a college">
  <p className="text-sm text-body">Ask a Super Admin to assign a college before opening {area.toLowerCase()}.</p>
 </Alert>
 </div>;
}
