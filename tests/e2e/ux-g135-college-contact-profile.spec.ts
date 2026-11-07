import { expect, test } from "@playwright/test";
test.describe("UX-G135 college contact profile draft recovery",()=>{
 for(const width of [390,1280]){
  test("cancel and confirm discard at "+width+"px",async ({page},info)=>{
   await page.setViewportSize({width,height:800});
   await page.goto("/e2e/ux-g135-contact-profile");
   const name=page.getByRole("textbox",{name:"Public college display name"});
   const email=page.getByRole("textbox",{name:"Support email"});
   const reset=page.getByRole("button",{name:"Reset"});
   await expect(reset).toBeDisabled();
   await name.fill("Changed College");
   await email.fill("new@example.edu");
   await expect(page.getByRole("status").filter({hasText:"Unsaved changes"})).toBeVisible();
   await reset.click();
   const confirmation=page.getByRole("alertdialog",{name:"Discard unsaved contact changes?"});
   await expect(confirmation).toBeVisible();
   await confirmation.getByRole("button",{name:"Cancel"}).click();
   await expect(name).toHaveValue("Changed College");
   await reset.click();
   await confirmation.getByRole("button",{name:"Discard changes"}).click();
   await expect(name).toHaveValue("Example College");
   await expect(email).toHaveValue("help@example.edu");
   await expect(reset).toBeDisabled();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
   await page.screenshot({path:info.outputPath("discard-"+width+".png"),fullPage:true});
  });
  test("blocks invalid email and non-HTTPS policy URLs at "+width+"px",async ({page})=>{
   await page.setViewportSize({width,height:800});
   let writes=0;
   await page.route("**/api/colleges/contact-profile",async route=>{
    writes++; await route.fulfill({status:200,contentType:"application/json",body:"{}"});
   });
   await page.goto("/e2e/ux-g135-contact-profile");
   const email=page.getByRole("textbox",{name:"Support email"});
   const terms=page.getByRole("textbox",{name:"Terms of use URL (HTTPS)"});
   await email.fill("invalid-email");
   await page.getByRole("button",{name:"Confirm and save changes"}).click();
   expect(await email.evaluate((el:HTMLInputElement)=>el.checkValidity())).toBe(false);
   await email.fill("valid@example.edu");
   await terms.fill("http://example.edu/unsafe");
   await page.getByRole("button",{name:"Confirm and save changes"}).click();
   expect(await terms.evaluate((el:HTMLInputElement)=>el.checkValidity())).toBe(false);
   await expect(page.getByRole("alertdialog",{name:"Update college contact profile?"})).toHaveCount(0);
   expect(writes).toBe(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
  });
  test("save review, stale refusal and success at "+width+"px",async ({page},info)=>{
   await page.setViewportSize({width,height:800});
   let writes=0;
   await page.route("**/api/colleges/contact-profile",async route=>{
    writes++;
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toMatchObject({collegeName:"Updated College",expectedVersion:7,confirm:true});
    const body=writes===1?{error:"COLLEGE_PROFILE_STALE"}:{profile:{
      collegeName:"Updated College",supportEmail:"help@example.edu",supportPhone:"+91 98765 43210",
      termsUrl:"https://example.edu/terms",privacyUrl:"https://example.edu/privacy",version:8,
    }};
    await route.fulfill({status:writes===1?409:200,contentType:"application/json",body:JSON.stringify(body)});
   });
   await page.goto("/e2e/ux-g135-contact-profile");
   const name=page.getByRole("textbox",{name:"Public college display name"});
   await name.fill("Updated College");
   await page.getByRole("button",{name:"Confirm and save changes"}).click();
   const dialog=page.getByRole("alertdialog",{name:"Update college contact profile?"});
   await expect(dialog).toBeVisible();
   expect(writes).toBe(0);
   await dialog.getByRole("button",{name:"Cancel"}).click();
   await expect(name).toHaveValue("Updated College");
   await page.getByRole("button",{name:"Confirm and save changes"}).click();
   await dialog.getByRole("button",{name:"Save changes"}).click();
   await expect(page.getByRole("alert")).toContainText("These details changed in another session.");
   await expect(name).toHaveValue("Updated College");
   await page.getByRole("button",{name:"Confirm and save changes"}).click();
   await dialog.getByRole("button",{name:"Save changes"}).click();
   await expect(page.getByRole("status").filter({hasText:"College contact profile updated."})).toBeVisible();
   expect(writes).toBe(2);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
   await page.screenshot({path:info.outputPath("saved-"+width+".png"),fullPage:true});
  });
 }
});
