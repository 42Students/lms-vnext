import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function GroupCsvPreviewLoading() {
  return <GracefulPageLoading label="Loading student group import preview" shape="directory" />;
}
