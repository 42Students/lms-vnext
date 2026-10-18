import {Skeleton} from "@/components/ui/skeleton";
export default function CollegePeopleLoading() {
  return <div className="min-w-0 space-y-4">
    <Skeleton variant="line" label="Loading college people…" />
    <Skeleton variant="form" count={2} label="Loading college people…" />
    <Skeleton variant="row" count={3} label="Loading college people…" />
  </div>;
}
