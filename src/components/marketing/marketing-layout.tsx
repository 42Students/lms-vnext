import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import publicStyles from "@/components/public/public-screen.module.css";

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

const primaryNav=[
 {label:"Platform",href:"/platform"},
 {label:"Universities",href:"/universities"},
 {label:"Enterprises",href:"/enterprises"},
 {label:"Request a demo",href:"/request-demo"},
] as const;
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
  <header className="border-b border-border bg-surface">
   <nav aria-label="Public navigation" className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6">
    <Link href="/home" className={publicStyles.brand} aria-label="42LMS home">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={publicStyles.legacyLogo} /></Link>
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 md:w-auto md:justify-end sm:gap-x-4">
      {primaryNav.map(item=><Link key={item.href} href={item.href}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-1 text-sm font-semibold text-body hover:text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{item.label}</Link>)}
      <Link href="/login" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Sign in</Link>
    </div>
   </nav>
  </header>
  <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-6xl space-y-10 px-4 py-8 md:space-y-14 md:px-6 md:py-14">{children}</main>
  <footer className="border-t border-border bg-surface">
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
    <span>42 LMS · Talent and workforce development</span>
    <div className="flex flex-wrap gap-x-6 gap-y-1"><Link href="/privacy-policy" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Privacy</Link>
      <Link href="/assets/static/terms-and-conditions-view.html" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Terms</Link>
      <a href="mailto:hello@42lms.com" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Contact</a></div>
   </div>
  </footer>
 </div>;
}
export function MarketingHero({eyebrow,title,description,showExploreLink=true}:{eyebrow:string;title:string;description:string;showExploreLink?:boolean}){
 return <section aria-labelledby="marketing-hero-heading" className="min-w-0 space-y-6 py-6 md:py-12">
   <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">{eyebrow}</p>
   <h1 id="marketing-hero-heading" className="max-w-4xl break-words text-[30px] font-semibold leading-10 tracking-tight text-foreground">{title}</h1>
   <p className="max-w-3xl break-words text-base leading-7 text-body md:text-lg md:leading-8">{description}</p>
   <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
    <Link href="/request-demo" className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-6 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Request a demo</Link>
    {showExploreLink ? <Link href="/platform" className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-6 py-2 text-sm font-semibold text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Explore the platform</Link> : null}
   </div>
 </section>;
}
export function MarketingFeatureGrid({title,items,maxColumns=3}:{title:string;items:readonly {title:string;description:string}[];maxColumns?:2|3}) {
 const headingId="marketing-features-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-");
 return <section aria-labelledby={headingId} className="min-w-0 space-y-6">
  <h2 id={headingId} className="text-[16px] font-semibold leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">{title}</h2>
  <div className={`grid min-w-0 gap-4 min-[768px]:grid-cols-2 ${maxColumns === 2 ? "min-[992px]:grid-cols-2" : "min-[992px]:grid-cols-3"}`}>{items.map(item=><article key={item.title}
   className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-canvas-padding)]">
    <h3 className="font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-body">{item.description}</p>
   </article>)}</div>
 </section>;
}
export function MarketingCta({title}:{title:string}){
 return <section aria-labelledby="marketing-cta-heading" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-primary-subtle p-6 md:p-8">
  <h2 id="marketing-cta-heading" className="text-2xl font-semibold">{title}</h2>
  <p className="text-body">Explore how 42 LMS can support your learners and teams.</p>
  <Link href="/request-demo" className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-6 py-2 font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">See 42 LMS in action</Link>
 </section>;
}
