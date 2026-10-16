import { redirect } from "next/navigation";

const LEGACY_TABS:Record<string,string>={
 rules:"rules",jobtypes:"job-types",outcomes:"after-college",
 prep:"prep-readiness",blocked:"blocked-dates",recruiters:"recruiters",
 notices:"notices",see:"see",webpage:"public-page",branding:"branding",
 season:"season",trusted:"trusted",templates:"templates",team:"team",
};
export default async function TpoSettingsIndex({searchParams}:{
 searchParams:Promise<{tab?:string|string[]}>
}){
 const params=await searchParams;
 const key=Array.isArray(params.tab)?params.tab[0]:params.tab;
 const route=key?LEGACY_TABS[key.toLowerCase()]:null;
 redirect("/tpo/settings/"+(route??"rules"));
}
