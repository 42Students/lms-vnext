import { Alert } from "@/components/ui/alert";
import {PageHeader} from "@/components/ui/page-header";
export function CollegeCourseMissingScope({area}:{area:string}){
 return <div className="min-w-0 space-y-3">
  <PageHeader title={area}/>
  <Alert tone="warning" role="alert" title={<><span aria-hidden="true" className="mr-2">⚠</span>Admin not assigned to a college</>}>
   You must be assigned to a college to view course progress. Contact your administrator.
  </Alert>
 </div>;
}
