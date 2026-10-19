import { Skeleton } from "@/components/ui/skeleton";

export default function TpoRecruiterAccessLoading() {
  return (
    <div aria-busy="true" aria-label="Loading recruiter college grants" className="space-y-5">
      <Skeleton variant="row" height={48} label="Loading recruiter college grants" />
      <Skeleton variant="row" height={144} label="Loading recruiter college grants" />
      <Skeleton variant="row" height={320} label="Loading recruiter college grants" />
      <Skeleton variant="row" height={48} label="Loading recruiter college grants" />
    </div>
  );
}
