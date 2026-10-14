import ActivityPage from "@/app/(authenticated)/activity/page";
export default function SuperAdminAuditPage(props:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){return <ActivityPage {...props}/>;}
