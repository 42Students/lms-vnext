import { useDispatch } from "react-redux";
import { useEffect } from "react";
import DriveFormPage from "@/components/tpo/DriveFormPage";
import { appAction } from "@/redux/store";

export default function TpoNewDrive() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);
  return <DriveFormPage />;
}
