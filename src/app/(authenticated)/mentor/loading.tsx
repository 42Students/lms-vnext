import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";

export default function MentorLoading(){
 return <section role="status" aria-busy="true"
  className="mx-auto flex min-h-[320px] max-w-[700px] flex-col items-center justify-center gap-4 px-4 py-12 text-center md:py-16">
  <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full border border-[var(--lms-info)] bg-[var(--lms-info-subtle)] text-3xl text-primary-text">ⓘ</span>
  <h1 className="text-2xl font-semibold text-[var(--lms-heading)]">Opening your mentor workspace</h1>
  <GracefulPageLoading label="Opening your mentor workspace" />
 </section>;
}
