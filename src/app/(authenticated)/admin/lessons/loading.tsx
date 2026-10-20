import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function AdminLessonsLoading() {
  return <div aria-label="Loading lessons"><GracefulPageLoading label="Loading lessons" shape="directory" /></div>;
}
