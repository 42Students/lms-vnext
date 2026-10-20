"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function ClassWorkspaceError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4" role="alert"><PageHeader title="Could not load workspace creator" /><p className="text-sm text-muted-foreground">The class and Project templates could not be loaded. Retry, or return to Projects.</p><Button type="button" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button></div>}