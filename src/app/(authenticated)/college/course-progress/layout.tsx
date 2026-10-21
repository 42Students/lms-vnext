import type {ReactNode} from "react";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeProgressMemory} from "@/components/courses/college-progress-last-good";

export default async function CollegeProgressLayout({children}:{children:ReactNode}){
 const ctx=await getCurrentRequestContext();
 // Switches of user/college membership unmount the previous in-memory report.
 const activeScope=[ctx.user.id,ctx.membership?.id??"NO_COLLEGE"].join(":");
 return <CollegeProgressMemory key={activeScope}>{children}</CollegeProgressMemory>;
}
