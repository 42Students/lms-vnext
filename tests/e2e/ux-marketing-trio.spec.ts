import {test,expect} from "@playwright/test";
import {mkdir} from "node:fs/promises";

const flows = [
 {id:"UX-G050",slug:"enterprises",path:"/enterprises",title:"Build High-Performing Workforces",
  nav:"Explore enterprise solutions",first:"Learning and hiring",firstHash:"#enterprise-workflows",
  firstTitle:"Connected learning and hiring workflows",second:"Capabilities",
  secondHash:"#enterprise-capabilities",secondTitle:"One platform for workforce capability",
  demo:true},
 {id:"UX-G052",slug:"home",path:"/home",title:"Build employable graduates. Create stronger talent pipelines.",
  nav:"Explore 42 LMS by audience",first:"See the learner journey",firstHash:"#home-journey",
  firstTitle:"Learn. Build. Demonstrate. Get hired.",second:"For Universities",
  secondHash:"/universities",secondTitle:"Develop employable graduates through learning and placements",
  demo:false},
 {id:"UX-G077",slug:"platform",path:"/platform",title:"One connected platform for learning, projects and placements.",
  nav:"Explore platform workflows",first:"Role workspaces",firstHash:"#platform-workspaces",
  firstTitle:"Every role has a purpose-built workspace",second:"Talent lifecycle",
  secondHash:"#platform-lifecycle",secondTitle:"A complete talent lifecycle",demo:true},
] as const;

for(const flow of flows)for(const viewport of [
 {name:"desktop",width:1280,height:800},{name:"mobile",width:390,height:844},
] as const){
 test(`${flow.id} ${viewport.name} public journey and recovery links`,
  async({page},testInfo)=>{
   await page.setViewportSize({width:viewport.width,height:viewport.height});
   const failures:string[]=[];
   page.on("pageerror",e=>failures.push(e.message));
   await page.goto(flow.path);
   await expect(page.getByRole("heading",{level:1,name:flow.title})).toBeVisible();
   const nav=page.getByRole("navigation",{name:flow.nav});
   await expect(nav).toBeVisible();
   const first=nav.getByRole("link",{name:flow.first});
   await expect(first).toHaveAttribute("href",flow.firstHash);
   await first.focus();
   await expect(first).toBeFocused();
   await first.click();
   await expect(page).toHaveURL(new RegExp(flow.firstHash+"$"));
   await expect(page.getByRole("heading",{name:flow.firstTitle})).toBeVisible();
   if(flow.demo){
    const second=nav.getByRole("link",{name:flow.second});
    await second.click();
    await expect(page).toHaveURL(new RegExp(flow.secondHash+"$"));
    await expect(page.getByRole("heading",{name:flow.secondTitle})).toBeVisible();
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);
   expect(failures).toEqual([]);
   await mkdir("ux-marketing-trio-evidence",{recursive:true});
   const png=await page.screenshot({path:`ux-marketing-trio-evidence/${flow.slug}-${viewport.name}.png`,fullPage:true});
   await testInfo.attach(`${flow.id}-${viewport.name}.png`,{body:png,contentType:"image/png"});
   if(flow.demo){
    const demo=nav.getByRole("link",{name:"Request a Demo"});
    await expect(demo).toHaveAttribute("href","/request-demo");
    await demo.click();
    await expect(page).toHaveURL(/\/request-demo$/);
    await expect(page.getByRole("heading",{level:1,name:"See 42 LMS in action"})).toBeVisible();
   }else{
    const second=nav.getByRole("link",{name:flow.second});
    await expect(second).toHaveAttribute("href",flow.secondHash);
    await second.click();
    await expect(page).toHaveURL(/\/universities$/);
    await expect(page.getByRole("heading",{level:1,name:flow.secondTitle})).toBeVisible();
   }
  });
}
