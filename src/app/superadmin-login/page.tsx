import { redirect } from "next/navigation";

/** Legacy Super Admin bookmark: the shared sign-in handles privileged second factor. */
export default function LegacySuperAdminLoginPage() {
  redirect("/login?legacy=superadmin");
}
