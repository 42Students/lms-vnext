import { Skeleton } from "@/components/ui/skeleton";

export default function TpoPlacementBrandingLoading() {
  return (
    <div aria-busy="true" aria-label="Loading placement branding" className="space-y-5">
      <Skeleton variant="row" height={48} label="Loading placement branding" />
      <Skeleton variant="row" height={160} label="Loading placement branding" />
      <Skeleton variant="row" height={192} label="Loading placement branding" />
      <div className="grid gap-3 min-[768px]:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} variant="row" height={144} label="Loading placement branding" />
        ))}
      </div>
      <Skeleton variant="row" height={112} label="Loading placement branding" />
    </div>
  );
}
