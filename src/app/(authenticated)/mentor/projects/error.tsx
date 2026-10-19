"use client";
export default function MentorProjectsError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <section role="alert" className="space-y-3 border-b border-border pb-4"><h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Projects could not be loaded</h1><p className="text-sm text-body">Check your connection and try again. This does not mean Projects is disabled.</p><button type="button" onClick={reset} className="min-h-11 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Retry</button></section>;
}
