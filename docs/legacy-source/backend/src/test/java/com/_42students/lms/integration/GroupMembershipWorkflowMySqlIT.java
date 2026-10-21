package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Generic group kernel integration: admin management plus learner self-service lifecycle.
 */
@Transactional
@Rollback
class GroupMembershipWorkflowMySqlIT extends AbstractMySqlHttpIT {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * This class is @Transactional, so each MockMvc request joins the test transaction and never
     * commits; Hibernate writes dirty entities only on commit or before an overlapping JPQL query.
     * Flush first so raw-JDBC assertions see what a committed production request would have written.
     */
    /** Raw JDBC write mid-test: flush pending JPA writes first and clear afterwards so the shared persistence context does not keep serving stale entities. */
    private int syncedUpdate(String sql, Object... args) {
        entityManager.flush();
        int n = jdbc.update(sql, args);
        entityManager.clear();
        return n;
    }

    private <T> T flushedQuery(String sql, Class<T> type, Object... args) {
        entityManager.flush();
        return jdbc.queryForObject(sql, type, args);
    }

    private static final int COLLEGE_A = 103401;
    private static final int COLLEGE_B = 103402;
    private static final int ADMIN_A = 103411;
    private static final int LEARNER_A = 103421;
    private static final int LEARNER_B = 103422;
    private static final int LEARNER_FOREIGN = 103423;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Group College A");
        seedCollege(COLLEGE_B, "Group College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "GroupAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "GroupLearnerA");
        seedLearner(LEARNER_B, COLLEGE_A, "GroupLearnerB");
        seedLearner(LEARNER_FOREIGN, COLLEGE_B, "GroupForeignLearner");
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private String learnerToken(int learnerId, int collegeId) {
        return accessToken(learnerPrincipal(learnerId, collegeId));
    }

    private long createAndOpenGroup(String name, int capacity) throws Exception {
        LocalDateTime from = LocalDateTime.now().minusHours(1).withNano(0);
        LocalDateTime until = LocalDateTime.now().plusDays(2).withNano(0);
        mvc.perform(post("/api/v1/admin/groups")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"CLUB\",\"name\":\"" + name + "\",\"capacity\":" + capacity
                                + ",\"selfJoinOpenFrom\":\"" + from + "\",\"selfJoinOpenUntil\":\"" + until
                                + "\",\"configJson\":{\"allowWaitlist\":true,\"allowSelfLeave\":true}}"))
                .andExpect(status().isOk());

        Long id = flushedQuery(
                "select id from lms_group where college_id = ? and name = ? and is_deleted = 0",
                Long.class, COLLEGE_A, name);

        mvc.perform(post("/api/v1/admin/groups/" + id + "/status")
                        .param("to", "ACTIVE")
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        return id;
    }

    @Test
    void learnerSeesOpenGroupJoinsAndMembershipAppearsInMine() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Open Integration Club", 10);
        String token = learnerToken(LEARNER_A, COLLEGE_A);

        String open = mvc.perform(get("/api/v1/learner/groups/open")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(open.contains("Open Integration Club"), open);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertEquals("ACTIVE", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_A));
        assertEquals(1, flushedQuery(
                "select active_count from lms_group where id = ?", Integer.class, groupId));
        assertEquals(1, flushedQuery(
                "select count(*) from lms_group_member_event where group_id = ? and member_id = ? and to_state = 'ACTIVE'",
                Integer.class, groupId, LEARNER_A));

        String mine = mvc.perform(get("/api/v1/learner/groups/mine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(mine.contains("Open Integration Club"), mine);
    }

    @Test
    void fullGroupWaitlistsSecondLearnerAndLeavingPromotesWaitlistHead() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Capacity One Club", 1);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_B, COLLEGE_A)))
                .andExpect(status().isOk());

        assertEquals("ACTIVE", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_A));
        assertEquals("WAITLISTED", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_B));

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/leave")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk());

        assertEquals("REMOVED", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_A));
        assertEquals("ACTIVE", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_B));
        assertEquals(1, flushedQuery(
                "select active_count from lms_group where id = ?", Integer.class, groupId));
    }

    @Test
    void adminCannotShrinkCapacityBelowCurrentActiveMembership() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Capacity Shrink Guard", 2);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_B, COLLEGE_A)))
                .andExpect(status().isOk());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/admin/groups/" + groupId)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"CLUB\",\"name\":\"Capacity Shrink Guard\",\"capacity\":1,"
                                + "\"configJson\":{\"allowWaitlist\":true,\"allowSelfLeave\":true}}"))
                .andExpect(status().isConflict());

        assertEquals(2, flushedQuery(
                "select capacity from lms_group where id = ?", Integer.class, groupId));
        assertEquals(2, flushedQuery(
                "select active_count from lms_group where id = ?", Integer.class, groupId));
    }

    @Test
    void increasingCapacityImmediatelyPromotesWaitlistHead() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Capacity Increase Promotion", 1);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_B, COLLEGE_A)))
                .andExpect(status().isOk());

        assertEquals("WAITLISTED", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_B));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/admin/groups/" + groupId)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"CLUB\",\"name\":\"Capacity Increase Promotion\",\"capacity\":2,"
                                + "\"configJson\":{\"allowWaitlist\":true,\"allowSelfLeave\":true}}"))
                .andExpect(status().isOk());

        assertEquals("ACTIVE", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_B));
        assertEquals(2, flushedQuery(
                "select active_count from lms_group where id = ?", Integer.class, groupId));
    }

    @Test
    void adminRemoveWithLockPreventsLearnerSelfRejoin() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Locked Removal Club", 5);
        String learner = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/v1/admin/groups/" + groupId + "/members/" + LEARNER_A)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Policy removal\",\"lock\":true}"))
                .andExpect(status().isOk());

        assertEquals(1, flushedQuery(
                "select is_locked from lms_group_member where group_id = ? and member_id = ?",
                Integer.class, groupId, LEARNER_A));

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isConflict());

        assertEquals("REMOVED", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_A));
    }

    @Test
    void adminBulkAddRejectsForeignCollegeLearnerWithoutPartialTenantLeak() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Admin Add Club", 10);

        String body = mvc.perform(post("/api/v1/admin/groups/" + groupId + "/members")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learnerIds\":[" + LEARNER_A + "," + LEARNER_FOREIGN + "],\"source\":\"MANUAL\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("\"added\":1"), body);
        assertTrue(body.contains(String.valueOf(LEARNER_FOREIGN)), body);
        assertEquals(1, flushedQuery(
                "select count(*) from lms_group_member where group_id = ? and member_id = ? and state = 'ACTIVE'",
                Integer.class, groupId, LEARNER_A));
        assertEquals(0, flushedQuery(
                "select count(*) from lms_group_member where group_id = ? and member_id = ?",
                Integer.class, groupId, LEARNER_FOREIGN));
    }

    @Test
    void genericGroupApiRejectsManagedElectiveAndProjectTeamKinds() throws Exception {
        seedBase();

        for (String kind : new String[]{"ELECTIVE", "PROJECT_TEAM"}) {
            mvc.perform(post("/api/v1/admin/groups")
                            .header("Authorization", "Bearer " + adminToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"kind\":\"" + kind + "\",\"name\":\"Wrong Surface\"}"))
                    .andExpect(status().isBadRequest());
        }

        assertEquals(0, flushedQuery(
                "select count(*) from lms_group where college_id = ? and kind in ('ELECTIVE','PROJECT_TEAM')",
                Integer.class, COLLEGE_A));
    }

    @Test
    void learnerCannotJoinBeforeSelfJoinWindowOpens() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Future Window Club", 10);
        syncedUpdate("update lms_group set self_join_open_from = ?, self_join_open_until = ? where id = ?",
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(1)),
                java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(2)),
                groupId);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isConflict());

        assertEquals(0, flushedQuery(
                "select count(*) from lms_group_member where group_id = ? and member_id = ?",
                Integer.class, groupId, LEARNER_A));
    }

    @Test
    void learnerCannotJoinAfterSelfJoinWindowCloses() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Expired Window Club", 10);
        syncedUpdate("update lms_group set self_join_open_from = ?, self_join_open_until = ? where id = ?",
                java.sql.Timestamp.valueOf(LocalDateTime.now().minusDays(2)),
                java.sql.Timestamp.valueOf(LocalDateTime.now().minusDays(1)),
                groupId);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learnerToken(LEARNER_A, COLLEGE_A)))
                .andExpect(status().isConflict());

        assertEquals(0, flushedQuery(
                "select count(*) from lms_group_member where group_id = ? and member_id = ?",
                Integer.class, groupId, LEARNER_A));
    }

    @Test
    void selfLeaveDisabledKeepsActiveMembershipAndSeatCount() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("No Self Leave Club", 10);
        String learner = learnerToken(LEARNER_A, COLLEGE_A);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isOk());

        syncedUpdate("update lms_group set config_json = JSON_OBJECT('allowWaitlist', true, 'allowSelfLeave', false) where id = ?",
                groupId);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/leave")
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isConflict());

        assertEquals("ACTIVE", flushedQuery(
                "select state from lms_group_member where group_id = ? and member_id = ?",
                String.class, groupId, LEARNER_A));
        assertEquals(1, flushedQuery(
                "select active_count from lms_group where id = ?", Integer.class, groupId));
    }

    @Test
    void foreignCollegeLearnerCannotDiscoverOrJoinCollegeGroupById() throws Exception {
        seedBase();
        long groupId = createAndOpenGroup("Tenant Private Club", 10);
        String foreign = learnerToken(LEARNER_FOREIGN, COLLEGE_B);

        String open = mvc.perform(get("/api/v1/learner/groups/open")
                        .header("Authorization", "Bearer " + foreign))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!open.contains("Tenant Private Club"), open);

        mvc.perform(post("/api/v1/learner/groups/" + groupId + "/join")
                        .header("Authorization", "Bearer " + foreign))
                .andExpect(status().isNotFound());

        assertEquals(0, flushedQuery(
                "select count(*) from lms_group_member where group_id = ? and member_id = ?",
                Integer.class, groupId, LEARNER_FOREIGN));
    }
}
