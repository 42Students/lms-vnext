import type {Metadata} from "next";
const SITE="https://42lms.com";
const DEMO_TITLE="Request a Demo — 42 LMS";
const DEMO_DESCRIPTION="See how 42 LMS supports connected learning, projects and placements. Request a personalized demo.";
const DEMO_MAILTO="mailto:hello@42lms.com?subject="+encodeURIComponent(DEMO_TITLE)+
 "&body="+encodeURIComponent("Hi 42 LMS team,\n\nI'd like to see a demo.\n\nName:\nOrganization:\nRole:\nPhone:\nWhat you're looking to solve:\n\nThanks!");
const demoJsonLd={
 "@context":"https://schema.org",
 "@graph":[
  {"@type":"ContactPage","@id":SITE+"/request-demo#webpage",url:SITE+"/request-demo",
   name:DEMO_TITLE,description:DEMO_DESCRIPTION,isPartOf:{"@id":SITE+"/#website"},
   about:{"@id":SITE+"/#organization"},inLanguage:"en"},
  {"@type":"BreadcrumbList","@id":SITE+"/request-demo#breadcrumb",itemListElement:[
   {"@type":"ListItem",position:1,name:"Home",item:SITE+"/"},
   {"@type":"ListItem",position:2,name:"Request a Demo",item:SITE+"/request-demo"},
  ]},
 ],
};
export const metadata:Metadata={
 title:DEMO_TITLE,description:DEMO_DESCRIPTION,
 alternates:{canonical:SITE+"/request-demo"},
 robots:{index:true,follow:true,maxImagePreview:"large",maxSnippet:-1,maxVideoPreview:-1},
 openGraph:{type:"website",locale:"en_US",siteName:"42 LMS",title:DEMO_TITLE,description:DEMO_DESCRIPTION,
  url:SITE+"/request-demo",images:[{url:SITE+"/og-image.png",width:1200,height:630,alt:"42 LMS"}]},
 twitter:{card:"summary_large_image",title:DEMO_TITLE,description:DEMO_DESCRIPTION,
  images:[SITE+"/og-image.png"]},
};
import { PageHeader } from "@/components/ui/page-header";
import {MarketingLayout} from "@/components/marketing/marketing-layout";
export default function RequestDemoPage(){
 return <MarketingLayout>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(demoJsonLd).replace(/</g,"\\u003c")}} />
  <section className="mx-auto min-w-0 max-w-3xl space-y-6 py-6 min-[768px]:py-14">
   <PageHeader title="See 42 LMS in action" />
   <p className="text-base leading-7 text-body min-[768px]:text-lg min-[768px]:leading-8">See how 42 LMS supports connected learning, practical projects and placement operations.</p>
   <section className="min-w-0 space-y-4 border-y border-[var(--lms-canvas-border)] py-4">
    <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">What to expect</h2>
    <ul className="list-disc space-y-3 pl-6 text-body">
     <li>A walkthrough tailored to your institution or enterprise.</li>
     <li>How learners, faculty, mentors, placement teams and employers work together.</li>
     <li>A conversation about your implementation goals and next steps.</li>
    </ul>
   </section>
   <a href={DEMO_MAILTO}
    className="inline-flex min-h-11 w-full min-w-0 items-center justify-center min-[768px]:min-h-9 rounded-[var(--lms-control-radius)] border border-primary bg-primary px-6 py-2 text-center text-sm font-[650] text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:w-auto">Email us to book a demo</a>
   <p className="text-sm text-muted-foreground leading-[22px]">Contact: hello@42lms.com. No form data is collected on this page.</p>
  </section>
 </MarketingLayout>;
}