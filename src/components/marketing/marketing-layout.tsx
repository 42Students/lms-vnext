import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import {MarketingHeaderClient} from "./marketing-header-client";

const MARKETING_SITE = "https://42lms.com";
const MARKETING_CONTACT = "hello@42lms.com";
const MARKETING_DESCRIPTION = "Connected learning, projects and placements for universities and enterprises.";
const sharedMarketingGraph = {
 "@context": "https://schema.org",
 "@graph": [
  { "@type": "Organization", "@id": MARKETING_SITE + "/#organization", name: "42 LMS",
   url: MARKETING_SITE + "/", logo: MARKETING_SITE + "/assets/images/legacy-42lms-logo.svg",
   description: MARKETING_DESCRIPTION,
   contactPoint: { "@type": "ContactPoint", contactType: "sales", email: MARKETING_CONTACT } },
  { "@type": "WebSite", "@id": MARKETING_SITE + "/#website",
   url: MARKETING_SITE + "/", name: "42 LMS", publisher: { "@id": MARKETING_SITE + "/#organization" },
   description: MARKETING_DESCRIPTION, inLanguage: "en" },
 ],
};
function ldJson(graph: unknown): string {
 return JSON.stringify(graph).replace(/</g, "\\u003c");
}
/** Route owners can apply this with their real route paths via Next's metadata export. */
export function marketingPageMetadata(path: string, title: string, description: string): Metadata {
 const pathname = path.startsWith("/") && !path.startsWith("//") && !path.includes("..") && !path.includes("?")
  ? path : "/";
 const canonical = MARKETING_SITE + (pathname === "/" ? "/" : pathname);
 return {
  title, description,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: "42 LMS", locale: "en_IN", title, description, url: canonical },
  twitter: { card: "summary", title, description },
 };
}
/** Prefilled demo request fields; request-demo route can import it without duplicating copy. */
export const MARKETING_DEMO_MAILTO = "mailto:" + MARKETING_CONTACT +
 "?subject=" + encodeURIComponent("42 LMS demo request") +
 "&body=" + encodeURIComponent("Name:\nOrganization:\nRole:\nPhone:\nWhat would you like to solve:\n");

function verifiedMarketingSocial(value:string|undefined):string|null{
 if(!value)return null;
 try{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password&&url.pathname!=="/"&&url.hostname.includes(".")
   ?url.toString():null;
 }catch{return null;}
}
export function MarketingLayout({children,path,pageTitle,pageDescription}:{
 children:ReactNode;path?:string;pageTitle?:string;pageDescription?:string;
}){
 const normalizedPath = path && path.startsWith("/") && !path.startsWith("//") && !path.includes("..") && !path.includes("?")
  ? path : null;
 const pageJson = normalizedPath && pageTitle ? ldJson({
  "@context": "https://schema.org",
  "@graph": [
   { "@type": "WebPage", "@id": MARKETING_SITE + normalizedPath + "#webpage",
    url: MARKETING_SITE + normalizedPath, name: pageTitle,
    description: pageDescription || MARKETING_DESCRIPTION,
    isPartOf: { "@id": MARKETING_SITE + "/#website" },
    about: { "@id": MARKETING_SITE + "/#organization" }, inLanguage: "en" },
   { "@type": "BreadcrumbList", "@id": MARKETING_SITE + normalizedPath + "#breadcrumb",
    itemListElement: [
     { "@type": "ListItem", position: 1, name: "Home", item: MARKETING_SITE + "/" },
     { "@type": "ListItem", position: 2, name: pageTitle, item: MARKETING_SITE + normalizedPath },
    ] },
  ],
 }) : null;
 return <div className="min-h-dvh bg-background text-foreground">
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:ldJson(sharedMarketingGraph)}} />
  {pageJson?<script type="application/ld+json" dangerouslySetInnerHTML={{__html:pageJson}} />:null}
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[var(--lms-control-radius)] focus:border focus:border-primary focus:bg-surface focus:px-4 focus:font-semibold focus:text-primary-text focus:outline-2 focus:outline-offset-[3px]">
   Skip to main content
  </a>
  <MarketingHeaderClient />
  <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-[1180px] px-5 [&>*]:min-w-0">{children}</main>
  <footer className="border-t border-[#d9e8e9] bg-[#f5faf9]">
   <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-5 py-14 text-sm sm:grid-cols-2 min-[992px]:grid-cols-[2fr_1fr_1fr] min-[992px]:py-20">
    <div className="space-y-4">
     <Link href="/" className="inline-flex min-h-11 items-center" aria-label="42 LMS home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/images/legacy-42lms-logo.svg" width={151} height={37} alt="42 LMS" className="h-[37px] w-[151px]"/>
     </Link>
     <p className="max-w-xs leading-6 text-[var(--lms-body-text)]">Connected learning, projects and placements for universities and enterprises.</p>
     <div className="flex flex-wrap gap-3">
      {([["LinkedIn",process.env.NEXT_PUBLIC_MARKETING_LINKEDIN_URL],
        ["Instagram",process.env.NEXT_PUBLIC_MARKETING_INSTAGRAM_URL],
        ["YouTube",process.env.NEXT_PUBLIC_MARKETING_YOUTUBE_URL]] as const).map(([label,raw])=>{
        const href=verifiedMarketingSocial(raw);
        return href?<a key={label} href={href} target="_blank" rel="noopener noreferrer"
         className="inline-flex min-h-11 items-center text-[var(--lms-primary-text)] underline-offset-4 hover:underline">{label}</a>:null;
       })}
     </div>
    </div>
    <nav aria-label="Product" className="flex flex-col items-start gap-2">
     <h2 className="font-semibold text-[var(--lms-heading)]">Product</h2>
     {[{label:"Platform",href:"/platform"},{label:"For Universities",href:"/universities"},{label:"For Enterprises",href:"/enterprises"}].map(item=>
      <Link key={item.href} className="inline-flex min-h-11 items-center text-[var(--lms-body-text)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2" href={item.href}>{item.label}</Link>)}
    </nav>
    <nav aria-label="Get started" className="flex flex-col items-start gap-2">
     <h2 className="font-semibold text-[var(--lms-heading)]">Get started</h2>
     <Link href="/request-demo" className="inline-flex min-h-11 items-center hover:text-[var(--lms-primary-text)]">Request a Demo</Link>
     <Link href="/login" className="inline-flex min-h-11 items-center hover:text-[var(--lms-primary-text)]">Login</Link>
     <a href={MARKETING_DEMO_MAILTO} className="inline-flex min-h-11 items-center hover:text-[var(--lms-primary-text)]">Contact sales</a>
     <Link href="/privacy-policy" className="inline-flex min-h-11 items-center hover:text-[var(--lms-primary-text)]">Privacy Policy</Link>
     <Link href="/assets/static/terms-and-conditions-view.html" className="inline-flex min-h-11 items-center hover:text-[var(--lms-primary-text)]">Terms</Link>
    </nav>
   </div>
   <div className="mx-auto max-w-[1180px] border-t border-[#d9e8e9] px-5 py-5 text-xs text-[var(--lms-body-text)]">© {new Date().getFullYear()} JRSPF Technologies Pvt. Ltd. All rights reserved.</div>
  </footer>
 </div>;
}
/** Public marketing chrome follows the former full-bleed layout; business
 * and university pages retain the approved, non-AI copy.
 */
export function MarketingHero({eyebrow,title,description,showExploreLink=true,subline}:{
 eyebrow:string;title:string;description:string;showExploreLink?:boolean;subline?:string;
}){
 const audience=/^For (Universities|Enterprises)$/i.test(eyebrow);
 const home=/connected talent development/i.test(eyebrow);
 return <section aria-labelledby="marketing-hero-heading" className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(130deg,#eaf9f9_0%,#ffffff_58%,#f3f9fd_100%)] py-14 min-[768px]:py-20">
  <div className={"mx-auto grid max-w-[1180px] gap-8 px-5 "+(home?"min-[992px]:grid-cols-[1.2fr_.8fr] min-[992px]:items-center":"")}>
   <div className="min-w-0 max-w-[760px] space-y-6">
    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--lms-primary-text)]">{/^For enterprises$/i.test(eyebrow)?"For Enterprises":/^For universities$/i.test(eyebrow)?"For Universities":eyebrow}</p>
    <h1 id="marketing-hero-heading" className="max-w-[760px] break-words text-[clamp(2rem,5vw,3.375rem)] font-bold leading-[1.08] tracking-tight text-[var(--lms-heading)]">{title}</h1>
    <p className="max-w-[720px] break-words text-base leading-7 text-[var(--lms-body-text)] min-[768px]:text-lg min-[768px]:leading-8">{description}</p>
    {!audience?<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
     <Link href="/request-demo" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--lms-primary)] px-6 font-semibold text-white hover:bg-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2">Request a Demo <span aria-hidden="true" className="ml-2">↗</span></Link>
     {showExploreLink?<Link href="/platform" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--lms-primary)] px-6 font-semibold text-[var(--lms-primary-text)] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2">See how it works</Link>:null}
    </div>:null}
    {home?<p className="text-sm font-medium text-[var(--lms-body-text)]">One platform for universities and enterprises.</p>:null}
    {subline?<p className="text-sm text-[var(--lms-body-text)]">{subline}</p>:null}
   </div>
   {home?<aside aria-label="Connected LMS workspaces" className="hidden min-w-0 rounded-[22px] border border-[#c5e6e9] bg-white/90 p-6 shadow-[0_24px_60px_rgba(21,73,83,0.12)] min-[992px]:block">
    <p className="text-sm font-semibold text-[var(--lms-heading)]">A connected journey</p>
    <ol className="mt-5 grid gap-3">
     {["Learn and assess","Build with mentors","Interview and grow"].map((label,index)=><li key={label} className="flex items-center gap-3 rounded-xl bg-[#edf8f8] px-4 py-3 text-sm font-semibold text-[var(--lms-heading)]">
      <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d5f0f0] text-[var(--lms-primary-text)]">{index+1}</span>{label}
     </li>)}
    </ol>
   </aside>:null}
  </div>
 </section>;
}
export function MarketingFeatureGrid({title,items,maxColumns=3}:{title:string;items:readonly {title:string;description:string}[];maxColumns?:2|3}){
 const headingId="marketing-features-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-");
 return <section aria-labelledby={headingId} className="relative left-1/2 w-screen -translate-x-1/2 bg-white py-14 even:bg-[#f5faf9] min-[768px]:py-20">
  <div className="mx-auto max-w-[1180px] space-y-9 px-5">
   <h2 id={headingId} className="text-[clamp(1.5rem,3vw,2.125rem)] font-semibold leading-tight text-[var(--lms-heading)]">{title}</h2>
   <ul className={`grid min-w-0 gap-5 min-[640px]:grid-cols-2 ${maxColumns===2?"min-[992px]:grid-cols-2":"min-[992px]:grid-cols-3"}`}>
    {items.map((item,index)=><li key={item.title} className="min-w-0 rounded-[18px] border border-[#e0ebeb] bg-white p-6 shadow-[0_8px_30px_rgba(28,79,88,0.05)]">
     <span aria-hidden="true" className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#dcf4f3] text-[var(--lms-primary-text)]">
      <svg viewBox="0 0 32 32" fill="none" width="26" height="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       {index%3===0?<><path d="M5 9l11-5 11 5-11 5-11-5zM8 14v8l8 4 8-4v-8"/></>:index%3===1?<><rect x="5" y="6" width="22" height="20" rx="3"/><path d="M10 13h12M10 19h8"/></>:<><circle cx="16" cy="9" r="4"/><path d="M6 27c0-6 4-10 10-10s10 4 10 10"/></>}
      </svg>
     </span>
     <h3 className="text-[17px] font-semibold text-[var(--lms-heading)]">{item.title}</h3>
     <p className="mt-3 text-sm leading-6 text-[var(--lms-body-text)]">{item.description}</p>
    </li>)}
   </ul>
  </div>
 </section>;
}
export function MarketingCta({title,subline}:{title:string;subline?:string}){
 return <section aria-labelledby="marketing-cta-heading" className="relative left-1/2 w-screen -translate-x-1/2 bg-white px-5 py-14 min-[768px]:py-20">
  <div className="mx-auto max-w-[1180px] space-y-6 rounded-[22px] bg-[linear-gradient(125deg,#123d4e_0%,#126e78_100%)] px-6 py-12 text-white min-[768px]:px-14 min-[768px]:py-16">
   <h2 id="marketing-cta-heading" className="text-[clamp(1.625rem,3vw,2.5rem)] font-semibold leading-tight text-white">{title}</h2>
   <p className="text-sm leading-6 text-white/90 min-[768px]:text-base">{subline??"Explore how 42 LMS can support your learners and teams."}</p>
   <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
    <Link href="/request-demo" className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 font-semibold text-[#124f59] hover:bg-[#edf8f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Request a Demo <span aria-hidden="true" className="ml-2">↗</span></Link>
    <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/75 px-6 font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Login</Link>
   </div>
  </div>
 </section>;
}
