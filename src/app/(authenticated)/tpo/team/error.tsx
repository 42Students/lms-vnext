"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function TeamError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <Alert tone="error" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5">
 <h2 className="font-semibold text-foreground">Placement team unavailable</h2>
 <p className="text-sm text-body">Team membership could not be loaded. This does not mean the team is empty.</p>
 <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
 </Alert>;
}
