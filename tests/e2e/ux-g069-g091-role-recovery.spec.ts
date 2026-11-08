import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const viewports=[
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;
const id="11111111-1111-4111-8111-111111111111";
async function navigate(page:import("@playwright/test").Page,path:string){
  try{await page.goto(path,{waitUntil:"domcontentloaded"});}
  catch(error){if(!String(error).includes("net::ERR_ABORTED"))throw error;}
}
test.describe("UX-G069 and UX-G091 seeded, authorized route journeys",()=>{
  test.skip(process.env.UX_G069_G091_SEED!=="true","Needs isolated PostgreSQL and synthetic role memberships");
  for(const vp of viewports){
    test("G069 "+vp.name+" Mentor calendar invalid filter shows usable recovery",async({page,context},info)=>{
      await authenticateGracefulRole(context,"mentor");
      await page.setViewportSize(vp);
      await page.goto("/mentor/calendar?status=NOT_A_STATUS");
      const invalid=page.getByRole("alert").filter({hasText:"Invalid meeting filters"});
      await expect(invalid).toBeVisible();
      await expect(invalid).toContainText("No meeting information was loaded");
      await expect(invalid.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/mentor/calendar");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath("g069-calendar-"+vp.name+".png"),fullPage:true});
    });
    test("G069 "+vp.name+" Mentor legacy bookmark stays in Mentor role",async({page,context})=>{
      await authenticateGracefulRole(context,"mentor");
      await page.setViewportSize(vp);
      for(const path of ["/mentor/allQuizzes","/mentor/fileExplorer","/mentor/courses","/mentor/contacts/allContacts","/mentor/courses/"+id]){
        await navigate(page,path);
        await expect(page).toHaveURL(/\/mentor\/(projects|\?retry)/);
      }
    });
    test("G091 "+vp.name+" Faculty calendar and contacts bad queries recover",async({page,context},info)=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(vp);
      await page.goto("/teacher/calendar?startDate=invalid");
      const calendar=page.getByRole("alert").filter({hasText:"Invalid date"});
      await expect(calendar).toBeVisible();
      await expect(calendar).toContainText("No class schedule data was loaded");
      await expect(calendar.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/teacher/calendar");
      await page.goto("/teacher/contacts/allContacts?page=not-a-number");
      const contacts=page.getByRole("alert").filter({hasText:"Invalid directory filters"});
      await expect(contacts).toBeVisible();
      await expect(contacts).toContainText("No contact records were loaded");
      await expect(contacts.getByRole("link",{name:"Return to Contacts"})).toHaveAttribute("href","/teacher/contacts/allContacts");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath("g091-contact-"+vp.name+".png"),fullPage:true});
    });
    test("G091 "+vp.name+" malformed duplicate Faculty quiz shortcuts show all quizzes",async({page,context},info)=>{
      await authenticateGracefulRole(context,"faculty");
      await page.setViewportSize(vp);
      await page.goto("/teacher/allQuizzes?content=invalid&content="+id);
      await expect(page.getByRole("heading",{name:"My Quizzes"})).toBeVisible();
      await expect(page.getByText("That quiz shortcut is invalid; showing all your authorized quizzes instead.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Clear shortcut"})).toHaveAttribute("href","/teacher/allQuizzes");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:info.outputPath("g091-quizzes-"+vp.name+".png"),fullPage:true});
    });
  }
  test("negative: learner cannot view Mentor alias or Faculty invalid directory/calendar",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    await navigate(page,"/mentor/allQuizzes");
    await expect(page).not.toHaveURL(/\/mentor\/projects/);
    await navigate(page,"/mentor/calendar?status=NOT_A_STATUS");
    await expect(page.getByText("Invalid meeting filters")).toHaveCount(0);
    await navigate(page,"/teacher/calendar?startDate=bad");
    await expect(page.getByText("No class schedule data was loaded")).toHaveCount(0);
    await navigate(page,"/teacher/contacts/allContacts?page=bad");
    await expect(page.getByText("Invalid directory filters")).toHaveCount(0);
  });
});
