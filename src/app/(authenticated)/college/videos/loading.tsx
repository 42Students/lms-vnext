import {Skeleton} from "@/components/ui/skeleton";
export default function CollegeVideosLoading(){
 return <div className="min-w-0 space-y-4">
  <Skeleton variant="line" label="Loading videos"/>
  <Skeleton variant="form" label="Loading videos"/>
  <Skeleton variant="row" count={3} label="Loading videos"/>
 </div>;
}
