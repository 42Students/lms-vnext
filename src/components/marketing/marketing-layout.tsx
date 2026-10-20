import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import type { ReactNode } from "react";
import publicStyles from "@/components/public/public-screen.module.css";

const primaryNav=[
 {label:"Platform",href:"/platform"},
 {label:"Universities",href:"/universities"},
 {label:"Enterprises",href:"/enterprises"},
 {label:"Request a demo",href:"/request-demo"},
] as const;
export function MarketingLayout({children}:{children:ReactNode}){
 return <div className="min-h-dvh bg-background text-foreground">
  <header className="border-b border-border bg-surface">
   <nav aria-label="Public navigation" className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
    <Link href="/home" className={publicStyles.brand} aria-label="42LMS home">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={publicStyles.legacyLogo} /></Link>
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 sm:w-auto sm:justify-end sm:gap-x-4">
      {primaryNav.map(item=><Link key={item.href} href={item.href}
       className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] px-1 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">{item.label}</Link>)}
      <Link href="/login" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Sign in</Link>
    </div>
   </nav>
  </header>
  <main className="mx-auto min-w-0 max-w-6xl space-y-10 px-4 py-8 sm:space-y-14 sm:px-5 sm:py-14">{children}</main>
  <footer className="border-t border-border bg-surface">
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
    <span>42 LMS · Talent and workforce development</span>
    <div className="flex flex-wrap gap-x-5 gap-y-1"><Link href="/privacy-policy" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">Privacy</Link>
      <Link href="/assets/static/terms-and-conditions-view.html" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">Terms</Link>
      <a href="mailto:hello@42lms.com" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] text-primary-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">Contact</a></div>
   </div>
  </footer>
 </div>;
}
export function MarketingHero({eyebrow,title,description}:{eyebrow:string;title:string;description:string}){
 return <section aria-labelledby="marketing-hero-heading" className="min-w-0 space-y-5 py-6 sm:py-12">
   <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">{eyebrow}</p>
   <PageHeader id="marketing-hero-heading" title={title} />
   <p className="max-w-3xl break-words text-base leading-7 text-body sm:text-lg sm:leading-8">{description}</p>
   <div className="flex flex-wrap gap-3">
    <Link href="/request-demo" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-5 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Request a demo</Link>
    <Link href="/platform" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-5 py-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Explore the platform</Link>
   </div>
 </section>;
}
export function MarketingFeatureGrid({title,items}:{title:string;items:readonly {title:string;description:string}[]}) {
 const headingId="marketing-features-"+title.toLowerCase().replace(/[^a-z0-9]+/g,"-");
 return <section aria-labelledby={headingId} className="min-w-0 space-y-6">
  <h2 id={headingId} className="text-2xl font-semibold">{title}</h2>
  <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.title}
   className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 sm:p-6">
    <h3 className="font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-body">{item.description}</p>
   </article>)}</div>
 </section>;
}
export function MarketingCta({title}:{title:string}){
 return <section aria-labelledby="marketing-cta-heading" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-primary-subtle p-5 sm:p-8">
  <h2 id="marketing-cta-heading" className="text-2xl font-semibold">{title}</h2>
  <p className="text-body">Explore how 42 LMS can support your learners and teams.</p>
  <Link href="/request-demo" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-5 py-2 font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">See 42 LMS in action</Link>
 </section>;
}
