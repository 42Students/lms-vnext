import type { Metadata } from "next";
import { MaintenanceRecovery } from "./maintenance-recovery";

export const metadata: Metadata = {
  title: "Maintenance | 42LMS",
  robots: { index: false, follow: false },
};

/** Static public recovery route; middleware remains the authority for maintenance policy. */
export default function MaintenancePage() {
  return <MaintenanceRecovery />;
}
