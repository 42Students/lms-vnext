import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  sql,
  isNull,
  or,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { can, requirePermission, AuthorizationError } from "@/modules/permissions/policy";
import {
  collegeMemberships,
  membershipRoles,
  placementCompanies,
  placementCompanyRelationships,
  placementJobs,
  placementPublicJoinLinks,
  placementCompanyDomains,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import {changeTpoPublicJoinLink,getTpoPublicJoinLinkStatus} from "./tpo-public-join-link-service";
import {
  createPlacementCompanyInputSchema,
  placementCompanyRelationshipIdSchema,
  updatePlacementCompanyRelationshipInputSchema,
  type CreatePlacementCompanyInput,
  type UpdatePlacementCompanyRelationshipInput,
} from "./validation";

async function loadRelationship(
  relationshipId: string,
) {
  const [row] = await getDb()
    .select({
      relationship: placementCompanyRelationships,
      company: placementCompanies,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      eq(
        placementCompanyRelationships.id,
        relationshipId,
      ),
    )
    .limit(1);

  if (!row) {
    throw new PlacementsServiceError(
      "PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND",
    );
  }

  return row;
}

async function requireValidOwner(
  collegeId: string,
  membershipId: string,
) {
  const rows = await getDb()
    .select({ role: membershipRoles.role })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      eq(
        membershipRoles.membershipId,
        collegeMemberships.id,
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.collegeId, collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    );

  if (rows.length === 0) {
    throw new PlacementsServiceError(
      "PLACEMENT_OWNER_MEMBERSHIP_NOT_FOUND",
    );
  }

  if (
    !rows.some(
      ({ role }) =>
        role === "TPO" || role === "COLLEGE_ADMIN",
    )
  ) {
    throw new PlacementsServiceError(
      "PLACEMENT_OWNER_ROLE_REQUIRED",
    );
  }
}

export async function listPlacementCompanies(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId =
    createPlacementCompanyInputSchema.shape.collegeId.parse(
      collegeIdInput,
    );
  await requirePlacementManageScope(context, collegeId);

  return getDb()
    .select({
      relationshipId: placementCompanyRelationships.id,
      companyId: placementCompanies.id,
      name: placementCompanies.name,
      websiteUrl: placementCompanies.websiteUrl,
      primaryDomain: placementCompanies.primaryDomain,
      legacyCompanyId:placementCompanies.legacyCompanyId,
      logoPublicUrl:placementCompanies.logoPublicUrl,
      domainVerification:sql<Array<{domain:string;verifiedBy42:boolean;verifiedAt:string|null}>>`(select
        coalesce(jsonb_agg(jsonb_build_object('domain',d.domain,'verifiedBy42',d.verified_by_42,
        'verifiedAt',d.verified_at) order by d.domain),'[]'::jsonb)
        from placement_company_domains d where d.company_id=${placementCompanies.id})`,
      joinLinkOpens:sql<number>`coalesce((select l.opens_count from placement_public_join_links l
        where l.company_id=${placementCompanies.id} and l.college_id=${placementCompanyRelationships.collegeId}
          and l.scope='COMPANY' and l.revoked_at is null
        order by l.created_at desc,l.id desc limit 1),0)::int`,
      joinLinkJoins:sql<number>`coalesce((select l.joins_count from placement_public_join_links l
        where l.company_id=${placementCompanies.id} and l.college_id=${placementCompanyRelationships.collegeId}
          and l.scope='COMPANY' and l.revoked_at is null
        order by l.created_at desc,l.id desc limit 1),0)::int`,
      joinLinkCreatedAt:sql<Date|null>`(select l.created_at from placement_public_join_links l
        where l.company_id=${placementCompanies.id} and l.college_id=${placementCompanyRelationships.collegeId}
          and l.scope='COMPANY' and l.revoked_at is null
        order by l.created_at desc,l.id desc limit 1)`,
      otherNames: sql<string[]>`(select coalesce(array_agg(a.alias order by a.alias),array[]::text[])
        from placement_company_aliases a where a.company_id=${placementCompanies.id})`,
      domains: sql<string[]>`(select coalesce(array_agg(d.domain order by d.domain),array[]::text[])
        from placement_company_domains d where d.company_id=${placementCompanies.id})`,
      logoObjectPath: placementCompanies.logoObjectPath,
      isTrusted: placementCompanyRelationships.isTrusted,
      ownerMembershipId:
        placementCompanyRelationships.ownerMembershipId,
      // These CRM fields live on the authorized COLLEGE relationship, never
      // on the global employer record or cross-college directory.
      internalNotes: placementCompanyRelationships.internalNotes,
      contactPersonName: placementCompanyRelationships.contactPersonName,
      contactEmail: placementCompanyRelationships.contactEmail,
      contactPhone: placementCompanyRelationships.contactPhone,
      createdAt: placementCompanyRelationships.createdAt,
      updatedAt: placementCompanyRelationships.updatedAt,
    })
    .from(placementCompanyRelationships)
    .innerJoin(
      placementCompanies,
      eq(
        placementCompanies.id,
        placementCompanyRelationships.companyId,
      ),
    )
    .where(
      and(
        eq(placementCompanyRelationships.collegeId, collegeId),
        eq(placementCompanyRelationships.status, "ACTIVE"),
        eq(placementCompanies.status, "ACTIVE"),
        isNull(placementCompanyRelationships.archivedAt),
      ),
    )
    .orderBy(asc(placementCompanies.name));
}

/** College-private contact detail and link engagement. Never return this from a public company lookup. */
export async function getPlacementCompanyRelationshipDetails(
  context:RequestContext, relationshipIdInput:string,
){
  const relationshipId=placementCompanyRelationshipIdSchema.parse(relationshipIdInput);
  const {relationship,company}=await loadRelationship(relationshipId);
  await requirePlacementManageScope(context,relationship.collegeId);
  const [link]=await getDb().select({
    createdAt:placementPublicJoinLinks.createdAt,
    opens:placementPublicJoinLinks.opensCount,
    joins:placementPublicJoinLinks.joinsCount,
    enabled:placementPublicJoinLinks.enabled,
    expiresAt:placementPublicJoinLinks.expiresAt,
  }).from(placementPublicJoinLinks).where(and(
    eq(placementPublicJoinLinks.collegeId,relationship.collegeId),
    eq(placementPublicJoinLinks.companyId,company.id),
    eq(placementPublicJoinLinks.scope,"COMPANY"),
    isNull(placementPublicJoinLinks.revokedAt),
  )).orderBy(sql`${placementPublicJoinLinks.createdAt} desc,${placementPublicJoinLinks.id} desc`).limit(1);
  const domains=await getDb().select({
    domain:placementCompanyDomains.domain,
    verifiedBy42:placementCompanyDomains.verifiedBy42,
    verifiedAt:placementCompanyDomains.verifiedAt,
  }).from(placementCompanyDomains).where(eq(placementCompanyDomains.companyId,company.id))
    .orderBy(asc(placementCompanyDomains.domain));
  return {
    company:{id:company.id,name:company.name,primaryDomain:company.primaryDomain,
      legacyCompanyId:company.legacyCompanyId,logoObjectPath:company.logoObjectPath,
      logoPublicUrl:company.logoPublicUrl?.startsWith("https://")?company.logoPublicUrl:null,
      requiresSignedLogoUrl:Boolean(company.logoObjectPath)},
    relationship:{id:relationship.id,companyId:relationship.companyId,
      isTrusted:relationship.isTrusted,status:relationship.status,
      contactPersonName:relationship.contactPersonName,
      contactEmail:relationship.contactEmail,contactPhone:relationship.contactPhone,
      internalNotes:relationship.internalNotes,ownerMembershipId:relationship.ownerMembershipId,
      createdAt:relationship.createdAt,updatedAt:relationship.updatedAt},
    domains,joinLink:link??null,
  };
}

/** One-time token generation remains in the centralized hashed public-link service. */
export async function changePlacementCompanyJoinLink(
  context:RequestContext,companyId:string,
  action:"CREATE"|"REPLACE",expectedLinkId?:string,
){
  return changeTpoPublicJoinLink(context,{scope:"COMPANY",companyId,action,
    confirmed:true,...(action==="REPLACE"?{expectedLinkId}:{})});
}

export async function getPlacementCompanyJoinLinkStatus(context:RequestContext,companyId:string){
  return getTpoPublicJoinLinkStatus(context,"COMPANY",companyId);
}

export async function listPlacementRelationshipOwners(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId =
    createPlacementCompanyInputSchema.shape.collegeId.parse(
      collegeIdInput,
    );
  await requirePlacementManageScope(
    context,
    collegeId,
  );

  const rows = await getDb()
    .select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
      role: membershipRoles.role,
    })
    .from(collegeMemberships)
    .innerJoin(
      membershipRoles,
      eq(
        membershipRoles.membershipId,
        collegeMemberships.id,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .where(
      and(
        eq(
          collegeMemberships.collegeId,
          collegeId,
        ),
        eq(
          collegeMemberships.status,
          "ACTIVE",
        ),
        inArray(membershipRoles.role, [
          "TPO",
          "COLLEGE_ADMIN",
        ]),
      ),
    )
    .orderBy(asc(users.displayName));

  const owners = new Map<
    string,
    {
      membershipId: string;
      displayName: string | null;
      email: string | null;
      roles: string[];
    }
  >();

  for (const row of rows) {
    const current = owners.get(
      row.membershipId,
    );
    if (current) {
      if (!current.roles.includes(row.role)) {
        current.roles.push(row.role);
      }
      continue;
    }
    owners.set(row.membershipId, {
      membershipId: row.membershipId,
      displayName: row.displayName,
      email: row.email,
      roles: [row.role],
    });
  }

  return [...owners.values()];
}

export type PlacementCompanyIdentity={id:string;name:string;primaryDomain:string|null};
const identityName=(value:string)=>value.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
const identityDomain=(value:string)=>value.trim().toLowerCase().replace(/^www\./,"");
/** Legacy "Add other" duplicate check: an ACTIVE company with the same name but
 * a different domain is offered as "Use <company>" before a new one is made. */
export async function findSamePlacementCompanyByName(
  name:string,domain:string,
):Promise<PlacementCompanyIdentity|null>{
  const wanted=identityName(name);
  const own=identityDomain(domain);
  const rows=await getDb().select({id:placementCompanies.id,name:placementCompanies.name,
    primaryDomain:placementCompanies.primaryDomain}).from(placementCompanies)
    .where(and(eq(placementCompanies.status,"ACTIVE"),
      sql`lower(regexp_replace(btrim(${placementCompanies.name}),'[[:space:]]+',' ','g'))=${wanted}`))
    .limit(5);
  return rows.find(row=>identityDomain(row.primaryDomain??"")!==own)??null;
}
/** Server re-read of a reviewed company identity (never trusted from the client). */
export async function loadPlacementCompanyIdentity(
  companyId:string,
):Promise<PlacementCompanyIdentity|null>{
  const [row]=await getDb().select({id:placementCompanies.id,name:placementCompanies.name,
    primaryDomain:placementCompanies.primaryDomain}).from(placementCompanies)
    .where(and(eq(placementCompanies.id,companyId),eq(placementCompanies.status,"ACTIVE"))).limit(1);
  return row??null;
}
export function placementCompanyIdentityMatches(
  identity:PlacementCompanyIdentity,name:string,domain:string,
):boolean{
  return identityName(identity.name)===identityName(name)&&
    identityDomain(identity.primaryDomain??"")===identityDomain(domain);
}

export async function createPlacementCompany(
  context: RequestContext,
  rawInput: CreatePlacementCompanyInput,
) {
  const input =
    createPlacementCompanyInputSchema.parse(rawInput);
  if (!can(context, "placements.manage", { collegeId: input.collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId: input.collegeId });
  await requirePlacementManageScope(context, input.collegeId);
  const db = getDb();
  const privateFields = {
    ...(input.contactPersonName===undefined?{}:{contactPersonName:input.contactPersonName}),
    ...(input.contactEmail===undefined?{}:{contactEmail:input.contactEmail}),
    ...(input.contactPhone===undefined?{}:{contactPhone:input.contactPhone}),
    ...(input.internalNotes===undefined?{}:{internalNotes:input.internalNotes}),
  };
  const hasPrivateDetails=Object.keys(privateFields).length>0;

  return db.transaction(async (tx) => {
    // Display names are not globally unique. Two colleges can work with
    // different companies sharing a name, but the same canonical domain
    // must not create parallel global identities under concurrent requests.
    const domain = (input.primaryDomain ??
      new URL(input.websiteUrl!).hostname.replace(/^www\./i,""))
      .toLocaleLowerCase("en-US");
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${domain},0))`);
    const [domainOwner]=await tx.select({companyId:placementCompanyDomains.companyId})
      .from(placementCompanyDomains)
      .where(ilike(placementCompanyDomains.domain,domain)).limit(1);
    // A verified/registered secondary domain may be owned by a company whose
    // primary domain differs. Resolve that identity rather than treating the
    // legitimate domain alias as a new global employer.
    const [canonical] = await tx.select().from(placementCompanies)
      .where(domainOwner
        ? eq(placementCompanies.id, domainOwner.companyId)
        : ilike(placementCompanies.primaryDomain, domain))
      .for("update").limit(1);
    if(domainOwner&&!canonical)
      throw new PlacementsServiceError("PLACEMENT_COMPANY_IDENTITY_CONFLICT");
    // A secondary-domain claim must not shadow a different primary-domain
    // owner. Stop instead of silently linking the wrong global company.
    if(domainOwner){
      const [primaryOwner]=await tx.select({id:placementCompanies.id})
        .from(placementCompanies)
        .where(ilike(placementCompanies.primaryDomain,domain)).limit(1);
      if(primaryOwner&&primaryOwner.id!==domainOwner.companyId)
        throw new PlacementsServiceError("PLACEMENT_COMPANY_IDENTITY_CONFLICT");
    }
    if (canonical && (canonical.status !== "ACTIVE" ||
        canonical.name.trim().toLocaleLowerCase("en-US") !==
          input.name.trim().toLocaleLowerCase("en-US"))) {
      // A name mismatch could be an unapproved alias or domain hijack.
      // Do not mutate a globally shared canonical record as a side effect.
      throw new PlacementsServiceError("PLACEMENT_COMPANY_IDENTITY_CONFLICT");
    }
    let company=canonical??null;
    let existed=Boolean(company);
    if(!company){
      const [created]=await tx.insert(placementCompanies).values({
        name:input.name,websiteUrl:input.websiteUrl??null,
        primaryDomain:domain,industry:input.industry??null,about:input.about??null,
        createdByUserId:context.user.id,
        logoPublicUrl:input.logoPublicUrl??null,
      }).onConflictDoNothing().returning();
      company=created??null;
      if(!company){
        const [concurrent]=await tx.select().from(placementCompanies)
          .where(ilike(placementCompanies.primaryDomain,domain)).limit(1);
        if(!concurrent||concurrent.status!=="ACTIVE"||
          concurrent.name.trim().toLocaleLowerCase("en-US")!==
            input.name.trim().toLocaleLowerCase("en-US"))
          throw new PlacementsServiceError("PLACEMENT_COMPANY_IDENTITY_CONFLICT");
        company=concurrent;
        existed=true;
      }
    }
    // An active relationship is idempotent. Do not send another join notice
    // or audit event when the college already has this employer linked.
    const [existingLink]=await tx.select().from(placementCompanyRelationships)
      .where(and(eq(placementCompanyRelationships.collegeId,input.collegeId),
        eq(placementCompanyRelationships.companyId,company.id)))
      .for("update").limit(1);
    if(existingLink?.status==="ACTIVE"){
      if(!hasPrivateDetails)return {
        company,relationship:existingLink,existed:true,alreadyLinked:true,
        createdByUserId:existingLink.createdByUserId,
      };
      const [updated]=await tx.update(placementCompanyRelationships)
        .set({...privateFields,updatedAt:new Date()})
        .where(and(eq(placementCompanyRelationships.id,existingLink.id),
          eq(placementCompanyRelationships.collegeId,input.collegeId),
          eq(placementCompanyRelationships.status,"ACTIVE"))).returning();
      if(!updated)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
        collegeId:input.collegeId,
        subjectType:"placement_company_relationship",subjectId:updated.id,
        subjectLabel:company.name,
        summary:"College employer private contact details updated",
        metadata:{action:"UPDATE_PRIVATE_CONTACT",relationshipId:updated.id},
        groupKey:"placement-companies:"+input.collegeId,
      });
      return {company,relationship:updated,existed:true,alreadyLinked:true,
        createdByUserId:updated.createdByUserId};
    }
    // Canonical employer edits need verified ownership, not a link operation.
    const now = new Date();
    const [relationship] = await tx
      .insert(placementCompanyRelationships)
      .values({
        collegeId: input.collegeId,
        companyId: company.id,
        isTrusted: input.isTrusted,
        createdByUserId: context.user.id,
        ...privateFields,
      })
      .onConflictDoUpdate({
        target: [
          placementCompanyRelationships.collegeId,
          placementCompanyRelationships.companyId,
        ],
        set: {
          status: "ACTIVE",
          archivedAt: null,
          updatedAt: now,
          ...privateFields,
        },
      })
      .returning();

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
      collegeId: input.collegeId,
      subjectType: "placement_company_relationship",
      subjectId: relationship.id,
      subjectLabel: company.name,
      summary: "Placement employer linked to college",
      metadata: {
        companyId: company.id,
        relationshipId: relationship.id,
        companyStatus: company.status,
        action:existingLink?"RESTORE":"CREATE",
        existed,createdByUserId:context.user.id,
      },
      groupKey: "placement-companies:" + input.collegeId,
    });

    return { company, relationship, existed,alreadyLinked:false,
      createdByUserId:context.user.id };
  });
}

export async function updatePlacementCompanyRelationship(
  context: RequestContext,
  relationshipIdInput: string,
  rawInput: UpdatePlacementCompanyRelationshipInput,
) {
  const relationshipId =
    placementCompanyRelationshipIdSchema.parse(
      relationshipIdInput,
    );
  const input =
    updatePlacementCompanyRelationshipInputSchema.parse(
      rawInput,
    );
  const current = await loadRelationship(relationshipId);

  await requirePlacementManageScope(
    context,
    current.relationship.collegeId,
  );

  if (input.ownerMembershipId) {
    await requireValidOwner(
      current.relationship.collegeId,
      input.ownerMembershipId,
    );
  }

  return getDb().transaction(async tx=>{
    const [locked]=await tx.select().from(placementCompanyRelationships)
      .where(and(eq(placementCompanyRelationships.id,relationshipId),
        eq(placementCompanyRelationships.collegeId,current.relationship.collegeId)))
      .for("update").limit(1);
    if(!locked||locked.status!=="ACTIVE")
      throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    const [updated]=await tx.update(placementCompanyRelationships).set({
      ...(input.isTrusted===undefined?{}:{isTrusted:input.isTrusted}),
      ...(input.ownerMembershipId===undefined?{}:{ownerMembershipId:input.ownerMembershipId}),
      updatedAt:new Date(),
    }).where(and(eq(placementCompanyRelationships.id,relationshipId),
      eq(placementCompanyRelationships.collegeId,current.relationship.collegeId),
      eq(placementCompanyRelationships.status,"ACTIVE"))).returning();
    if(!updated)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
      collegeId:current.relationship.collegeId,
      subjectType:"placement_company_relationship",subjectId:updated.id,
      subjectLabel:current.company.name,summary:"College employer relationship updated",
      metadata:{companyId:current.company.id,relationshipId:updated.id,
        action:"UPDATE",actorUserId:context.user.id,
        before:{isTrusted:locked.isTrusted,ownerMembershipId:locked.ownerMembershipId},
        after:{isTrusted:updated.isTrusted,ownerMembershipId:updated.ownerMembershipId}},
      groupKey:"placement-companies:"+current.relationship.collegeId,
    });
    return {company:current.company,relationship:updated};
  });
}

export async function archivePlacementCompanyRelationship(
  context: RequestContext,
  relationshipIdInput: string,
) {
  const relationshipId =
    placementCompanyRelationshipIdSchema.parse(
      relationshipIdInput,
    );
  const current = await loadRelationship(relationshipId);

  await requirePlacementManageScope(
    context,
    current.relationship.collegeId,
  );

  return getDb().transaction(async tx=>{
    // Job creation locks the same relationship FOR SHARE before inserting a
    // draft. This exclusive lock prevents an archive/apply race.
    const [locked]=await tx.select().from(placementCompanyRelationships)
      .where(and(eq(placementCompanyRelationships.id,relationshipId),
        eq(placementCompanyRelationships.collegeId,current.relationship.collegeId)))
      .for("update").limit(1);
    if(!locked)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    if(locked.status==="ARCHIVED")return {company:current.company,relationship:locked};
    const [dependentJob]=await tx.select({id:placementJobs.id}).from(placementJobs)
      .where(and(eq(placementJobs.companyRelationshipId,relationshipId),
        isNull(placementJobs.archivedAt))).limit(1);
    if(dependentJob)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_HAS_JOBS");
    const now=new Date();
    const [relationship]=await tx.update(placementCompanyRelationships)
      .set({status:"ARCHIVED",archivedAt:now,updatedAt:now})
      .where(and(eq(placementCompanyRelationships.id,relationshipId),
        eq(placementCompanyRelationships.collegeId,current.relationship.collegeId),
        eq(placementCompanyRelationships.status,"ACTIVE"))).returning();
    if(!relationship)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
      collegeId:current.relationship.collegeId,
      subjectType:"placement_company_relationship",subjectId:relationship.id,
      subjectLabel:current.company.name,summary:"College employer relationship archived",
      metadata:{companyId:current.company.id,relationshipId:relationship.id,action:"ARCHIVE",
        actorUserId:context.user.id,beforeStatus:locked.status,afterStatus:relationship.status},
      groupKey:"placement-companies:"+current.relationship.collegeId,
    });
    return {company:current.company,relationship};
  });
}

/** COL-placements-15: recovery revives only the selected college's archived
 * relationship, never an archived global company or another tenant's link. */
export async function restorePlacementCompanyRelationship(
 context: RequestContext, relationshipIdInput: string,
){
 const relationshipId=placementCompanyRelationshipIdSchema.parse(relationshipIdInput);
 const current=await loadRelationship(relationshipId);
 await requirePlacementManageScope(context,current.relationship.collegeId);
 if(current.company.status!=="ACTIVE")
  throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
 if(current.relationship.status==="ACTIVE")return current;
 return getDb().transaction(async tx=>{
  // COL-placements-15: lock both rows and revalidate the global employer state
  // against concurrent archive, so restoring cannot revive a disabled company.
  const [locked]=await tx.select({
    relationship:placementCompanyRelationships,
    company:placementCompanies,
  }).from(placementCompanyRelationships)
    .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
    .where(and(eq(placementCompanyRelationships.id,relationshipId),
      eq(placementCompanyRelationships.collegeId,current.relationship.collegeId)))
    .for("update").limit(1);
  if(!locked || locked.company.status!=="ACTIVE" ||
     locked.relationship.status!=="ARCHIVED" || !locked.relationship.archivedAt)
   throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  const [restored]=await tx.update(placementCompanyRelationships).set({
   status:"ACTIVE",archivedAt:null,updatedAt:new Date(),
  }).where(and(eq(placementCompanyRelationships.id,relationshipId),
   eq(placementCompanyRelationships.collegeId,current.relationship.collegeId),
   eq(placementCompanyRelationships.status,"ARCHIVED"))).returning();
  if(!restored)throw new PlacementsServiceError("PLACEMENT_COMPANY_RELATIONSHIP_NOT_FOUND");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_LINKED,
   collegeId:current.relationship.collegeId,
   subjectType:"placement_company_relationship",subjectId:restored.id,
   subjectLabel:current.company.name,summary:"Placement employer restored",
   metadata:{companyId:current.company.id,relationshipId:restored.id,action:"RESTORE",
     actorUserId:context.user.id,beforeStatus:locked.relationship.status,afterStatus:restored.status},
  });
  return {company:current.company,relationship:restored};
 });
}
