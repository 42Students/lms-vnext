package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * College-admin Projects lifecycle against the real feature gate, template assignment and MySQL
 * recovery semantics.
 */
@Transactional
@Rollback
class AdminProjectLifecycleMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 105401;
    private static final int COLLEGE_B = 105402;
    private static final int ADMIN_A = 105411;
    private static final int LEARNER_A = 105421;
    private static final int DEPT_A = 105431;
    private static final int DEPT_B = 105432;
    private static final int PROGRAM_A = 105441;
    private static final int PROGRAM_B = 105442;
    private static final long BATCH_A = 105451L;
    private static final long BATCH_B = 105452L;
    private static final int CLASS_A = 105461;
    private static final int CLASS_B = 105462;
    private static final int TEMPLATE = 105471;

    private void seedBase(boolean projectsEnabled) {
        seedCollege(COLLEGE_A, "Projects Admin College A");
        seedCollege(COLLEGE_B, "Projects Admin College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "ProjectsAdmin");
        seedLearner(LEARNER_A, COLLEGE_A, "ProjectLearner");
        seedDepartment(DEPT_A, COLLEGE_A, "Projects Dept A");
        seedDepartment(DEPT_B, COLLEGE_B, "Projects Dept B");

        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Projects Program A', ?, 4, 0)",
                PROGRAM_A, DEPT_A);
        jdbc.update("insert into new_program (id, name, dept_id, duration_years, is_deleted) values (?, 'Projects Program B', ?, 4, 0)",
                PROGRAM_B, DEPT_B);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Projects Batch A', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_A, PROGRAM_A);
        jdbc.update("insert into batch (id, batch_name, program_id, current_students, current_semester, academic_year, status, created_at, updated_at) "
                + "values (?, 'Projects Batch B', ?, 0, 1, '2026-27', 'ACTIVE', now(), now())", BATCH_B, PROGRAM_B);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Projects Section A', ?, ?, 60, 0, 'SECTION', 0)", CLASS_A, PROGRAM_A, BATCH_A);
        jdbc.update("insert into class (id, name, program_id, batch_id, upper_limit, lower_limit, class_type, is_deleted) "
                + "values (?, 'Projects Section B', ?, ?, 60, 0, 'SECTION', 0)", CLASS_B, PROGRAM_B, BATCH_B);
        jdbc.update("update learner set program_id = ?, class_id = ? where id = ?", PROGRAM_A, CLASS_A, LEARNER_A);

        // Projects is a default-on module (ModuleFeatureCatalog.defaultEnabled): "disabled" must be an
        // explicit college-level false, not a missing row.
        jdbc.update("insert into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                + "values ('COLLEGE', ?, 'module.projects.enabled', ?, 0)", COLLEGE_A, projectsEnabled ? "true" : "false");

        jdbc.update("insert into project_template "
                        + "(id, slug, title, summary, status, organization_id, template_version, lifecycle_status, published_at, version, is_deleted) "
                        + "values (?, 'admin-project-template-it', 'Admin Project Template', 'Integration template', 'IN_PROGRESS', 1, 1, 'PUBLISHED', now(), 0, 0)",
                TEMPLATE);
        jdbc.update("insert into project_template_college "
                        + "(template_id, college_id, assigned_by, is_deleted, created_at, updated_at) values (?, ?, ?, 0, now(), now())",
                TEMPLATE, COLLEGE_A, ADMIN_A);
    }

    private String adminToken() {
        return accessToken(facultyPrincipal(ADMIN_A, "ADMIN", COLLEGE_A));
    }

    private int createProject(String title) throws Exception {
        mvc.perform(post("/api/v1/admin/projects")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + title + "\",\"summary\":\"Integration workspace\","
                                + "\"status\":\"BLOCKED\",\"progress\":10,\"organizationId\":9999,"
                                + "\"collegeId\":" + COLLEGE_A + ",\"classId\":" + CLASS_A
                                + ",\"templateId\":" + TEMPLATE + ",\"learnerIds\":[" + LEARNER_A + "]}"))
                .andExpect(status().isCreated());

        Integer id = jdbc.queryForObject(
                "select id from project_workspace where college_id = ? and title = ? and is_deleted = 0",
                Integer.class, COLLEGE_A, title);
        assertNotNull(id);
        return id;
    }

    @Test
    void adminCreatesProjectFromAssignedPublishedTemplateAndServerDerivesOrganization() throws Exception {
        seedBase(true);
        int id = createProject("Admin Lifecycle Project");

        assertEquals(1, jdbc.queryForObject(
                "select organization_id from project_workspace where id = ?", Integer.class, id));
        assertEquals(COLLEGE_A, jdbc.queryForObject(
                "select college_id from project_workspace where id = ?", Integer.class, id));
        assertEquals(CLASS_A, jdbc.queryForObject(
                "select class_id from project_workspace where id = ?", Integer.class, id));
        assertEquals(TEMPLATE, jdbc.queryForObject(
                "select template_id from project_workspace where id = ?", Integer.class, id));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from project_member where project_id = ? and user_id = ? and user_type = 'LEARNER' and is_deleted = 0",
                Integer.class, id, LEARNER_A));
    }

    @Test
    void projectListAndSingleReadStayInsideAdminCollege() throws Exception {
        seedBase(true);
        int own = createProject("Visible Project");
        jdbc.update("insert into project_workspace "
                        + "(id, slug, title, status, progress, organization_id, college_id, template_id, version, recoverable_content, is_deleted) "
                        + "values (105481, 'foreign-admin-project-it', 'Foreign Project', 'BLOCKED', 0, 1, ?, ?, 0, 0, 0)",
                COLLEGE_B, TEMPLATE);

        String list = mvc.perform(get("/api/v1/admin/projects")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(list.contains("Visible Project"), list);
        assertTrue(!list.contains("Foreign Project"), list);

        mvc.perform(get("/api/v1/admin/projects/" + own)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        // ProjectWorkspaceServiceImpl refuses another college's project with AccessDeniedException -> 403.
        String foreign = mvc.perform(get("/api/v1/admin/projects/105481")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isForbidden())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!foreign.contains("Foreign Project"), foreign);
    }

    @Test
    void updatePersistsScheduleAndEstimationButRejectsForeignClassMove() throws Exception {
        seedBase(true);
        int id = createProject("Updatable Project");

        mvc.perform(put("/api/v1/admin/projects/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Updated Project\",\"startDate\":\"2026-11-01\",\"endDate\":\"2027-02-01\","
                                + "\"sprintLengthWeeks\":3,\"estimationUnit\":\"HOURS\",\"classId\":" + CLASS_A + "}"))
                .andExpect(status().isOk());

        assertEquals("Updated Project", jdbc.queryForObject(
                "select title from project_workspace where id = ?", String.class, id));
        assertEquals(3, jdbc.queryForObject(
                "select sprint_length_weeks from project_workspace where id = ?", Integer.class, id));
        assertEquals("HOURS", jdbc.queryForObject(
                "select estimation_unit from project_workspace where id = ?", String.class, id));

        mvc.perform(put("/api/v1/admin/projects/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"classId\":" + CLASS_B + "}"))
                .andExpect(status().isForbidden());

        assertEquals(CLASS_A, jdbc.queryForObject(
                "select class_id from project_workspace where id = ?", Integer.class, id));
    }

    @Test
    void archiveIsIdempotentAndDeleteRestorePreservesRecoverableTask() throws Exception {
        seedBase(true);
        int id = createProject("Recoverable Project");
        jdbc.update("insert into project_task "
                        + "(project_id, task_key, title, task_status, priority, sort_order, version, is_deleted, deleted_by_workspace) "
                        + "values (?, 'recoverable-task', 'Recoverable Task', 'TO_DO', 'MEDIUM', 0, 0, 0, 0)",
                id);

        mvc.perform(post("/api/v1/admin/projects/" + id + "/archive")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/projects/" + id + "/archive")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());
        assertEquals("ARCHIVED", jdbc.queryForObject(
                "select status from project_workspace where id = ?", String.class, id));

        mvc.perform(post("/api/v1/admin/projects/" + id + "/delete")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select is_deleted from project_workspace where id = ?", Integer.class, id));
        assertEquals(1, jdbc.queryForObject(
                "select recoverable_content from project_workspace where id = ?", Integer.class, id));
        assertEquals(1, jdbc.queryForObject(
                "select deleted_by_workspace from project_task where project_id = ? and task_key = 'recoverable-task'",
                Integer.class, id));

        String deleted = mvc.perform(get("/api/v1/admin/projects/deleted")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(deleted.contains("Recoverable Project"), deleted);

        mvc.perform(post("/api/v1/admin/projects/" + id + "/restore")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select is_deleted from project_workspace where id = ?", Integer.class, id));
        assertEquals("BLOCKED", jdbc.queryForObject(
                "select status from project_workspace where id = ?", String.class, id));
        assertEquals(0, jdbc.queryForObject(
                "select is_deleted from project_task where project_id = ? and task_key = 'recoverable-task'",
                Integer.class, id));
        assertEquals(0, jdbc.queryForObject(
                "select deleted_by_workspace from project_task where project_id = ? and task_key = 'recoverable-task'",
                Integer.class, id));
    }

    @Test
    void projectsFeatureDisabledBlocksAdminSurfaceBeforeMutation() throws Exception {
        seedBase(false);

        mvc.perform(post("/api/v1/admin/projects")
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Disabled Project\",\"status\":\"BLOCKED\","
                                + "\"collegeId\":" + COLLEGE_A + ",\"templateId\":" + TEMPLATE + "}"))
                .andExpect(status().isForbidden());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from project_workspace where college_id = ? and title = 'Disabled Project'",
                Integer.class, COLLEGE_A));
    }

    @Test
    void learnerCannotReachAdminProjectLifecycle() throws Exception {
        seedBase(true);
        String learner = accessToken(learnerPrincipal(LEARNER_A, COLLEGE_A));

        mvc.perform(get("/api/v1/admin/projects")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + learner))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/projects")
                        .header("Authorization", "Bearer " + learner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Learner Admin Attack\",\"collegeId\":" + COLLEGE_A
                                + ",\"templateId\":" + TEMPLATE + "}"))
                .andExpect(status().isForbidden());
    }
}
