import {notFound} from "next/navigation";
import {UxG157FixtureClient} from "./client";

import { env } from "@/config/env";
export const dynamic="force-dynamic";

/** Only a synthetic component testing fixture, never an authenticated bypass in production. */
export default function UxG157Fixture(){
 if(process.env.NODE_ENV!=="development"||env.UX_G157_FIXTURE!=="1")notFound();
 return <UxG157FixtureClient/>;
}
