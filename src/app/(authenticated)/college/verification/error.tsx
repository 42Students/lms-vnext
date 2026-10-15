"use client";
import {useEffect} from "react";
export default function Error({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("Verification queue failed",error.name);},[error]);
 return <section role="alert" className="space-y-3 p-4"><h1 className="text-xl font-semibold">Verification unavailable</h1>
 <p>Requests could not be loaded. No verification decisions were made.</p>
 <button type="button" onClick={reset} className="rounded-md border px-4 py-2">Retry</button></section>;
}
