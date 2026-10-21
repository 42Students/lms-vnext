"use client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <section role="alert" className="min-w-0 space-y-4"><PageHeader title="Failed to load drives. Please try again."/><p className="text-sm text-body">Failed to load drives. Please try again. A loading error does not mean no jobs were published.</p><div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"><Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button><Link href="/learn/my-placements" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle hover:text-primary-hover sm:w-auto md:min-h-9">My Placements</Link></div></section>;}
