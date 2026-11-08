import { notFound } from "next/navigation";
import { MentorRouteRecoveryHarness } from "./mentor-route-recovery-harness";
export const dynamic="force-dynamic";
export default function MentorRouteRecoveryFixture(){
 if(process.env.NODE_ENV!=="development"||process.env.E2E_AUTH_ENABLED!=="true")notFound();
 return <MentorRouteRecoveryHarness/>;
}
