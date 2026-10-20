import { Skeleton } from "@/components/ui/skeleton";

export default function TpoPlacementTeamLoading() {
  return (
    <div aria-busy="true" aria-label="Loading Placement Team" className="space-y-5">
      <Skeleton variant="row" height={96} label="Loading Placement Team" />
      <div className="grid gap-3 min-[768px]:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} variant="row" height={96} label="Loading Placement Team" />
        ))}
      </div>
      <Skeleton variant="row" height={384} label="Loading Placement Team" />
    </div>
  );
}
