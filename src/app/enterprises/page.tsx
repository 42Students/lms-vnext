import type {Metadata} from "next";
import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta} from "@/components/marketing/marketing-layout";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
const SITE="https://42lms.com";
const CANONICAL=SITE+"/enterprises";
const DESCRIPTION="Build stronger workforces with structured learning, applied projects, evidence of skills and connected recruiting workflows for companies and colleges.";
const TITLE="For Enterprises — 42 LMS";
export const metadata:Metadata={
 title:{absolute:TITLE},
 description:DESCRIPTION,
 alternates:{canonical:CANONICAL},
 robots:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1},
 openGraph:{
  title:TITLE,description:DESCRIPTION,type:"website",url:CANONICAL,
  siteName:"42 LMS",locale:"en_US",
  images:[{url:SITE+"/og-image.png",width:1200,height:630,alt:"42 LMS enterprise learning and hiring"}],
 },
 twitter:{card:"summary_large_image",title:TITLE,description:DESCRIPTION,
  images:[{url:SITE+"/og-image.png",alt:"42 LMS enterprise learning and hiring"}]},
};
const jsonLd={
 "@context":"https://schema.org",
 "@graph":[
  {"@type":"Organization","@id":SITE+"/#organization",name:"42 LMS",
   legalName:"JRSPF Technologies Pvt. Ltd.",url:SITE+"/",
   logo:{"@type":"ImageObject","@id":SITE+"/#logo",
    url:SITE+"/assets/images/login/logoo.png",width:250,height:250,caption:"42 LMS"},
   description:"42 LMS supports structured learning, applied projects and college-to-employer placement workflows.",
   contactPoint:{"@type":"ContactPoint",email:"hello@42lms.com",contactType:"sales"}},
  {"@type":"WebSite","@id":SITE+"/#website",url:SITE+"/",name:"42 LMS",
   description:"Learning and placement operations platform",
   publisher:{"@id":SITE+"/#organization"},inLanguage:"en"},
  {"@type":"WebPage","@id":CANONICAL+"#webpage",url:CANONICAL,name:TITLE,
   description:DESCRIPTION,isPartOf:{"@id":SITE+"/#website"},
   about:{"@id":SITE+"/#organization"},inLanguage:"en",
   breadcrumb:{"@id":CANONICAL+"#breadcrumb"}},
  {"@type":"BreadcrumbList","@id":CANONICAL+"#breadcrumb",
   itemListElement:[
    {"@type":"ListItem",position:1,name:"Home",item:SITE+"/"},
    {"@type":"ListItem",position:2,name:"For Enterprises",item:CANONICAL},
   ]},
 ],
};
export default function EnterprisesPage(){
 return <MarketingLayout>
  <script type="application/ld+json"
   dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}} />
  <MarketingHero eyebrow="For Enterprises" title="Build High-Performing Workforces"
    description="Build practical capabilities through structured learning, projects, assessments and campus recruiting workflows—without unbuilt AI or external-system integration promises."/>
  <nav aria-label="Explore enterprise solutions"
   className="flex min-w-0 flex-col gap-3 border-b border-[var(--lms-canvas-border)] py-6 sm:flex-row sm:flex-wrap sm:items-center">
   <p className="text-sm font-semibold text-[var(--lms-heading)] sm:mr-2">Explore enterprise workflows</p>
   <ButtonLink variant="secondary" href="#enterprise-workflows" className="min-h-11 w-full sm:w-auto">Learning and hiring</ButtonLink>
   <ButtonLink variant="secondary" href="#enterprise-capabilities" className="min-h-11 w-full sm:w-auto">Capabilities</ButtonLink>
   <ButtonLink variant="primary" href="/request-demo" className="min-h-11 w-full sm:ml-auto sm:w-auto">Request a Demo</ButtonLink>
  </nav>
  <section aria-labelledby="enterprises-audience-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-surface px-5 py-14 md:py-20">
   <div className="mx-auto grid max-w-[1180px] items-start gap-10 lg:grid-cols-[1.2fr_.8fr]">
    <div className="min-w-0">
     <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--lms-primary-text)]">For Enterprises</p>
     <Heading level={2} id="enterprises-audience-heading" className="mt-3 text-2xl md:text-3xl leading-tight text-[var(--lms-heading)]">Learning and recruiting connected to real work</Heading>
     <p className="mt-4 max-w-[67ch] text-base leading-7 text-[var(--lms-body-text)]">Give teams a clear way to learn, practice, document outcomes and collaborate with campus placement cells.</p>
     <ul className="mt-6 grid gap-3 text-sm leading-6 text-[var(--lms-body-text)]">
      {[
       "Organize courses, assignments and assessments in one learning workspace.",
       "Develop work-ready skills through mentored projects and feedback.",
       "Review verified candidate information with permission-based recruiting access.",
       "Coordinate screening, interviews, offers and follow-up with placement teams.",
      ].map(point=><li key={point} className="flex items-start gap-3">
       <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="size-3.5"><path d="m4 12 5 5L20 6"/></svg>
       </span>{point}
      </li>)}
     </ul>
    </div>
    <aside aria-label="Enterprise outcomes" className="min-w-0 rounded-[18px] border border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] p-6">
     <Heading level={3} size="lg" className="text-[var(--lms-heading)]">Outcomes</Heading>
     <ul className="mt-5 flex flex-wrap gap-3">
      {["Higher Productivity","Faster Onboarding","Better Knowledge Retention",
       "Stronger Workforce Capabilities","Improved Business Performance"].map(label=>
       <li key={label} className="rounded-full border border-[var(--lms-canvas-border)] bg-surface px-4 py-2 text-sm font-semibold text-[var(--lms-primary-text)]">{label}</li>)}
     </ul>
     <p className="mt-5 text-xs leading-5 text-[var(--lms-body-text)]">These are potential organizational outcomes, not measured guarantees.</p>
    </aside>
   </div>
  </section>
  <section id="enterprise-workflows" aria-labelledby="enterprise-integrations-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-[var(--lms-primary-subtle)] px-5 py-14 md:py-20">
   <div className="mx-auto max-w-[1180px] space-y-5">
    <Heading level={2} id="enterprise-integrations-heading" className="text-2xl md:text-3xl text-[var(--lms-heading)]">Connected learning and hiring workflows</Heading>
    <p className="max-w-[75ch] text-sm leading-6 text-[var(--lms-body-text)]">42 LMS workflows are available inside the platform. External GitHub, Slack, Teams, CRM and ERP integration is not advertised as a live feature.</p>
    <ul className="flex flex-wrap gap-3">
     {["Assessments","Assignments","Projects","Interviews","Courses","Learner profiles",
      "Candidate verification","Placement drives","Offers","Placement reporting"].map(label=>
      <li key={label} className="rounded-full border border-[var(--lms-canvas-border)] bg-surface px-4 py-3 text-sm font-semibold text-[var(--lms-heading)]">{label}</li>)}
    </ul>
   </div>
  </section>
  <div id="enterprise-capabilities" className="min-w-0 scroll-mt-24">
  <MarketingFeatureGrid title="One platform for workforce capability" items={[
   {title:"Learning and Assessments",description:"Offer structured course delivery, progress records, assignments and assessment workflows."},
   {title:"Applied Skills",description:"Use project work and mentor feedback to create evidence of practical skills."},
   {title:"Personalized Workspaces",description:"Give learners, faculty, placement teams and recruiters role-based workspaces."},
   {title:"Knowledge and Resources",description:"Organize course materials and learning resources with scoped access."},
   {title:"Recruiting Operations",description:"Coordinate applications, screening, interviews and offers with verified recruiter access."},
   {title:"Analytics & Insights",description:"Review progress and placement metrics grounded in saved records."},
  ]}/>
  </div>
  <MarketingCta title="Turn workforce capability into business performance"
   subline="Connect structured learning, practical projects and recruiting workflows. Talk to our team about the modules available for your organization."/>
 </MarketingLayout>;
}