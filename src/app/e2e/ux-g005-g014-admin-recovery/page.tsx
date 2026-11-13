import {notFound} from "next/navigation";
import {AdminTenRecoveryFixture} from "@/components/ux/ux-admin-ten-recovery-fixture";

import { env } from "@/config/env";
export const dynamic="force-dynamic";

/** No sensitive fixture data. Unreachable in production even if the flag is set. */
export default function AdminUxRecoveryFixturePage(){
 if(process.env.NODE_ENV!=="development" ||
    env.UX_G005_G014_FIXTURE!=="1")notFound();
 return <AdminTenRecoveryFixture/>;
}
