import { CollegeRoleDirectoryWorkspace } from "@/components/college/college-role-directory-workspace";

export default function CollegeStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CollegeRoleDirectoryWorkspace kind="LEARNER" searchParams={searchParams} />;
}
