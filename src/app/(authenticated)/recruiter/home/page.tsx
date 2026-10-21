import HrHome from "@/app/(authenticated)/hr/home/page";
/** Preserve /recruiter/home while forwarding the selected recruiter college. */
export default function RecruiterHome({searchParams}:{
 searchParams:Promise<{collegeId?:string|string[]}>
}){return <HrHome searchParams={searchParams}/>;}
