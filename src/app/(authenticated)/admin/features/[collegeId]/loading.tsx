import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function CollegeModuleAccessLoading() {
  return (
    <GracefulPageLoading label="Loading scoped module inheritance and overrides…" shape="directory" />
  );
}
