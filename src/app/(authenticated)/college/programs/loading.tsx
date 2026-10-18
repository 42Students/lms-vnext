import {Skeleton} from "@/components/ui/skeleton";
export default function CollegeProgramsLoading(){
 return <div className="min-w-0 space-y-4">
  <Skeleton variant="line" label="Loading college programs"/>
  <Skeleton variant="form" label="Loading college programs"/>
  <Skeleton variant="row" count={3} label="Loading college programs"/>
 </div>;
}
