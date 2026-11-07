import { expect, test } from "@playwright/test";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { authenticateGracefulRole } from "./support/roles";

test.describe("UX-G131/G162 authenticated announcement and verification acceptance", () => {
 test.skip(!process.env.E2E_AUTH_SECRET || process.env.E2E_AUTH_ENABLED!=="true",
  "Requires isolated seeded authenticated browser database");

 test("desktop announcement creation uses keyboard guard and reversible publication review",async({page,context})=>{
  await authenticateGracefulRole(context,"superadmin");
  await page.setViewportSize({width:1280,height:800});
  await page.goto("/admin/announcements");
  await expect(page.getByRole("heading",{name:"Announcements",level:1})).toBeVisible();
  await page.getByRole("button",{name:"+ Create announcement"}).click();
  const form=page.getByRole("dialog",{name:"Create announcement"});
  const title=form.getByRole("textbox",{name:"Title"});
  const message=form.getByRole("textbox",{name:"Message"});
  await expect(title).toHaveAttribute("required","");
  await expect(message).toHaveAttribute("required","");
  await title.fill("UX keyboard announcement draft");
  await message.fill("Preview before publishing. Do not publish in this browser check.");
  await expect(form.getByText(/title characters/)).toBeVisible();
  await title.press("Enter");
  const review=page.getByRole("dialog",{name:"Confirm announcement publication"});
  await expect(review).toBeVisible();
  await review.getByRole("button",{name:"Cancel"}).click();
  await expect(review).toBeHidden();
  await expect(title).toHaveValue("UX keyboard announcement draft");
  await page.screenshot({path:"test-results/ux-g131-announcements-desktop.png",fullPage:true});
 });

 test("mobile placement-cell broadcast chooser retains safe selection and search feedback",async({page,context})=>{
  await authenticateGracefulRole(context,"superadmin");
  await page.setViewportSize({width:390,height:844});
  await page.goto("/admin/announcements");
  await page.getByRole("button",{name:"New announcement",exact:true}).click();
  const modal=page.getByRole("dialog",{name:"New announcement to placement cells"});
  await expect(modal).toBeVisible();
  await modal.getByRole("radio",{name:"Some placement cells"}).check();
  await expect(modal.getByRole("button",{name:/Select matching/})).toBeVisible();
  await expect(modal.getByRole("button",{name:"Clear selection"})).toBeVisible();
  await expect(modal.getByText(/Search only changes the visible choices/)).toBeVisible();
  const search=modal.getByRole("searchbox",{name:"Pick colleges"});
  await search.fill("nonexistent-ux-test-college-42");
  await expect(modal.getByText("No placement cells match this search.")).toBeVisible();
  await expect(modal.getByRole("button",{name:/Select matching/})).toBeDisabled();
  await page.screenshot({path:"test-results/ux-g131-announcements-mobile.png",fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 });

 test("superadmin verification queue is page-scoped and responsive",async({page,context})=>{
  await authenticateGracefulRole(context,"superadmin");
  await page.setViewportSize({width:1280,height:800});
  await page.goto("/admin/colleges/"+SEED_IDS.collegeA+"/verification");
  await expect(page.getByRole("heading",{name:"Profile verification",level:1})).toBeVisible();
  await expect(page.getByRole("region",{name:"Verification queue"})).toBeVisible();
  await expect(page.getByText("Sort this page")).toBeVisible();
  await expect(page.getByText(/Sort and selections apply to this loaded page only/)).toBeVisible();
  await page.screenshot({path:"test-results/ux-g162-admin-verification-desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.screenshot({path:"test-results/ux-g162-admin-verification-mobile.png",fullPage:true});
 });

 test("TPO can reset page-only verification filters on mobile",async({page,context})=>{
  await authenticateGracefulRole(context,"tpo");
  await page.setViewportSize({width:390,height:844});
  await page.goto("/tpo/verification");
  await expect(page.getByRole("heading",{name:"Verification",level:1})).toBeVisible();
  const filters=page.getByRole("region",{name:"Verification filters"});
  await expect(filters).toBeVisible();
  const marksheets=filters.getByRole("combobox",{name:"Marksheets"});
  await marksheets.selectOption("MISSING");
  const reset=page.getByRole("button",{name:"Clear page filters"});
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(marksheets).toHaveValue("ANY");
  await expect(reset).toBeHidden();
  await page.screenshot({path:"test-results/ux-g162-tpo-verification-mobile.png",fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
 });

 test("learner cannot access announcements or protected verification queue",async({page,context})=>{
  await authenticateGracefulRole(context,"learner");
  await page.goto("/admin/announcements");
  await expect(page.getByRole("button",{name:"+ Create announcement"})).toHaveCount(0);
  await page.goto("/admin/colleges/"+SEED_IDS.collegeA+"/verification");
  await expect(page.getByRole("region",{name:"Verification queue"})).toHaveCount(0);
 });
});
