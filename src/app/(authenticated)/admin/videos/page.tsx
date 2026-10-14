import { SuperAdminContentDirectoryPage } from "@/components/courses/super-admin-content-directory-page";
export default function SuperAdminVideosPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 return <SuperAdminContentDirectoryPage kind="VIDEOS" searchParams={searchParams}/>;
}
