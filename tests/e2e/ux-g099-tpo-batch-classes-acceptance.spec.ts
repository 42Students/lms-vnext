import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

test.skip(!process.env.E2E_AUTH_SECRET,"Authenticated browser E2E requires the disposable E2E identity harness");

test("UX-G099 TPO reviews and persists a class decision on desktop and mobile",async({page,context},info)=>{
  test.setTimeout(120_000);
  await authenticateGracefulRole(context,"tpo");
  await page.setViewportSize({width:1280,height:800});
  await page.goto("/tpo/batches?q=E2E%202026%20Intake");
  const batchLink=page.getByRole("link",{name:"E2E 2026 Intake",exact:true}).first();
  await expect(batchLink).toBeVisible();
  await batchLink.click();
  await page.getByRole("link",{name:"Review classes, exceptions and history"}).click();
  await expect(page.getByRole("heading",{level:1,name:/E2E 2026 Intake/})).toBeVisible();
  await page.getByRole("link",{name:"Classes",exact:true}).click();
  await expect(page.getByRole("heading",{level:1,name:"Classes · E2E 2026 Intake"})).toBeVisible();

  const classCard=page.getByRole("heading",{level:2,name:"E2E Section A"}).locator("xpath=ancestor::section[1]");
  await expect(classCard).toContainText("1 student");
  await classCard.getByRole("combobox",{name:"Who is in"}).selectOption("INELIGIBLE");
  await classCard.getByRole("textbox",{name:"Reason"}).fill("E2E placement eligibility review");
  await classCard.getByRole("button",{name:"Save"}).click();
  const confirm=page.getByRole("alertdialog",{name:"Set this class to ineligible?"});
  const write=page.waitForResponse(response=>
    response.url().includes("/api/placements/tpo/batches/")&&
    response.url().endsWith("/decision")&&response.request().method()==="POST",
  );
  await confirm.getByRole("button",{name:"Save"}).click();
  expect((await write).ok()).toBe(true);
  await expect(classCard).toContainText(/Effective: ineligible/i);
  await expect(classCard).toContainText("E2E placement eligibility review");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const desktopCapture=await page.screenshot({fullPage:true});
  await info.attach("g099-tpo-classes-desktop",{body:desktopCapture,contentType:"image/png"});

  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await expect(page.getByRole("heading",{level:1,name:"Classes · E2E 2026 Intake"})).toBeVisible();
  await expect(classCard).toContainText(/Effective: ineligible/i);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const mobileCapture=await page.screenshot({fullPage:true});
  await info.attach("g099-tpo-classes-mobile",{body:mobileCapture,contentType:"image/png"});

  const classesHref=page.url();
  await authenticateGracefulRole(context,"learner");
  await page.goto(classesHref);
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  await expect(page.getByText("E2E placement eligibility review")).toHaveCount(0);
});
