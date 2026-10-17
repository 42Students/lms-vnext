import Link from "next/link";
import type { ReactNode } from "react";

const primaryNav=[
 {label:"Platform",href:"/platform"},
 {label:"Universities",href:"/universities"},
 {label:"Enterprises",href:"/enterprises"},
 {label:"Request a demo",href:"/request-demo"},
] as const;
export function MarketingLayout({children}:{children:ReactNode}){
 return <div className="min-h-screen bg-background text-foreground">
  <header className="border-b border-border bg-surface">
   <nav aria-label="Public navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
    <Link href="/home" className="text-xl font-bold text-primary-text">42 LMS</Link>
    <div className="flex flex-wrap items-center gap-5">
      {primaryNav.map(item=><Link key={item.href} href={item.href}
       className="text-sm font-semibold text-body hover:text-primary-text">{item.label}</Link>)}
      <Link href="/login" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Sign in</Link>
    </div>
   </nav>
  </header>
  <main className="mx-auto max-w-6xl space-y-14 px-5 py-14">{children}</main>
  <footer className="border-t border-border bg-surface">
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
    <span>42 LMS · Talent and workforce development</span>
    <div className="flex gap-5"><Link href="/privacy-policy" className="text-primary-text">Privacy</Link>
      <Link href="/assets/static/terms-and-conditions-view.html" className="text-primary-text">Terms</Link>
      <a href="mailto:hello@42lms.com" className="text-primary-text">Contact</a></div>
   </div>
  </footer>
 </div>;
}
export function MarketingHero({eyebrow,title,description}:{eyebrow:string;title:string;description:string}){
 return <section className="space-y-5 py-12">
   <p className="text-sm font-semibold uppercase tracking-wider text-primary-text">{eyebrow}</p>
   <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
   <p className="max-w-3xl text-lg leading-8 text-body">{description}</p>
   <div className="flex flex-wrap gap-3">
    <Link href="/request-demo" className="rounded-md bg-primary px-5 py-3 font-semibold text-on-primary">Request a demo</Link>
    <Link href="/platform" className="rounded-md border border-border bg-surface px-5 py-3 font-semibold text-primary-text">Explore the platform</Link>
   </div>
 </section>;
}
export function MarketingFeatureGrid({title,items}:{title:string;items:readonly {title:string;description:string}[]}){
 return <section className="space-y-6">
  <h2 className="text-2xl font-semibold">{title}</h2>
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map(item=><article key={item.title}
   className="rounded-xl border border-border bg-surface p-6">
    <h3 className="font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-6 text-body">{item.description}</p>
   </article>)}</div>
 </section>;
}
export function MarketingCta({title}:{title:string}){
 return <section className="space-y-4 rounded-xl border border-border bg-primary-subtle p-8">
  <h2 className="text-2xl font-semibold">{title}</h2>
  <p className="text-body">Explore how 42 LMS can support your learners and teams.</p>
  <Link href="/request-demo" className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-on-primary">See 42 LMS in action</Link>
 </section>;
}
