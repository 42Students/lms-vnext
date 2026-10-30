import {describe,it,expect} from "vitest";
import {facultyProfileDocumentStorageReady} from "@/modules/people/faculty-profile-readiness";
import {closeDatabaseConnection} from "@/db/client";
if(!process.env.TEST_DATABASE_URL)
 throw new Error("Faculty profile acceptance requires disposable TEST_DATABASE_URL");
describe("Faculty Profile real registered migration gate",()=>{
 it("requires both correct native private document and CAS version columns",async()=>{
  try{
   expect(await facultyProfileDocumentStorageReady()).toBe(true);
  }finally{
   await closeDatabaseConnection();
  }
 });
});
