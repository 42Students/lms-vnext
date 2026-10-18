import {Skeleton} from "@/components/ui/skeleton";
export default function StudentsDirectoryLoading() {
  return <div className="min-w-0 space-y-4">
    <Skeleton variant="line" label="Loading College Students directory" />
    <Skeleton variant="form" label="Loading College Students directory" />
    <Skeleton variant="row" count={3} label="Loading College Students directory" />
  </div>;
}
