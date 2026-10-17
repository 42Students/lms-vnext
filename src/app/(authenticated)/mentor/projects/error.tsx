"use client";
export default function MentorProjectsError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <section role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-6"><h1 className="font-semibold text-foreground">Projects could not be loaded</h1><p className="text-sm text-body">Check your connection and try again. This does not mean Projects is disabled.</p><button type="button" onClick={reset} className="min-h-11 rounded-md border border-border px-4 text-primary-text">Retry</button></section>;
}
