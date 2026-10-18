import {Skeleton} from "@/components/ui/skeleton";
export default function Loading(){
  return <div className="min-w-0 space-y-4 p-4">
    <h1 className="text-xl font-semibold">Profile verification</h1>
    <Skeleton variant="form" label="Loading verification requests…" />
    <Skeleton variant="row" count={3} label="Loading verification requests…" />
  </div>;
}
