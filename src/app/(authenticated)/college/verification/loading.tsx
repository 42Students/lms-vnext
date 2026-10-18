import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
export default function Loading(){
  return <div className="min-w-0 space-y-4 p-4">
    <h1 className="text-xl font-semibold">Profile verification</h1>
    <GracefulPageLoading label="Loading verification requests…" shape="directory" />
  </div>;
}
