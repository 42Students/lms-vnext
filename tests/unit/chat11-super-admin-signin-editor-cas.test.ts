import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {collegeSignInMethodSchema,updateCollegeSignInSchema,signInCapabilities}
 from "@/modules/colleges/signin-methods-model";

const collegeId="11111111-1111-4111-8111-111111111111";

describe("SA-tenants-modules-LOGIN-CAS-03 successive college sign-in saves",()=>{
 it("preserves strict method selection and expected-version boundaries",()=>{
  const input={collegeId,method:"EMAIL_ONLY",expectedVersion:3};
  expect(updateCollegeSignInSchema.safeParse(input).success).toBe(true);
  expect(updateCollegeSignInSchema.safeParse({...input,method:"PHONE_AND_EMAIL"}).success).toBe(true);
  for(const invalid of ["PASSWORD_ONLY","SMS_OR_PASSWORD","TPO_ONLY",""])
   expect(collegeSignInMethodSchema.safeParse(invalid).success).toBe(false);
  expect(updateCollegeSignInSchema.safeParse({...input,expectedVersion:3.5}).success).toBe(false);
  expect(updateCollegeSignInSchema.safeParse({...input,expectedVersion:-1}).success).toBe(false);
  expect(signInCapabilities("EMAIL_ONLY").phone).toBe(false);
 });
 it("reads committed version/method from successful response before declaring a save, not stale props",()=>{
  const component=readFileSync("src/components/admin/college-signin-method-form.tsx","utf8");
  const route=readFileSync("src/app/api/admin/colleges/[collegeId]/signin/route.ts","utf8");
  const service=readFileSync("src/modules/colleges/admin-signin-policy-service.ts","utf8");
  expect(component).toContain("const [savedMethod,setSavedMethod]=useState<Method>(method)");
  expect(component).toContain("const [currentVersion,setCurrentVersion]=useState(version)");
  expect(component).toContain("selection===savedMethod");
  expect(component).toContain("expectedVersion:currentVersion");
  expect(component).toContain("const committed=response?.policy");
  expect(component).toContain("collegeSignInMethodSchema.safeParse(committed.method).success");
  expect(component).toContain("Number.isSafeInteger(committed.version)");
  expect(component).toContain("setSavedMethod(committed.method)");
  expect(component).toContain("setCurrentVersion(committed.version)");
  expect(component.indexOf("setCurrentVersion(committed.version)"))
   .toBeLessThan(component.indexOf('setMessage("Sign-in settings saved")'));
  expect(component).toContain("Could not save sign-in settings.");
  expect(route).toContain("NextResponse.json({policy}");
  expect(service).toContain("if(current?.method===input.method)");
  expect(service).toContain('new CollegeSignInPolicyError("SIGNIN_POLICY_STALE")');
 });
});
