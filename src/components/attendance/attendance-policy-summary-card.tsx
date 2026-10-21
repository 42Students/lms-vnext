import Link from "next/link";
import {StatusBadge} from "@/components/ui/status-badge";

/** Small legacy read-only policy card on the Attendance landing screen. */
export function AttendancePolicySummaryCard({
 correctionWindowHours,eligibilityThresholdPercent,hasCollegeOverride,retryHref,settingsHref,
}:{
 correctionWindowHours:number;eligibilityThresholdPercent:number;
 hasCollegeOverride:boolean|null;retryHref:string;settingsHref?:string;
}){
 return <section aria-label="Attendance policy" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">Attendance policy</h2>
   <div className="flex flex-wrap items-center gap-2">
    <StatusBadge tone="neutral">Read-only</StatusBadge>
    <StatusBadge tone={hasCollegeOverride===true?"info":"neutral"}>
     {hasCollegeOverride===null?"Source unavailable":hasCollegeOverride?"Custom":"Default"}
    </StatusBadge>
   </div>
  </div>
  <dl className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
   <div className="min-w-0 space-y-1">
    <dt className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">
     Late marking allowed for
     <span title="Hours after a class ends during which authorized staff may correct attendance." className="ml-1 cursor-help" aria-label="Correction window help">ⓘ</span>
    </dt>
    <dd className="font-semibold text-body">{correctionWindowHours} hours</dd>
   </div>
   <div className="min-w-0 space-y-1">
    <dt className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">
     Minimum attendance
     <span title="The percentage below which an enrolled learner is flagged in attendance summaries." className="ml-1 cursor-help" aria-label="Minimum attendance help">ⓘ</span>
    </dt>
    <dd className="font-semibold text-body">{eligibilityThresholdPercent}%</dd>
   </div>
  </dl>
  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
   {hasCollegeOverride===null?<Link href={retryHref} className="font-semibold text-primary-text underline" aria-label="Reload attendance policy">Reload policy</Link>:null}
   {settingsHref?<Link href={settingsHref} className="font-semibold text-primary-text underline">Attendance policy settings</Link>:null}
  </div>
 </section>;
}
