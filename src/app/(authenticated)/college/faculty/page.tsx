import { CollegeRoleDirectoryWorkspace } from "@/components/college/college-role-directory-workspace";

export default function CollegeFacultyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CollegeRoleDirectoryWorkspace kind="FACULTY" searchParams={searchParams} />;
}
