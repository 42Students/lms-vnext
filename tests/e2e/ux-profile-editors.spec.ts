import {test,expect} from "@playwright/test";
import {mkdir} from "node:fs/promises";

for(const viewport of [{name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844}] as const){
 for(const actor of ["faculty","learner"] as const){
  test(`UX ${actor} profile ${viewport.name}: actual component semantics`,async({page},testInfo)=>{
   await page.setViewportSize({width:viewport.width,height:viewport.height});
   const errors:string[]=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto("/ux-profile-proof-preview");
   await expect(page.getByRole("heading",{level:1,name:"Profile editor UX acceptance"})).toBeVisible();
   await page.getByRole("button",{name:actor==="faculty"?"Faculty preview":"Learner preview"}).click();
   if(actor==="faculty"){
    await expect(page.getByRole("navigation",{name:"Profile sections"})).toBeVisible();
    const progress=page.getByRole("progressbar",{name:"Profile completeness percentage"});
    await expect(progress).toBeVisible();
    await expect(progress).toHaveAttribute("max","100");
    const addSkill=page.getByRole("button",{name:"Add skill",exact:true});
    await addSkill.click();
    await expect(page.getByRole("textbox",{name:"Skill 1"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Remove skill 1 from draft"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Save skills"})).toBeDisabled();
   }else{
    await expect(page.getByRole("heading",{name:"Profile completion checklist"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Add Skills record"})).toBeVisible();
    await page.getByRole("button",{name:"Add Skills record"}).click();
    const dialog=page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Capture fully presented content, not the translucent 250ms entrance frame.
    await expect.poll(()=>dialog.evaluate(element=>getComputedStyle(element).opacity)).toBe("1");
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
   expect(errors).toEqual([]);
   const filename=`ux-profile-evidence/${actor}-${viewport.name}.png`;
   await mkdir("ux-profile-evidence",{recursive:true});
   const png=await page.screenshot({path:filename,fullPage:false});
   await testInfo.attach(filename,{body:png,contentType:"image/png"});
  });
 }
}
