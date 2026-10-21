import { useEffect } from "react";
import { useRouter } from "next/router";
import { Skeleton } from "antd";
import AdminLayout from "@/layouts/AdminLayout";

/** Hidden with the Student Groups list (see pages/college-admin/student-groups.js); old links land on People. */
export default function AdminStudentGroupDetailHidden() {
  const router = useRouter();
  useEffect(() => {
    if (router.isReady) router.replace("/college-admin/people");
  }, [router, router.isReady]);
  return <div className="ln-module"><Skeleton active paragraph={{ rows: 4 }} /></div>;
}

AdminStudentGroupDetailHidden.adminLayout = AdminLayout;
