import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TpoNoticeDeleteConfirm } from "@/components/tpo/tpo-notice-delete-confirm";
import { TpoNoticeReadProgress } from "@/components/tpo/tpo-notice-read-progress";
import { TpoNoticeUndoToast } from "@/components/tpo/tpo-notice-undo-toast";
import { TpoKeyboardShortcuts } from "@/components/tpo/tpo-keyboard-shortcuts";
import { TpoGridFilterPanel } from "@/components/tpo/tpo-grid-filter-panel";
import { ToastProvider } from "@/components/ui/toast";
import { Heading } from "@/components/ui/heading";

import { env } from "@/config/env";
export const dynamic = "force-dynamic";

const noticeId = "00000000-0000-4000-8000-000000000158";

/** Synthetic component harness. The production build always returns 404. */
export default function TpoG158Fixture() {
 if(process.env.NODE_ENV!=="development"||env.UX_G158_FIXTURE!=="1")notFound();
 return <main id="lms-main-content" className="mx-auto w-full max-w-[70rem] min-w-0 space-y-8 px-4 py-6 md:px-8">
  <Heading level={1} className="text-2xl font-bold">TPO interaction acceptance</Heading>
  <section data-ux-fixture="delete" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Delete notice</Heading>
   <TpoNoticeDeleteConfirm id={noticeId} version={4}/>
  </section>
  <section data-ux-fixture="receipts" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Notice read progress</Heading>
   <TpoNoticeReadProgress id={noticeId} status="SENT"/>
  </section>
  <section data-ux-fixture="undo" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Send undo</Heading>
   <ToastProvider>
    <TpoNoticeUndoToast id={noticeId} version={4} createdAt={new Date().toISOString()} recipientCount={2}/>
   </ToastProvider>
  </section>
  <section data-ux-fixture="shortcuts" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Heading level={2}>Keyboard navigation</Heading>
   <TpoKeyboardShortcuts/>
  </section>
  <section data-ux-fixture="filters" className="min-w-0 space-y-3 rounded-xl border border-border p-4">
   <Suspense fallback={<p role="status">Loading filters…</p>}>
    <TpoGridFilterPanel mobileSheet title="Filter students" fields={[
     {key:"status",label:"Eligibility",options:[
      {value:"eligible",label:"Eligible"},{value:"blocked",label:"Blocked"}
     ]}
    ]}/>
   </Suspense>
  </section>
 </main>;
}
