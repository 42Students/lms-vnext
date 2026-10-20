import type {Metadata} from "next";
import { PageHeader } from "@/components/ui/page-header";
import {MarketingLayout} from "@/components/marketing/marketing-layout";
export const metadata:Metadata={title:"Request a demo | 42 LMS",description:"See 42 LMS in action."};
export default function RequestDemoPage(){
 return <MarketingLayout>
  <section className="mx-auto min-w-0 max-w-3xl space-y-6 py-6 min-[768px]:py-14">
   <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">Talk to 42 LMS</p>
   <PageHeader title="See 42 LMS in action" />
   <p className="text-base leading-7 text-body min-[768px]:text-lg min-[768px]:leading-8">See how 42 LMS supports connected learning, practical projects and placement operations.</p>
   <section className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 min-[768px]:p-6">
    <h2 className="text-2xl font-semibold">What to expect</h2>
    <ul className="list-disc space-y-3 pl-6 text-body">
     <li>A walkthrough tailored to your institution or enterprise.</li>
     <li>How learners, faculty, mentors, placement teams and employers work together.</li>
     <li>A conversation about your implementation goals and next steps.</li>
    </ul>
   </section>
   <a href="mailto:hello@42lms.com?subject=42%20LMS%20demo%20request"
    className="inline-flex min-h-11 w-full items-center justify-center min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-5 py-2 text-center text-sm font-[650] text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)] min-[768px]:w-auto">Email us to book a demo</a>
   <p className="text-sm text-muted-foreground">Contact: hello@42lms.com. No form data is collected on this page.</p>
  </section>
 </MarketingLayout>;
}