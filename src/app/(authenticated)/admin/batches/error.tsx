"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <ErrorState title="Could not load batches" description="No data was loaded; refresh the selected scope or retry." action={<Button onClick={reset}>Retry</Button>}/>;}