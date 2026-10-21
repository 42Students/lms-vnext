import { z } from "zod";
import { parseTpoImportCsvRecords } from "@/modules/placements/tpo-import-csv-parser";

/** A legacy LECTURER remains a FACULTY. An explicit MENTOR also gains MENTOR
 * membership role; never infer ADMIN/TPO from arbitrary CSV strings. */
export const facultyBulkRowSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  phoneE164: z.string().regex(/^\+91[6-9][0-9]{9}$/),
  email: z.email().optional(),
  facultyType: z.enum(["LECTURER","MENTOR"]).default("LECTURER"),
}).strict();
export type FacultyBulkRow = z.infer<typeof facultyBulkRowSchema>;

export function parseFacultyBulkCsv(source: string): FacultyBulkRow[] {
  // RFC4180 quoted/escaped fields are handled in the common parser.
  // One header plus at most 500 faculty data records are allowed.
  const rows = parseTpoImportCsvRecords(source, 501);
  if (!rows.length) throw new Error("Choose a CSV file with faculty records.");
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const headers = rows[0].map(norm);
  const known = {
    firstName: ["firstname","first","givenname"],
    lastName: ["lastname","last","surname"],
    phone: ["mobile","mobilenumber","phone","phonenumber"],
    email: ["email","emailaddress"],
    facultyType: ["facultytype","type","facultyrole"],
    department: ["department","departmentname","dept"],
  } as const;
  type Field=keyof typeof known;
  const canonical=new Map<string,Field>();
  for (const field of Object.keys(known) as Field[]) {
    for (const alias of known[field]) canonical.set(alias,field);
  }
  const seen=new Set<string>();
  const seenFields=new Set<Field>();
  for (const normalized of headers) {
    if (!normalized) continue;
    if (seen.has(normalized)) throw new Error("CSV contains duplicate column headings.");
    seen.add(normalized);
    const field=canonical.get(normalized);
    if(field){
      if(seenFields.has(field)) throw new Error("CSV contains duplicate column headings for "+field+".");
      seenFields.add(field);
    }
  }
  const lookup = (field: Field) => headers.findIndex(value=>canonical.get(value)===field);
  const positions = {
    firstName:lookup("firstName"),lastName:lookup("lastName"),
    phone:lookup("phone"),email:lookup("email"),
    facultyType:lookup("facultyType"),department:lookup("department"),
  };
  const missing=[
    positions.firstName<0?"First Name":null,
    positions.lastName<0?"Last Name":null,
    positions.phone<0?"Mobile Number":null,
  ].filter((name):name is string=>Boolean(name));
  if(missing.length){
    const found=rows[0].slice(0,25).map(value=>value.trim().slice(0,64)).join(", ");
    throw new Error("Required columns missing: "+missing.join(", ")+". Found: "+(found||"(none)"));
  }
  const data=rows.slice(1);
  if(data.length>500)throw new Error("The maximum batch size is 500 faculty.");
  if(!data.length)throw new Error("No faculty records were found.");
  const issues:string[]=[];
  const valid:FacultyBulkRow[]=[];
  const mobileRows=new Map<string,number>(),emailRows=new Map<string,number>();
  for(const [index,row] of data.entries()){
    const rowNumber=index+2;
    const field=(key:Field)=>positions[key]<0?"":(row[positions[key]]??"").trim();
    const firstName=field("firstName"),lastName=field("lastName");
    const phone=field("phone").replace(/[\s()+-]/g,"");
    const phoneE164="+91"+(phone.startsWith("91")&&phone.length===12?phone.slice(2):phone);
    const email=field("email").toLowerCase();
    const facultyType=(field("facultyType")||"LECTURER").toUpperCase();
    const department=field("department");
    const parsed=facultyBulkRowSchema.safeParse({
      firstName,lastName,phoneE164,
      facultyType,
      ...(email?{email}:{}),
    });
    if(!parsed.success){
      const errorFields=new Set(parsed.error.issues.map(issue=>String(issue.path[0]??"")));
      if(errorFields.has("phoneE164")) issues.push("Record "+rowNumber+": Invalid mobile number.");
      if(errorFields.has("email")) issues.push("Record "+rowNumber+": Invalid email address.");
      if(errorFields.has("firstName")||errorFields.has("lastName"))
        issues.push("Record "+rowNumber+": First Name and Last Name are required.");
      if(errorFields.has("facultyType"))
        issues.push("Record "+rowNumber+": Faculty Type must be LECTURER or MENTOR.");
      continue;
    }
    if(department){
      // A name-only department cannot be safely bound to a tenant UUID.
      // Do not create the person then silently skip its academic assignment.
      issues.push("Record "+rowNumber+": Department import requires verified department mapping. Use the faculty assignment workflow.");
      continue;
    }
    const duplicateMobile=mobileRows.get(phoneE164);
    const duplicateEmail=email?emailRows.get(email):undefined;
    if(duplicateMobile!==undefined)
      issues.push("Record "+rowNumber+": Duplicate mobile in file (record "+duplicateMobile+").");
    if(duplicateEmail!==undefined)
      issues.push("Record "+rowNumber+": Duplicate email in file (record "+duplicateEmail+").");
    if(duplicateMobile!==undefined||duplicateEmail!==undefined)continue;
    mobileRows.set(phoneE164,rowNumber);
    if(email)emailRows.set(email,rowNumber);
    valid.push(parsed.data);
  }
  if(issues.length){
    throw new Error("Fix faculty CSV row issues before importing:\n"+
      issues.slice(0,30).join("\n")+
      (issues.length>30?"\n"+(issues.length-30)+" additional issues remain.":""));
  }
  return valid;
}
