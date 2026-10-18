import {Skeleton} from "@/components/ui/skeleton";
export default function CollegeResourcesLoading(){
 return <div className="min-w-0 space-y-4">
  <Skeleton variant="line" label="Loading resources"/>
  <Skeleton variant="form" label="Loading resources"/>
  <Skeleton variant="row" count={3} label="Loading resources"/>
 </div>;
}
