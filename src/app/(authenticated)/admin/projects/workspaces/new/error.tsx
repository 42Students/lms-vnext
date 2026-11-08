"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";
export default function ClassWorkspaceError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4" role="alert"><PageHeader title="Could not load workspace creator" /><p className="text-sm text-muted-foreground">The class and Project templates could not be loaded. Retry, or return to Projects.</p><Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={reset}>Retry</Button><ButtonLink href="/admin/projects" variant="secondary" className="min-h-11 w-full sm:w-auto">Back to projects</ButtonLink></div>}