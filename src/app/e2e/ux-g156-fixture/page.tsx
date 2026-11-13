import {notFound} from "next/navigation";
import {UxG156FixtureClient} from "./client";
import { env } from "@/config/env";
export const dynamic="force-dynamic";
export default function UxG156Fixture(){
 if(process.env.NODE_ENV!=="development"||env.UX_G156_FIXTURE!=="1")notFound();
 return <UxG156FixtureClient/>;
}
