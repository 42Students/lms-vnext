import type {ReactNode} from "react";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeDrivesMemory} from "@/components/placements/college-drives-last-good";

export default async function CollegeDrivesLayout({children}:{children:ReactNode}){
 const ctx=await getCurrentRequestContext();
 const membershipScope=[ctx.user.id,ctx.membership?.id??"NO_COLLEGE"].join(":");
 return <CollegeDrivesMemory key={membershipScope}>{children}</CollegeDrivesMemory>;
}
