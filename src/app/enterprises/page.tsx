import type {Metadata} from "next";
import {MarketingLayout,MarketingHero,MarketingFeatureGrid,MarketingCta} from "@/components/marketing/marketing-layout";
const SITE="https://42lms.com";
const CANONICAL=SITE+"/enterprises";
const DESCRIPTION="Build stronger workforces with structured learning, applied projects, evidence of skills and connected recruiting workflows for companies and colleges.";
const TITLE="For Enterprises — 42 LMS";
export const metadata:Metadata={
 title:TITLE,
 description:DESCRIPTION,
 alternates:{canonical:CANONICAL},
 robots:{index:true,follow:true,maxImagePreview:"large",maxSnippet:-1,maxVideoPreview:-1},
 openGraph:{
  title:TITLE,description:DESCRIPTION,type:"website",url:CANONICAL,
  siteName:"42 LMS",locale:"en_US",
  images:[{url:SITE+"/og-image.png",width:1200,height:630,alt:"42 LMS enterprise learning and hiring"}],
 },
 twitter:{card:"summary_large_image",title:TITLE,description:DESCRIPTION,
  images:[SITE+"/og-image.png"]},
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
  <MarketingHero eyebrow="For enterprises" title="Build stronger workforces through learning and hiring"
    description="Connect capability building, evidence of skills and employer-facing recruitment workflows."/>
  <div className="min-w-0" aria-label="Enterprise capabilities"><MarketingFeatureGrid title="Talent development that connects to work" maxColumns={2} items={[
   {title:"Skills and learning",description:"Provide structured learning and meaningful ways to demonstrate progress."},
   {title:"Applied projects",description:"Use mentored delivery and feedback to build practical capabilities."},
   {title:"Candidate evaluation",description:"Collaborate with placement teams to review applicants and hiring stages."},
   {title:"Hiring operations",description:"Keep interviews, offers and follow-up connected to candidate records."},
  ]}/></div>
  <MarketingCta title="Support workforce development from learning to hiring"/>
 </MarketingLayout>;
}