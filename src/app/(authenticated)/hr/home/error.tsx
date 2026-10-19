"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error;reset:()=>void}){return <Alert tone="error" className="space-y-3"><h2 className="font-semibold">We couldn&apos;t load your account</h2><p className="mt-2 text-sm text-body">Your drive information has not been changed. Check your connection and try again.</p><Button type="button" onClick={reset}>Retry</Button></Alert>;}
