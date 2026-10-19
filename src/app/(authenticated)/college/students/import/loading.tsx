import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function StudentImportLoading() {
  return <GracefulPageLoading label="Loading student importer" shape="directory" />;
}
