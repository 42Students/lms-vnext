package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Mentor audit M-01/M-02/M-28..M-36: on a project, only the Mentor and Co-Mentor change tasks or review the delivery.
 * Reviewer/QA/custom faculty memberships are read-only, even for a request crafted outside the UI.
 */
@Transactional
@Rollback
class ProjectRoleMutationMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 106501;
    private static final int MENTOR = 106511;
    private static final int CO_MENTOR = 106512;
    private static final int REVIEWER = 106513;
    private static final int QA = 106514;
    private static final int PROJECT = 106541;
    private static final int TASK = 106561;

    private void seedBase() {
        seedCollege(COLLEGE, "Project Roles College");
        seedFaculty(MENTOR, COLLEGE, "Mentor");
        seedFaculty(CO_MENTOR, COLLEGE, "CoMentor");
        seedFaculty(REVIEWER, COLLEGE, "Reviewer");
        seedFaculty(QA, COLLEGE, "Qa");
        seedProject(PROJECT, COLLEGE, "project-roles-it", "Project Roles");
        seedProjectMember(106551, PROJECT, MENTOR, "FACULTY", "Project Mentor");
        seedProjectMember(106552, PROJECT, CO_MENTOR, "FACULTY", "Co-Mentor");
        seedProjectMember(106553, PROJECT, REVIEWER, "FACULTY", "Reviewer");
        seedProjectMember(106554, PROJECT, QA, "FACULTY", "QA");
        jdbc.update("insert into project_task "
                        + "(id, project_id, task_key, title, task_status, priority, sort_order, version, is_deleted, deleted_by_workspace) "
                        + "values (?, ?, 'roles-task', 'Original title', 'TO_DO', 'MEDIUM', 0, 0, 0, 0)",
                TASK, PROJECT);
    }

    private String token(int facultyId) {
        return "Bearer " + accessToken(facultyPrincipal(facultyId, "LECTURER", COLLEGE));
    }

    private int taskRows(String key) {
        return jdbc.queryForObject("select count(*) from project_task where project_id = ? and task_key = ? and is_deleted = 0",
                Integer.class, PROJECT, key);
    }

    @Test
    void reviewerAndQaCannotCreateEditDeleteOrReorderTasks() throws Exception {
        seedBase();
        for (int readOnly : new int[]{REVIEWER, QA}) {
            mvc.perform(post("/api/v1/projects/" + PROJECT + "/tasks/items").header("Authorization", token(readOnly))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"taskKey\":\"ro-" + readOnly + "\",\"title\":\"Smuggled task\"}"))
                    .andExpect(status().isForbidden());
            assertEquals(0, taskRows("ro-" + readOnly));

            mvc.perform(put("/api/v1/projects/" + PROJECT + "/tasks/items/" + TASK).header("Authorization", token(readOnly))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"title\":\"Changed by read-only role\",\"version\":0}"))
                    .andExpect(status().isForbidden());

            mvc.perform(delete("/api/v1/projects/" + PROJECT + "/tasks/items/" + TASK).header("Authorization", token(readOnly)))
                    .andExpect(status().isForbidden());

            mvc.perform(put("/api/v1/projects/" + PROJECT + "/tasks/reorder").header("Authorization", token(readOnly))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"orderedTaskIds\":[" + TASK + "]}"));
        }
        entityManagerFlush();
        assertEquals("Original title", jdbc.queryForObject("select title from project_task where id = ?", String.class, TASK));
        assertEquals(0, jdbc.queryForObject("select is_deleted from project_task where id = ?", Integer.class, TASK));
        assertEquals(0, jdbc.queryForObject("select version from project_task where id = ?", Integer.class, TASK));
    }

    @Test
    void reviewerCannotAcceptLockOrRequestChangesOnTheDelivery() throws Exception {
        seedBase();
        for (String action : new String[]{"ACCEPT", "LOCK", "REQUEST_CHANGES", "REOPEN"}) {
            mvc.perform(put("/api/v1/projects/" + PROJECT + "/delivery").header("Authorization", token(REVIEWER))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"delivery\":{\"action\":\"" + action + "\"}}"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void mentorAndCoMentorStillManageTasks() throws Exception {
        seedBase();
        for (int mutator : new int[]{MENTOR, CO_MENTOR}) {
            mvc.perform(post("/api/v1/projects/" + PROJECT + "/tasks/items").header("Authorization", token(mutator))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"taskKey\":\"ok-" + mutator + "\",\"title\":\"Mentor task\"}"))
                    .andExpect(status().isOk());
            assertEquals(1, taskRows("ok-" + mutator));
        }
    }

    @javax.persistence.PersistenceContext
    private javax.persistence.EntityManager entityManager;

    private void entityManagerFlush() {
        entityManager.flush();
        entityManager.clear();
    }
}
