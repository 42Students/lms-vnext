package com._42students.lms.integration;

import com._42students.lms.model.Recruiter;
import com._42students.lms.model.RecruiterCollegeAccess;
import com._42students.lms.repository.RecruiterCollegeAccessRepository;
import com._42students.lms.repository.RecruiterRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Recruiter-lead CRM lifecycle plus recruiter-college access administration.
 */
@Transactional
@Rollback
class TpoRecruiterRelationshipMySqlIT extends AbstractMySqlHttpIT {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate writes dirty entities only on commit or before an overlapping JPQL query.
     * Flush first so raw-JDBC assertions see what a committed production request would have written.
     */
    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private static final int COLLEGE_A = 107401;
    private static final int COLLEGE_B = 107402;
    private static final int TPO_A = 107411;

    @Autowired
    private RecruiterRepository recruiterRepository;

    @Autowired
    private RecruiterCollegeAccessRepository accessRepository;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Recruiter Relationship College A");
        seedCollege(COLLEGE_B, "Recruiter Relationship College B");
        seedFaculty(TPO_A, COLLEGE_A, "RecruiterRelationshipOfficer");
        jdbc.update("update faculty set faculty_type = 14 where id = ?", TPO_A);
    }

    private String tpoToken() {
        return accessToken(facultyPrincipal(TPO_A, "TPO", COLLEGE_A));
    }

    private long addLead(String name, String contact, String company) throws Exception {
        mvc.perform(post("/api/v1/tpo/recruiter-leads")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\",\"emailOrPhone\":\"" + contact
                                + "\",\"companyName\":\"" + company + "\",\"source\":\"LinkedIn\"}"))
                .andExpect(status().isCreated());

        return flushedQuery(
                "select id from recruiter_lead where college_id = ? and name = ? order by id desc limit 1",
                Long.class, COLLEGE_A, name);
    }

    private int recruiter(String name, String mail, String mobile) {
        Recruiter r = new Recruiter();
        r.setFirstName(name);
        r.setContactMail(mail);
        r.setContactMobile(mobile);
        r.setTokenVersion(0);
        r.setIsDeleted(false);
        return recruiterRepository.saveAndFlush(r).getId();
    }

    private RecruiterCollegeAccess grant(int recruiterId, int collegeId, LocalDateTime validUntil) {
        RecruiterCollegeAccess g = new RecruiterCollegeAccess();
        g.setRecruiterId(recruiterId);
        g.setCollegeId(collegeId);
        g.setOrganizationId(1);
        g.setStatus(RecruiterCollegeAccess.STATUS_ACTIVE);
        g.setGrantedAt(LocalDateTime.now().minusDays(1));
        g.setGrantedByUserId(TPO_A);
        g.setGrantedByUserType("FACULTY");
        g.setValidUntil(validUntil);
        g.setIsDeleted(false);
        return accessRepository.saveAndFlush(g);
    }

    @Test
    void leadCreationNormalizesEmailStoresSourceAndDuplicateReturnsConflict() throws Exception {
        seedBase();
        long id = addLead("Recruiter One", "Recruiter.ONE@Example.COM", "Example Corp");

        assertEquals("recruiter.one@example.com", flushedQuery(
                "select email_norm from recruiter_lead where id = ?", String.class, id));
        assertEquals("LINKEDIN", flushedQuery(
                "select source from recruiter_lead where id = ?", String.class, id));
        assertEquals("NEW", flushedQuery(
                "select manual_stage from recruiter_lead where id = ?", String.class, id));

        mvc.perform(post("/api/v1/tpo/recruiter-leads")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Duplicate\",\"emailOrPhone\":\"recruiter.one@example.com\","
                                + "\"companyName\":\"Other Corp\"}"))
                .andExpect(status().isConflict());

        assertEquals(1, flushedQuery(
                "select count(*) from recruiter_lead where college_id = ? and email_norm = 'recruiter.one@example.com'",
                Integer.class, COLLEGE_A));
    }

    @Test
    void nonSystemActivityMovesNewLeadToContactedAndIsPersisted() throws Exception {
        seedBase();
        long id = addLead("Activity Recruiter", "activity@example.com", "Activity Corp");

        mvc.perform(post("/api/v1/tpo/recruiter-leads/" + id + "/activity")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CALL\",\"outcome\":\"CONNECTED\",\"note\":\"Discussed campus hiring\"}"))
                .andExpect(status().isCreated());

        assertEquals("CONTACTED", flushedQuery(
                "select manual_stage from recruiter_lead where id = ?", String.class, id));
        assertEquals(1, flushedQuery(
                "select count(*) from recruiter_lead_activity where recruiter_lead_id = ? and type = 'CALL'",
                Integer.class, id));
    }

    @Test
    void followUpCanBeCreatedMovedCompletedAndForeignLeadIsNotAddressable() throws Exception {
        seedBase();
        long id = addLead("Followup Recruiter", "followup@example.com", "Followup Corp");

        LocalDateTime first = LocalDateTime.now().plusDays(2).withNano(0);
        mvc.perform(post("/api/v1/tpo/recruiter-leads/" + id + "/follow-ups")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueAt\":\"" + first + "\",\"note\":\"Call again\"}"))
                .andExpect(status().isCreated());

        Long followId = flushedQuery(
                "select id from follow_up where recruiter_lead_id = ? order by id desc limit 1",
                Long.class, id);
        LocalDateTime moved = LocalDateTime.now().plusDays(4).withNano(0);
        mvc.perform(put("/api/v1/tpo/recruiter-leads/follow-ups/" + followId + "/move")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dueAt\":\"" + moved + "\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/tpo/recruiter-leads/follow-ups/" + followId + "/done")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isNoContent());

        assertNotNull(flushedQuery(
                "select done_at from follow_up where id = ?", java.sql.Timestamp.class, followId));

        jdbc.update("insert into recruiter_lead "
                + "(college_id, name, email_norm, manual_stage, source, created_at, updated_at) "
                + "values (?, 'Foreign Recruiter', 'foreign@example.com', 'NEW', 'MANUAL', now(), now())", COLLEGE_B);
        Long foreignId = flushedQuery(
                "select id from recruiter_lead where college_id = ? and email_norm = 'foreign@example.com'",
                Long.class, COLLEGE_B);

        mvc.perform(post("/api/v1/tpo/recruiter-leads/" + foreignId + "/activity")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CALL\",\"note\":\"attack\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void accessListIsCollegeScopedAndMasksRecruiterPhone() throws Exception {
        seedBase();
        int ownRecruiter = recruiter("OwnRecruiter", "own-recruiter@example.com", "9876543210");
        int foreignRecruiter = recruiter("ForeignRecruiter", "foreign-recruiter@example.com", "9123456789");
        grant(ownRecruiter, COLLEGE_A, LocalDateTime.now().plusMonths(3));
        grant(foreignRecruiter, COLLEGE_B, LocalDateTime.now().plusMonths(3));

        String body = mvc.perform(get("/api/v1/tpo/recruiter-access")
                        .header("Authorization", "Bearer " + tpoToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("OwnRecruiter"), body);
        assertTrue(body.contains("******3210"), body);
        assertTrue(!body.contains("9876543210"), body);
        assertTrue(!body.contains("ForeignRecruiter"), body);
        assertTrue(!body.contains("******6789"), body);
    }

    @Test
    void accessExtensionUsesCurrentFutureExpiryAsBaseAndZeroRemovesExpiry() throws Exception {
        seedBase();
        int recruiterId = recruiter("ExtendRecruiter", "extend@example.com", "9000000001");
        LocalDateTime original = LocalDateTime.now().plusMonths(2).withNano(0);
        RecruiterCollegeAccess g = grant(recruiterId, COLLEGE_A, original);

        mvc.perform(post("/api/v1/tpo/recruiter-access/" + recruiterId + "/extend")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"months\":3}"))
                .andExpect(status().isOk());

        RecruiterCollegeAccess extended = accessRepository.findById(g.getId()).orElseThrow();
        assertTrue(extended.getValidUntil().isAfter(original.plusMonths(2)));

        mvc.perform(post("/api/v1/tpo/recruiter-access/" + recruiterId + "/extend")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"months\":0}"))
                .andExpect(status().isOk());

        RecruiterCollegeAccess indefinite = accessRepository.findById(g.getId()).orElseThrow();
        assertEquals(null, indefinite.getValidUntil());
    }

    @Test
    void revokePersistsActorReasonAndForeignGrantCannotBeManaged() throws Exception {
        seedBase();
        int ownRecruiter = recruiter("RevokedRecruiter", "revoke@example.com", "9000000002");
        int foreignRecruiter = recruiter("ForeignAccessRecruiter", "foreign-access@example.com", "9000000003");
        RecruiterCollegeAccess own = grant(ownRecruiter, COLLEGE_A, null);
        RecruiterCollegeAccess foreign = grant(foreignRecruiter, COLLEGE_B, null);

        mvc.perform(post("/api/v1/tpo/recruiter-access/" + ownRecruiter + "/revoke")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Relationship ended\"}"))
                .andExpect(status().isNoContent());

        RecruiterCollegeAccess revoked = accessRepository.findById(own.getId()).orElseThrow();
        assertEquals(RecruiterCollegeAccess.STATUS_REVOKED, revoked.getStatus());
        assertEquals(TPO_A, revoked.getRevokedByUserId());
        assertEquals("FACULTY", revoked.getRevokedByUserType());
        assertEquals("Relationship ended", revoked.getRevokeReason());
        assertNotNull(revoked.getRevokedAt());

        mvc.perform(post("/api/v1/tpo/recruiter-access/" + foreignRecruiter + "/revoke")
                        .header("Authorization", "Bearer " + tpoToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"attack\"}"))
                .andExpect(status().isNotFound());

        assertEquals(RecruiterCollegeAccess.STATUS_ACTIVE,
                accessRepository.findById(foreign.getId()).orElseThrow().getStatus());
    }
}
