"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error;reset:()=>void}){return <Alert tone="error">Could not load offer evidence. <Button type="button" variant="secondary" onClick={reset}>Retry</Button></Alert>}