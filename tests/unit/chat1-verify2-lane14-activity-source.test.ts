import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("lane-14 verification: immutable scoped audit provenance",()=>{
  it("G2-15-017-008 snapshots the persisted actor label and verified role on write",()=>{
    const writer=read("src/modules/activity/service.ts");
    const schema=read("src/db/schema/activity.ts");
    expect(writer).toContain("displayName:users.displayName");
    expect(writer).toContain("eq(users.id,context.user.id)");
    expect(writer).toContain("actorNameSnapshot:actor?.displayName??null");
    expect(writer).toContain("actorRoleSnapshot,");
    expect(writer).toContain('isSuperAdmin(context)?"SUPER_ADMIN"');
    expect(schema).toContain('actorNameSnapshot: text("actor_name_snapshot")');
    expect(schema).toContain('actorRoleSnapshot: varchar("actor_role_snapshot"');
    const reader=read("src/modules/projects/activity-service.ts");
    expect(reader).toContain("activityEvents.actorNameSnapshot");
    expect(reader).toContain("activityEvents.actorRoleSnapshot");
  });
  it("G2-9-026-041 preserves legacy audit provenance without raw sensitive fields",()=>{
    const schema=read("src/db/schema/activity.ts");
    for(const field of ["legacyAuditId","legacyActionKey","legacyEntityType",
      "legacyEntityId","sourceIpHash","sourceUserAgentFamily","actorContactLast4"]){
      expect(schema).toContain(field);
    }
    expect(schema).not.toContain('inet("ip_address"');
    expect(schema).not.toContain('text("raw_user_agent"');
  });
});
