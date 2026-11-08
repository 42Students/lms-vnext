import { notFound } from "next/navigation";
import { UXG184AuthenticatedStatesPreview, type G184Role, type G184State } from "@/components/ux/ux-g184-authenticated-states-preview";

export const dynamic="force-dynamic";
const roles=["admin","college-admin","hr","teach","teacher"] as const;
const states=["error","loading","not-found"] as const;

/** Isolated UI-only witness. Never mints a session or reads any protected role/tenant data. */
export default async function G184RouteStateFixture({
  searchParams,
}:{
  searchParams:Promise<{role?:string;state?:string}>;
}){
  if(process.env.NODE_ENV!=="development"||process.env.UX_G184_ROUTE_STATE_FIXTURE!=="1")notFound();
  const {role,state}=await searchParams;
  if(!roles.some(value=>value===role)||!states.some(value=>value===state)||
    (role==="college-admin"&&state!=="not-found"))notFound();
  return <main className="mx-auto min-w-0 max-w-4xl space-y-6 px-4 py-8">
    <h1 className="text-xl font-semibold">Authenticated route state acceptance</h1>
    <p role="note">Development-only display of the real, role-specific route-state component.</p>
    <UXG184AuthenticatedStatesPreview role={role as G184Role} state={state as G184State}/>
  </main>;
}
