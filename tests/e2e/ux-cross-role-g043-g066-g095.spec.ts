import {test,expect} from "@playwright/test";
import {mkdir} from "node:fs/promises";

const groups=[
 {group:"college",nav:"College onboarding",heading:"Import students",fallback:"/college/students",error:"Student importer unavailable"},
 {group:"learner",nav:"Learner verification",heading:"Verification status unavailable",fallback:"/learn/profile",error:"Verification status unavailable"},
 {group:"faculty",nav:"Faculty profile",heading:"Unable to load your profile",fallback:"/teacher/courses",error:"Unable to load your profile"},
] as const;
for(const group of groups)for(const viewport of [
 {label:"desktop",width:1280,height:800},{label:"mobile",width:390,height:844},
] as const){
 test(`${group.group} recovery + loading at ${viewport.label}`,async({page},testInfo)=>{
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  const pageErrors:string[]=[];page.on("pageerror",e=>pageErrors.push(e.message));
  await page.goto("/ux-cross-role-proof-preview");
  const nav=page.getByRole("navigation",{name:"Select acceptance surface"});
  await nav.getByRole("button",{name:group.nav}).click();
  await page.getByRole("button",{name:"Show error recovery"}).click();
  await expect(page.getByText(group.error,{exact:true}).first()).toBeVisible();
  const retry=page.getByRole("button",{name:"Retry",exact:true});
  await retry.focus();await expect(retry).toBeFocused();
  await retry.click();
  await expect(page.getByText("Retry invoked: 1")).toBeVisible();
  await expect(page.locator(`a[href="${group.fallback}"]`).first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const png=await page.screenshot({path:`ux-cross-role-evidence/${group.group}-${viewport.label}.png`,fullPage:false});
  await testInfo.attach(`${group.group}-${viewport.label}.png`,{body:png,contentType:"image/png"});
  await page.getByRole("button",{name:"Show loading"}).click();
  await expect(page.locator('[data-slot="graceful-page-loading"]')).toBeVisible();
  expect(pageErrors).toEqual([]);
 });
}
