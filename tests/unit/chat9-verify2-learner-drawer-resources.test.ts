import {describe,expect,it,vi,beforeEach} from "vitest";
import {GET} from "@/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/resources/route";

const mock=vi.hoisted(()=>({
 context:vi.fn(),resources:vi.fn(),materials:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mock.context}));
vi.mock("@/modules/courses/learner-assignment-materials-service",()=>({
 listOwnLearnerAssignmentResources:mock.resources,
 listOwnLearnerAssignmentMaterialLinks:mock.materials,
}));
beforeEach(()=>{
 mock.context.mockReset();mock.resources.mockReset();mock.materials.mockReset();
 mock.context.mockResolvedValue({user:{id:"learner"}});
});
describe("learner assignment drawer resources",()=>{
 it("only returns the authorized material projection with no private keys",async()=>{
  mock.resources.mockResolvedValue({available:true,items:[
   {id:"file",kind:"PDF",title:"Reading",body:null,href:null,position:0},
  ]});
  mock.materials.mockResolvedValue({available:true,links:[
   {id:"link",title:"Course notes",href:"https://example.org/notes"},
  ]});
  const response=await GET(new Request("https://lms.test/api/courses/deliveries/d/assignments/a/resources"),{
   params:Promise.resolve({deliveryId:"delivery",assignmentId:"assignment"}),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const json=await response.json();
  expect(json.resources.items[0]).toMatchObject({id:"file",href:null});
  expect(JSON.stringify(json)).not.toContain("privateObjectKey");
  expect(mock.resources).toHaveBeenCalledWith(expect.anything(),"assignment","delivery");
  expect(mock.materials).toHaveBeenCalledWith(expect.anything(),"assignment","delivery");
 });
});
