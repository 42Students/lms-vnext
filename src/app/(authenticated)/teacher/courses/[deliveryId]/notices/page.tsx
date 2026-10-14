import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { facultyNoticeParamsSchema } from "@/modules/courses/faculty-notices-model";
import { getFacultySectionNotices } from "@/modules/courses/faculty-notices-service";

export default async function FacultySectionNoticesPage({
  params,
}: {params:Promise<{deliveryId:string}>}) {
  const raw=await params;
  const {deliveryId}=facultyNoticeParamsSchema.parse(raw);
  const context=await getCurrentRequestContext();
  const data=await getFacultySectionNotices(context,{deliveryId});
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Course" title="Section notices"
      description={data.courseName+" · "+data.sectionName}
      actions={<Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/discussions"}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Open Discussions
      </Link>} />
    <section role="status" className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-foreground">Notice board unavailable</h2>
      <p className="mt-3 text-sm leading-6 text-body">{data.blocker}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        No notices are displayed and no post action is offered until the announcement table,
        Section targeting and authoring audit are registered and verified.
      </p>
    </section>
    <Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+"/home"}
      className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text hover:underline">
      ← Course overview
    </Link>
  </div>;
}
