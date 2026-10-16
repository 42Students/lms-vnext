import type {Metadata} from "next";
import {MarketingLayout} from "@/components/marketing/marketing-layout";
export const metadata:Metadata={title:"Request a demo | 42 LMS",description:"See 42 LMS in action."};
export default function RequestDemoPage(){
 return <MarketingLayout>
  <section className="mx-auto max-w-3xl space-y-6 py-14">
   <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">Talk to 42 LMS</p>
   <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">See 42 LMS in action</h1>
   <p className="text-lg leading-8 text-body">See how 42 LMS supports connected learning, practical projects and placement operations.</p>
   <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
    <h2 className="text-2xl font-semibold">What to expect</h2>
    <ul className="list-disc space-y-3 pl-6 text-body">
     <li>A walkthrough tailored to your institution or enterprise.</li>
     <li>How learners, faculty, mentors, placement teams and employers work together.</li>
     <li>A conversation about your implementation goals and next steps.</li>
    </ul>
   </section>
   <a href="mailto:hello@42lms.com?subject=42%20LMS%20demo%20request"
    className="inline-flex min-h-12 items-center rounded-md bg-primary px-6 font-semibold text-on-primary">Email us to book a demo</a>
   <p className="text-sm text-muted-foreground">Contact: hello@42lms.com. No form data is collected on this page.</p>
  </section>
 </MarketingLayout>;
}