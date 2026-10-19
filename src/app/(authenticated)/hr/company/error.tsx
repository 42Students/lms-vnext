"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error;reset:()=>void}){return <Alert tone="error" className="space-y-3"><h2 className="font-semibold">Company & Team could not load</h2><Button type="button" onClick={reset}>Try again</Button></Alert>;}
