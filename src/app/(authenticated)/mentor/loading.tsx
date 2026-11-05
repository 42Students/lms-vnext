import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

export default function MentorLoading(){
 return <section role="status" aria-busy="true"
  className="mx-auto flex min-h-[320px] max-w-[700px] flex-col items-center justify-center gap-4 px-4 py-12 text-center md:py-16">
  <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full border border-[var(--lms-info)] bg-[var(--lms-info-subtle)] text-3xl text-primary-text">ⓘ</span>
  <PageHeader title="Opening your mentor workspace" />
  <GracefulPageLoading label="Opening your mentor workspace" />
 </section>;
}
