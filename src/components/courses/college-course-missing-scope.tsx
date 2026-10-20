import { Alert } from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
export function CollegeCourseMissingScope({area}:{area:string}){
 return <div className="min-w-0 space-y-3">
  <PageHeader title={area}/>
  <Alert tone="error" role="alert" title="Admin not assigned to a college">
  Ask a Super Admin to assign a college before opening {area.toLowerCase()}.
 </Alert>
 </div>;
}
