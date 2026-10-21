package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real Projects API integration: membership, task creation, persistence and cross-project access.
 * This specifically covers the materialized workspace path that has historically produced bugs
 * despite controller/service unit coverage.
 */
@Transactional
@Rollback
class ProjectsApiMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 100101;
    private static final int COLLEGE_B = 100102;
    private static final int MENTOR_A = 100111;
    private static final int LEARNER_A = 100121;
    private static final int LEARNER_B = 100122;
    private static final int PROJECT_A = 100141;
    private static final int PROJECT_B = 100142;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Projects API College A");
        seedCollege(COLLEGE_B, "Projects API College B");
        seedFaculty(MENTOR_A, COLLEGE_A, "ProjectMentorA");
        seedLearner(LEARNER_A, COLLEGE_A, "ProjectLearnerA");
        seedLearner(LEARNER_B, COLLEGE_B, "ProjectLearnerB");
        seedProject(PROJECT_A, COLLEGE_A, "project-api-a", "Project API A");
        seedProject(PROJECT_B, COLLEGE_B, "project-api-b", "Project API B");
        seedProjectMember(100150, PROJECT_A, MENTOR_A, "FACULTY", "Project Mentor");
        seedProjectMember(100151, PROJECT_A, LEARNER_A, "LEARNER", "Student");
        seedProjectMember(100152, PROJECT_B, LEARNER_B, "LEARNER", "Student");
    }

    @Test
    void learnerCreatesOwnTaskThroughHttpAndItIsPersistedInMySql() throws Exception {
        seedBase();
        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        String response = mvc.perform(post("/api/v1/projects/" + PROJECT_A + "/tasks/items")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskKey\":\"learner-self-task\",\"title\":\"Implement API integration\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(response.contains("Implement API integration"), response);

        Integer rows = jdbc.queryForObject(
                "select count(*) from project_task where project_id = ? and task_key = ? and is_deleted = 0",
                Integer.class, PROJECT_A, "learner-self-task");
        assertEquals(1, rows);

        Integer assignee = jdbc.queryForObject(
                "select assignee_id from project_task where project_id = ? and task_key = ?",
                Integer.class, PROJECT_A, "learner-self-task");
        assertEquals(LEARNER_A, assignee,
                "learner-created tasks must be forced to self-assignment");
    }

    @Test
    void learnerCanReadOwnProjectTaskBoardButCannotReadAnotherTenantsProject() throws Exception {
        seedBase();
        jdbc.update(
                "insert into project_task " +
                        "(project_id, task_key, title, task_status, priority, assignee_id, assignee_type, " +
                        "sort_order, version, is_deleted, deleted_by_workspace) " +
                        "values (?, 'seed-task', 'Visible Task', 'TO_DO', 'MEDIUM', ?, 'LEARNER', 0, 0, 0, 0)",
                PROJECT_A, LEARNER_A);

        String token = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        String board = mvc.perform(get("/api/v1/projects/" + PROJECT_A + "/tasks/items")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(board.contains("Visible Task"), board);

        mvc.perform(get("/api/v1/projects/" + PROJECT_B)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void removingLearnerMemberRevokesAccessAndClearsTheirTaskAssignments() throws Exception {
        seedBase();
        jdbc.update(
                "insert into project_task "
                        + "(project_id, task_key, title, task_status, priority, assignee_id, assignee_type, assignee_name, "
                        + "sort_order, version, is_deleted, deleted_by_workspace) "
                        + "values (?, 'removed-member-task', 'Task owned by removed learner', 'IN_PROGRESS', 'HIGH', ?, 'LEARNER', "
                        + "'ProjectLearnerA', 0, 0, 0, 0)",
                PROJECT_A, LEARNER_A);

        String mentor = accessToken(facultyPrincipal(MENTOR_A, "LECTURER", COLLEGE_A));
        mvc.perform(post("/api/v1/projects/" + PROJECT_A + "/members/100151/remove")
                        .header("Authorization", "Bearer " + mentor))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from project_member where id = 100151",
                Integer.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from project_task where project_id = ? and task_key = 'removed-member-task' "
                        + "and assignee_id is not null",
                Integer.class, PROJECT_A));

        mvc.perform(get("/api/v1/projects/" + PROJECT_A)
                        .header("Authorization", "Bearer "
                                + accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A))))
                .andExpect(status().isForbidden());

        String board = mvc.perform(get("/api/v1/projects/" + PROJECT_A + "/tasks/items")
                        .header("Authorization", "Bearer " + mentor))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(board.contains("Task owned by removed learner"), board);
    }

    @Test
    void archivedWorkspaceRejectsStaleMemberTaskMutation() throws Exception {
        seedBase();
        jdbc.update("update project_workspace set status = 'ARCHIVED' where id = ?", PROJECT_A);

        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));
        mvc.perform(post("/api/v1/projects/" + PROJECT_A + "/tasks/items")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskKey\":\"stale-archived-task\",\"title\":\"Must not be created\"}"))
                .andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from project_task where project_id = ? and task_key = 'stale-archived-task'",
                Integer.class, PROJECT_A));
    }

    @Test
    void nonMemberCannotCreateTasksEvenWhenTheyKnowTheProjectId() throws Exception {
        seedBase();
        String outsider = accessToken(learnerPrincipal(LEARNER_B, COLLEGE_B));

        mvc.perform(post("/api/v1/projects/" + PROJECT_A + "/tasks/items")
                        .header("Authorization", "Bearer " + outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taskKey\":\"attack-task\",\"title\":\"Should never exist\"}"))
                .andExpect(status().isForbidden());

        Integer rows = jdbc.queryForObject(
                "select count(*) from project_task where project_id = ? and task_key = ?",
                Integer.class, PROJECT_A, "attack-task");
        assertEquals(0, rows);
    }
}
