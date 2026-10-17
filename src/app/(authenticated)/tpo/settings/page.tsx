import {TpoLegacySettingsRedirect} from "@/components/tpo/tpo-legacy-settings-redirect";
export default async function TpoSettingsIndex({searchParams}:{
 searchParams:Promise<{tab?:string|string[]}>
}){
 const params=await searchParams;
 const tab=Array.isArray(params.tab)?params.tab[0]:params.tab;
 return <TpoLegacySettingsRedirect tab={tab}/>;
}
