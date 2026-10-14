import { SuperAdminContentDirectoryPage } from "@/components/courses/super-admin-content-directory-page";
export default function SuperAdminLiveClassesPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 return <SuperAdminContentDirectoryPage kind="LIVE_CLASSES" searchParams={searchParams}/>;
}
