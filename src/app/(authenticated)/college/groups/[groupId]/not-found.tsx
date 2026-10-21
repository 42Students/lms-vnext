import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

/** Do not reveal whether a group belongs to another college. */
export default function CollegeGroupNotFound() {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Student group" />
    <ErrorState title="Group not found"
      description="This group is unavailable in the selected college. Choose a group from the directory."
      action={<Link href="/college/groups" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">All groups</Link>} />
  </div>;
}
