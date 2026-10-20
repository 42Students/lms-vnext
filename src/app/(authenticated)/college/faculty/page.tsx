import { CollegeRoleDirectoryWorkspace } from "@/components/college/college-role-directory-workspace";

export default function CollegeFacultyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <div className="min-w-0 max-w-full space-y-6"><CollegeRoleDirectoryWorkspace kind="FACULTY" searchParams={searchParams} /></div>;
}
