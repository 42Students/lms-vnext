import {Skeleton} from "@/components/ui/skeleton";
export default function CollegeSemestersLoading() {
  return <div className="min-w-0 space-y-4">
    <Skeleton variant="line" label="Loading semesters" />
    <Skeleton variant="form" label="Loading semesters" />
    <Skeleton variant="row" count={3} label="Loading semesters" />
  </div>;
}
