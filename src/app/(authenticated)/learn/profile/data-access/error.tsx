"use client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function ProfileDataAccessError({reset}:{error:Error&{digest?:string};reset:()=>void}){return <section role="alert" className="min-w-0 space-y-4"><PageHeader title="Data-access summary unavailable"/><p className="max-w-2xl text-sm leading-6 text-body">Your academic and recorded profile activity could not be loaded. A failed read does not mean no changes exist.</p><div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center"><Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button><Link href="/learn/profile" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">Profile</Link></div></section>;}
