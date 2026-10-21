import Link from "next/link";
import {
  COLLEGE_ADMIN_QUICK_ACTIONS,
  COLLEGE_ADMIN_SETUP_PHASES,
  COLLEGE_SETUP_GUIDE_COPY,
  SUPER_ADMIN_GLOBAL_LINKS,
  SUPER_ADMIN_COLLEGE_LINKS,
  SUPER_ADMIN_COLLEGE_QUICK_ACTIONS,
} from "@/modules/admin-ui/admin-dashboard-navigation";

/** Legacy admin dashboard quick actions use this LMS icon/color palette. The
 * small SVGs are local so neither a new dependency nor an icon font is needed. */
const ACTION_COLORS = {
  slate: "#1e363f",
  teal: "#26bac7",
  blueSlate: "#266891",
  blue: "#3b87ad",
  muted: "#54505d",
} as const;

function accentFor(label:string):string{
  const name=label.toLowerCase();
  if(name.includes("course")||name.includes("job")||name.includes("assignment"))return ACTION_COLORS.teal;
  if(name.includes("program")||name.includes("quiz")||name.includes("hire")||name.includes("hiring"))return ACTION_COLORS.blueSlate;
  if(name.includes("student")||name.includes("people")||name.includes("faculty"))return ACTION_COLORS.blue;
  if(name.includes("recruit")||name.includes("college"))return ACTION_COLORS.muted;
  return ACTION_COLORS.slate;
}

function ActionGlyph({name}:{name:string}){
  const value=name.toLowerCase();
  const kind=value.includes("calendar")||value.includes("semester")||value.includes("attendance")
    ? "calendar" : value.includes("course")||value.includes("lesson")||value.includes("program")||value.includes("quiz")
    ? "book" : value.includes("job")||value.includes("hire")||value.includes("placement")
    ? "briefcase" : value.includes("people")||value.includes("recruit")||value.includes("student")||value.includes("faculty")||value.includes("team")
    ? "people" : value.includes("log")||value.includes("audit")||value.includes("report")
    ? "list" : value.includes("feature")||value.includes("setting")||value.includes("control")
    ? "controls" : value.includes("tenant")||value.includes("college")||value.includes("department")
    ? "building" : "list";
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
    width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==="calendar" ? <>
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M7 3v4M17 3v4M3 10h18M8 15h3M14 15h2"/>
    </> : kind==="book" ? <>
      <path d="M12 6C9 4 5 4 3 5v14c4-1 6-1 9 1 3-2 5-2 9-1V5c-2-1-6-1-9 1ZM12 6v14"/>
    </> : kind==="briefcase" ? <>
      <rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18M10 12v3h4v-3"/>
    </> : kind==="people" ? <>
      <circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3ZM17 5a3 3 0 0 1 0 6M19 20h2v-2a6 6 0 0 0-4-5.65"/>
    </> : kind==="controls" ? <>
      <path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/><circle cx="10" cy="18" r="2" fill="white"/>
    </> : kind==="building" ? <>
      <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/>
    </> : <>
      <path d="M8 5h12M8 11h12M8 17h12M4 5h.01M4 11h.01M4 17h.01"/>
    </>}
  </svg>;
}

function ActionArrow(){
  return <svg viewBox="0 0 24 24" width="17" height="17" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>;
}

function ActionLink({
  label, href, subtitle, mode="quick", number,
}: {
  label: string;
  href: string | null;
  subtitle?: string;
  mode?: "quick" | "global" | "setup";
  number?:number;
}) {
  const color=accentFor(label);
  const content=mode==="setup" ? <>
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-text">{number}</span>
    <span className="min-w-0 flex-1">
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="shrink-0" style={{color}}><ActionGlyph name={label}/></span>{label}
      </span>
      {subtitle ? <span className="mt-1 block text-xs text-muted-foreground">{subtitle}</span> : null}
    </span>
    <span className="shrink-0 text-muted-foreground"><ActionArrow/></span>
  </> : mode==="global" ? <>
    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-subtle" style={{color}}>
      <ActionGlyph name={label}/>
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-base font-semibold text-foreground">{label}</span>
      <span className="mt-1 block text-sm text-body">{subtitle ?? "Open this workspace"}</span>
    </span>
    <span className="shrink-0 text-muted-foreground"><ActionArrow/></span>
  </> : <>
    <span className="flex shrink-0 items-center justify-center" style={{color}}>
      <ActionGlyph name={label}/>
    </span>
    <span className="min-w-0 text-sm font-semibold text-foreground">{label}</span>
    {subtitle ? <span className="min-w-0 text-xs text-muted-foreground">{subtitle}</span> : null}
  </>;
  const classes=mode==="quick"
    ? "flex min-h-24 min-w-0 items-center gap-3 rounded-[8px] border border-border bg-surface p-4 text-left transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 sm:flex-col sm:justify-center sm:p-6 sm:text-center"
    : mode==="setup"
    ? "flex min-h-20 min-w-0 items-center gap-3 rounded-[8px] border border-border bg-surface p-4 transition-[border-color,box-shadow] duration-150 hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
    : "flex min-h-28 min-w-0 items-center gap-4 rounded-[8px] border border-border bg-surface p-5 transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-px hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2";
  if (!href) {
    return <div aria-disabled="true" className={classes+" cursor-not-allowed opacity-60"}>
      {content}
    </div>;
  }
  return <Link href={href} className={classes}>{content}</Link>;
}

/** The sidebar's /college landing and the cross-role /dashboard use the same legacy actions. */
export function CollegeAdminQuickActions() {
  return <section aria-label="Quick Actions" className="space-y-3">
    <h2 className="m-0 text-lg font-semibold text-foreground">Quick Actions</h2>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {COLLEGE_ADMIN_QUICK_ACTIONS.map(item=>(
        <ActionLink key={item.key} label={item.label} href={item.href}/>
      ))}
    </div>
  </section>;
}

export function CollegeAdminDashboardActions() {
  return <div className="space-y-6">
    <CollegeAdminQuickActions/>
    <details className="min-w-0 space-y-4 border-t border-border pt-4">
      <summary className="flex min-h-11 cursor-pointer items-center text-lg font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        {COLLEGE_SETUP_GUIDE_COPY.collapseLabel}
      </summary>
      <section aria-label="Setup Guide" className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-foreground">{COLLEGE_SETUP_GUIDE_COPY.heading}</h2>
        <p className="text-sm text-body">{COLLEGE_SETUP_GUIDE_COPY.intro}</p>
        {COLLEGE_ADMIN_SETUP_PHASES.map((phase,phaseIndex)=>(
          <section key={phase.title} className="space-y-3 border-b border-border pb-5" aria-label={phase.title}>
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-text">
                {phaseIndex+1}
              </span>
              <h3 className="m-0 text-base font-semibold text-foreground">{phase.title}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {phase.steps.map((step,stepIndex)=>(
                <ActionLink key={step.key} label={step.label} href={step.href}
                  subtitle={step.desc} mode="setup"
                  number={COLLEGE_ADMIN_SETUP_PHASES.slice(0,phaseIndex).reduce((sum,entry)=>sum+entry.steps.length,0)+stepIndex+1}/>
              ))}
            </div>
          </section>
        ))}
      </section>
    </details>
  </div>;
}

/** Keep this separate: the legacy Super Admin dashboard had no setup guide. */
export function SuperAdminGlobalDashboardActions() {
  return <section aria-label="Platform quick links" className="space-y-4">
    <header className="space-y-2">
      <p className="m-0 text-xs font-bold uppercase tracking-wider text-primary-text">Platform operations</p>
      <h2 className="m-0 text-xl font-semibold text-foreground">Choose the level you need to operate at.</h2>
      <p className="m-0 text-sm text-body">
        Start with a platform-wide control below, or select a college in the header to switch this dashboard into that college&apos;s operational view.
      </p>
    </header>
    <div className="grid gap-4 sm:grid-cols-2">
      {SUPER_ADMIN_GLOBAL_LINKS.map(item=>(
        <ActionLink key={item.label} label={item.label} href={item.href} subtitle={item.subtitle} mode="global"/>
      ))}
    </div>
    <p className="flex items-start gap-3 border-t border-border pt-4 text-sm text-body">
      <span className="shrink-0 text-primary-text"><ActionGlyph name="College"/></span>
      <span>Select a college in the header to see live college totals, issues needing attention, and college-scoped shortcuts.</span>
    </p>
  </section>;
}

/** College selection scopes actions; never replace it with a separate role workspace. */
export function SuperAdminCollegeDashboardActions() {
  return <section aria-label="Selected college quick actions" className="space-y-3">
    <h2 className="m-0 text-lg font-semibold text-foreground">Quick Actions</h2>
    <p className="text-sm text-body">These pages enforce the college selected in the Super Admin scope selector.</p>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {SUPER_ADMIN_COLLEGE_QUICK_ACTIONS.map(item=>(
        <ActionLink key={"quick:"+item.label} label={item.label} href={item.href}/>
      ))}
    </div>
    <details className="min-w-0 border-t border-border pt-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        Other college workspaces
      </summary>
      <div className="grid min-w-0 gap-4 pt-3 sm:grid-cols-2 md:grid-cols-3">
        {SUPER_ADMIN_COLLEGE_LINKS.map(item=>(
          <ActionLink key={item.label} label={item.label} href={item.href}/>
        ))}
      </div>
    </details>
  </section>;
}
