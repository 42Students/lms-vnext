import {Skeleton} from "@/components/ui/skeleton";
export default function SemesterCoursesLoading(){
 return <div className="min-w-0 space-y-4">
  <Skeleton variant="line" label="Loading course mappings"/>
  <Skeleton variant="form" label="Loading course mappings"/>
  <Skeleton variant="row" count={3} label="Loading course mappings"/>
 </div>;
}
