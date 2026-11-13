import { notFound } from "next/navigation";
import { MentorRouteRecoveryHarness } from "./mentor-route-recovery-harness";
import { featureReady } from "@/config/features";
export const dynamic="force-dynamic";
export default function MentorRouteRecoveryFixture(){
 if(process.env.NODE_ENV!=="development"||!featureReady("e2eAuth"))notFound();
 return <MentorRouteRecoveryHarness/>;
}
