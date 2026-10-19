"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}){return <section role="alert" className="space-y-3"><h2 className="font-semibold">Drive messages unavailable</h2><p className="text-sm text-body">Could not load this employer conversation.</p><Button type="button" variant="secondary" onClick={reset}>Retry</Button></section>;}
