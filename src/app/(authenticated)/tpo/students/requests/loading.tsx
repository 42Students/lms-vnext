import { Skeleton } from "@/components/ui/skeleton";

export default function TpoStudentRequestsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading TPO Student Requests" className="space-y-5">
      <Skeleton variant="row" height={96} label="Loading TPO Student Requests" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} variant="row" height={96} label="Loading TPO Student Requests" />
        ))}
      </div>
      <Skeleton variant="row" height={96} label="Loading TPO Student Requests" />
      <Skeleton variant="row" height={384} label="Loading TPO Student Requests" />
    </div>
  );
}
