import { expect, test } from "@playwright/test";
for(const viewport of [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const){
  test("UX-G163 "+viewport.name+" shared controls, files and modal",async({page},info)=>{
    await page.setViewportSize(viewport);
    const errors:string[]=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("/e2e/ux-kit-actions");
    const controls=page.getByRole("region",{name:"UX-G163 controls"});
    await expect(page.getByRole("img",{name:"Anjali Kumar"})).toBeVisible();
    const save=controls.getByRole("button",{name:"Save action"});
    await expect(save).toBeDisabled();
    await expect(save).toHaveAttribute("aria-busy","true");
    await controls.getByRole("button",{name:"Enable action"}).click();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(controls.getByText("Disallowed double submit")).toBeVisible();
    const searchOnly=page.locator('[data-slot="filter-bar"][aria-label="Search only"]');
    await expect(searchOnly.locator('[data-slot="drawer"]')).toHaveCount(0);
    const filtered=page.locator('[data-slot="filter-bar"][aria-label="Filters"]');
    if(viewport.name==="mobile"){
      await filtered.getByRole("button",{name:"Filters, 1 active"}).click();
      await expect(page.getByRole("dialog",{name:"Filters"})).toBeVisible();
      await page.getByRole("button",{name:"Close drawer"}).click();
      await expect(page.getByRole("dialog",{name:"Filters"})).not.toBeVisible();
    } else {
      await expect(filtered.locator('[data-slot="drawer"]')).toHaveCount(1);
    }
    const file=controls.getByLabel("Proof file");
    await file.setInputFiles({name:"bad.txt",mimeType:"text/plain",buffer:Buffer.from("x")});
    await expect(controls.getByText("This file type is not allowed.")).toBeVisible();
    await file.setInputFiles({name:"valid.pdf",mimeType:"application/pdf",buffer:Buffer.from("ok")});
    await expect(controls.getByText("Chosen file: valid.pdf")).toBeVisible();
    await controls.getByRole("button",{name:"Remove selected files"}).click();
    await expect(controls.getByText("Chosen file: None")).toBeVisible();
    await controls.getByRole("button",{name:"Delete example"}).click();
    const dialog=page.getByRole("alertdialog",{name:"Delete example?"});
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"Cancel"}).click();
    await expect(dialog).not.toBeVisible();
    await controls.getByRole("button",{name:"Delete example"}).click();
    await dialog.getByRole("button",{name:"Confirm"}).click();
    await expect(controls.getByText("Example deleted")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath("ux-g163-"+viewport.name+".png"),fullPage:true});
    expect(errors).toEqual([]);
  });
}
