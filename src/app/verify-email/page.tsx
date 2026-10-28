"use client";

import {useEffect,useState} from "react";

/** Fragment-based proof: the 256-bit bearer never enters HTTP request URLs,
 * SSR logs, analytics routes or a Referer. The only network transfer is a
 * same-origin POST after the user explicitly confirms. */
export default function VerifyEmailPage(){
 const [token,setToken]=useState("");
 const [state,setState]=useState<"loading"|"ready"|"sending"|"done"|"invalid">("loading");
 useEffect(()=>{
  const hash=new URLSearchParams(window.location.hash.slice(1));
  const value=hash.get("token")??"";
  // Strip the bearer before showing any interaction or navigation.
  window.history.replaceState(null,"",window.location.pathname);
  if(/^[a-zA-Z0-9_-]{43}$/.test(value)){setToken(value);setState("ready");}
  else setState("invalid");
 },[]);
 async function confirm(){
  if(state!=="ready"||!token)return;
  setState("sending");
  try{
   const result=await fetch("/api/auth/email-ownership/redeem",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token}),
    cache:"no-store",redirect:"error",
   });
   const data:unknown=await result.json();
   const success=result.ok&&typeof data==="object"&&data!==null&&
    "verified" in data&&(data as {verified:unknown}).verified===true;
   setState(success?"done":"invalid");
  }catch{setState("invalid");}
  finally{setToken("");}
 }
 return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-5 px-6 py-12">
  <h1 className="text-2xl font-semibold">Verify your email</h1>
  {state==="loading"?<p>Checking your link…</p>:null}
  {state==="ready"?<>
   <p>Confirm that this email address belongs to your signed-in college account. This link is valid for 24 hours and can be used only once.</p>
   <button className="rounded-md bg-slate-900 px-4 py-3 font-medium text-white"
    onClick={confirm}>Confirm email ownership</button>
  </>:null}
  {state==="sending"?<p role="status">Verifying…</p>:null}
  {state==="done"?<p role="status">Email ownership verified. You may return to your account.</p>:null}
  {state==="invalid"?<p role="alert">This link is invalid, expired or unavailable for the current account. Sign in to the correct college workspace and request another link.</p>:null}
 </main>;
}
