import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import DriveFormPage from "@/components/tpo/DriveFormPage";
import { appAction } from "@/redux/store";

export default function TpoEditDrive() {
  const router = useRouter();
  const dispatch = useDispatch();
  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);
  if (!router.isReady) return null;
  return <DriveFormPage key={router.query.jobId} editId={router.query.jobId} />;
}
