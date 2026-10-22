import {PageHeader} from "@/components/ui/page-header";
export default function ChangeRequestsLoading(){
 return <section aria-busy="true" aria-live="polite" className="min-w-0 space-y-4">
  <PageHeader title="Change requests" description="Loading drive change requests…"/>
  <div role="status" className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 text-sm text-body">
   <span aria-hidden="true" className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent align-middle"/>
   Loading change requests and discussion…
  </div>
 </section>;
}
