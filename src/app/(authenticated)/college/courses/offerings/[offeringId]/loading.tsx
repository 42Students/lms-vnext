import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** COL-courses-content-10 / GR-19: no blank offering detail while scoped data loads. */
export default function CollegeOfferingLoading() {
  return <section className="space-y-5 p-4">
    <p role="status" className="sr-only">Loading course details…</p>
    <GracefulPageLoading label="Loading course details" shape="directory" />
  </section>;
}
