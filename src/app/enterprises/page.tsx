import type {Metadata} from "next";
import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta} from "@/components/marketing/marketing-layout";
const SITE="https://42lms.com";
const CANONICAL=SITE+"/enterprises";
const DESCRIPTION="Build stronger workforces with structured learning, applied projects, evidence of skills and connected recruiting workflows for companies and colleges.";
const TITLE="For Enterprises — 42 LMS";
export const metadata:Metadata={
 title:{absolute:TITLE},
 description:DESCRIPTION,
 alternates:{canonical:CANONICAL},
 robots:{index:true,follow:true,maxImagePreview:"large",maxSnippet:-1,maxVideoPreview:-1},
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
  <section aria-labelledby="enterprises-audience-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-white px-5 py-14 min-[768px]:py-20">
   <div className="mx-auto grid max-w-[1180px] items-start gap-10 min-[992px]:grid-cols-[1.2fr_.8fr]">
    <div className="min-w-0">
     <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--lms-primary-text)]">For Enterprises</p>
     <h2 id="enterprises-audience-heading" className="mt-3 text-[clamp(1.5rem,3vw,2.125rem)] font-semibold leading-tight text-[var(--lms-heading)]">Learning and recruiting connected to real work</h2>
     <p className="mt-4 max-w-[67ch] text-base leading-7 text-[var(--lms-body-text)]">Give teams a clear way to learn, practice, document outcomes and collaborate with campus placement cells.</p>
     <ul className="mt-6 grid gap-3 text-sm leading-6 text-[var(--lms-body-text)]">
      {[
       "Organize courses, assignments and assessments in one learning workspace.",
       "Develop work-ready skills through mentored projects and feedback.",
       "Review verified candidate information with permission-based recruiting access.",
       "Coordinate screening, interviews, offers and follow-up with placement teams.",
      ].map(point=><li key={point} className="flex items-start gap-3">
       <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#dcf4f3] text-[var(--lms-primary-text)]" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="size-3.5"><path d="m4 12 5 5L20 6"/></svg>
       </span>{point}
      </li>)}
     </ul>
    </div>
    <aside aria-label="Enterprise outcomes" className="min-w-0 rounded-[18px] border border-[#e0ebeb] bg-[#f5faf9] p-6">
     <h3 className="text-lg font-semibold text-[var(--lms-heading)]">Outcomes</h3>
     <ul className="mt-5 flex flex-wrap gap-2.5">
      {["Higher Productivity","Faster Onboarding","Better Knowledge Retention",
       "Stronger Workforce Capabilities","Improved Business Performance"].map(label=>
       <li key={label} className="rounded-full border border-[#c8e5e4] bg-white px-3.5 py-2 text-sm font-semibold text-[#175864]">{label}</li>)}
     </ul>
     <p className="mt-5 text-xs leading-5 text-[var(--lms-body-text)]">These are potential organizational outcomes, not measured guarantees.</p>
    </aside>
   </div>
  </section>
  <section aria-labelledby="enterprise-integrations-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f5faf9] px-5 py-14 min-[768px]:py-20">
   <div className="mx-auto max-w-[1180px] space-y-5">
    <h2 id="enterprise-integrations-heading" className="text-[clamp(1.5rem,3vw,2.125rem)] font-semibold text-[var(--lms-heading)]">Connected learning and hiring workflows</h2>
    <p className="max-w-[75ch] text-sm leading-6 text-[var(--lms-body-text)]">42 LMS workflows are available inside the platform. External GitHub, Slack, Teams, CRM and ERP integration is not advertised as a live feature.</p>
    <ul className="flex flex-wrap gap-3">
     {["Assessments","Assignments","Projects","Interviews","Courses","Learner profiles",
      "Candidate verification","Placement drives","Offers","Placement reporting"].map(label=>
      <li key={label} className="rounded-full border border-[#c8dfdd] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--lms-heading)]">{label}</li>)}
    </ul>
   </div>
  </section>
  <MarketingFeatureGrid title="One platform for workforce capability" items={[
   {title:"Learning and Assessments",description:"Offer structured course delivery, progress records, assignments and assessment workflows."},
   {title:"Applied Skills",description:"Use project work and mentor feedback to create evidence of practical skills."},
   {title:"Personalized Workspaces",description:"Give learners, faculty, placement teams and recruiters role-based workspaces."},
   {title:"Knowledge and Resources",description:"Organize course materials and learning resources with scoped access."},
   {title:"Recruiting Operations",description:"Coordinate applications, screening, interviews and offers with verified recruiter access."},
   {title:"Analytics & Insights",description:"Review progress and placement metrics grounded in saved records."},
  ]}/>
  <MarketingCta title="Turn workforce capability into business performance"
   subline="Connect structured learning, practical projects and recruiting workflows. Talk to our team about the modules available for your organization."/>
 </MarketingLayout>;
}