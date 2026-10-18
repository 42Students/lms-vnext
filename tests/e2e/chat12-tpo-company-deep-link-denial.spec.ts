import {expect,test} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

/**
 * TPO-companies-05 and TPO-students-43 deny role-less deep links before
 * resolving supplied UUIDs, including when a bookmark points to an
 * archived company or private contact log.
 * Requires authenticated disposable E2E roles, no production data.
 */
const enabled=Boolean(process.env.E2E_AUTH_SECRET)&&process.env.E2E_AUTH_ENABLED==="true";
const COMPANY="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const routes=[
 "/tpo/students",
 "/tpo/companies?directory=1",
 "/tpo/companies/archived",
 `/tpo/companies/${COMPANY}`,
 `/tpo/companies/${COMPANY}/contact-log`,
 `/tpo/companies/${COMPANY}/feedback`,
 `/tpo/companies/${COMPANY}/manage`,
 `/tpo/companies/${COMPANY}/people`,
];
test.describe("PROJ-BREAK-TPO-E2E-09 unauthorized company and student deep links",()=>{
 test.skip(!enabled,"Requires disposable authenticated learner fixture.");
 for(const route of routes){
  test(`TPO-companies-05 learner never enters protected route ${route}`,async({page,context})=>{
   await authenticateGracefulRole(context,"learner");
   await page.goto(route);
   await expect(page).not.toHaveURL(/\/tpo(?:\/|$)/);
   await expect(page.getByText("Private company placement team message")).toHaveCount(0);
  });
 }
});
