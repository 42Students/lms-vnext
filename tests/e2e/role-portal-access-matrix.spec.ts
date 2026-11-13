import {expect,test,type BrowserContext} from "@playwright/test";
import {authenticateGracefulRole,type GracefulRole} from "./support/roles";

/** #61/#101: exercise actual Next.js parent layouts, not only shell data.
 * The source-level matrix independently enumerates EVERY registered page;
 * this bounded browser sweep proves the role and alias route decisions are
 * actually enforced on HTTP navigation with seeded session cookies.
 */
const base="http://localhost:3000";
const cases:readonly {
  role:GracefulRole;
  allowed:string;
  foreignAlias:string;
  expectedHomePrefix:string;
}[]=[
  {role:"learner",allowed:"/learn/profile",foreignAlias:"/college-admin/students",expectedHomePrefix:"/learn/"},
  {role:"faculty",allowed:"/teacher/profile",foreignAlias:"/superadmin/dashboard",expectedHomePrefix:"/teacher/"},
  {role:"mentor",allowed:"/mentor/projects",foreignAlias:"/superadmin/dashboard",expectedHomePrefix:"/mentor/"},
  {role:"tpo",allowed:"/tpo/home",foreignAlias:"/college-admin/students",expectedHomePrefix:"/tpo/"},
  {role:"college",allowed:"/college",foreignAlias:"/superadmin/dashboard",expectedHomePrefix:"/college"},
  {role:"recruiter",allowed:"/hr/home",foreignAlias:"/college-admin/students",expectedHomePrefix:"/hr/"},
  {role:"superadmin",allowed:"/admin/tenants",foreignAlias:"/college-admin/students",expectedHomePrefix:"/admin/"},
];

async function signedInRole(context:BrowserContext,role:GracefulRole){
  await authenticateGracefulRole(context,role);
  // The shared graceful fixture sets explicit role for faculty/TPO/mentor.
  // Legacy singleton fixtures still need an exact role cookie for this suite.
  const singleton=role==="learner"?"LEARNER":
    role==="college"?"COLLEGE_ADMIN":null;
  if(singleton){
    await context.addCookies([{name:"lms_role",value:singleton,
      url:base,httpOnly:true,sameSite:"Lax"}]);
  }
}

test.describe("SEC role-to-portal browser matrix",()=>{
  test.skip(!process.env.E2E_AUTH_SECRET,"Requires disposable seeded E2E app and auth secret");

  for(const {role,allowed,foreignAlias,expectedHomePrefix} of cases){
    test(`${role}: own portal accessible; foreign legacy alias denied`,async({page,context})=>{
      await signedInRole(context,role);
      const own=await page.goto(allowed,{waitUntil:"domcontentloaded"});
      expect(own).not.toBeNull();
      await expect(page).toHaveURL(new RegExp(allowed.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
      await expect(page.getByText("Access denied",{exact:true})).toHaveCount(0);
      const attempted=await page.goto(foreignAlias,{waitUntil:"domcontentloaded"});
      expect(attempted).not.toBeNull();
      // An alias may redirect to the caller's own workspace or render an
      // explicit access-denied panel; it must never render foreign content.
      const url=new URL(page.url());
      const inOwnPortal=url.pathname.startsWith(expectedHomePrefix);
      const denied=await page.getByText(/access denied|not authorized/i).count()>0;
      expect(inOwnPortal||denied,
        `${role} must be denied ${foreignAlias}; reached ${url.pathname}`).toBe(true);
      expect(url.pathname.startsWith(foreignAlias)).toBe(false);
    });
  }
});
