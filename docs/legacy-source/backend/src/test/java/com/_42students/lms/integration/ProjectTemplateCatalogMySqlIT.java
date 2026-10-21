package com._42students.lms.integration;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Global project-template catalog lifecycle and per-college visibility.
 */
@Transactional
@Rollback
class ProjectTemplateCatalogMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE_A = 105601;
    private static final int COLLEGE_B = 105602;
    private static final int ADMIN_A = 105611;
    private static final int ADMIN_B = 105612;

    private void seedBase() {
        seedCollege(COLLEGE_A, "Template Catalog College A");
        seedCollege(COLLEGE_B, "Template Catalog College B");
        seedFaculty(ADMIN_A, COLLEGE_A, "TemplateAdminA");
        seedFaculty(ADMIN_B, COLLEGE_B, "TemplateAdminB");
        for (int collegeId : new int[]{COLLEGE_A, COLLEGE_B}) {
            jdbc.update("insert into app_setting (scope_type, scope_id, setting_key, setting_value, is_deleted) "
                    + "values ('COLLEGE', ?, 'module.projects.enabled', 'true', 0)", collegeId);
        }
    }

    private String superToken() {
        return accessToken(superAdminPrincipal());
    }

    private String adminToken(int id, int collegeId) {
        return accessToken(facultyPrincipal(id, "ADMIN", collegeId));
    }

    private String templateBody(String slug, String title) {
        return "{\"slug\":\"" + slug + "\",\"title\":\"" + title + "\","
                + "\"summary\":\"Global integration template\",\"lifecycleStatus\":\"DRAFT\","
                + "\"overview\":{\"goal\":\"Ship a production project\","
                + "\"deliverables\":[\"Working release\"]},"
                + "\"sprints\":[{\"sprintKey\":\"sprint-1\",\"title\":\"Sprint One\","
                + "\"releaseKey\":\"release-1\",\"releaseLabel\":\"Release One\"}]}";
    }

    private int createTemplate(String slug, String title) throws Exception {
        mvc.perform(post("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(templateBody(slug, title)))
                .andExpect(status().isCreated());

        Integer id = jdbc.queryForObject(
                "select id from project_template where slug = ? order by id desc limit 1",
                Integer.class, slug);
        assertNotNull(id);
        return id;
    }

    private void publishAndAssign(int templateId, int collegeId) throws Exception {
        mvc.perform(post("/api/v1/admin/project-templates/" + templateId + "/publish")
                        .param("collegeId", String.valueOf(collegeId))
                        .header("Authorization", "Bearer " + superToken()))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/admin/project-templates/" + templateId + "/colleges/" + collegeId)
                        .param("collegeId", String.valueOf(collegeId))
                        .header("Authorization", "Bearer " + superToken()))
                .andExpect(status().isOk());
    }

    @Test
    void superAdminCreatesGlobalDraftAndVersionSnapshotWithoutPersistingClientTenantScope() throws Exception {
        seedBase();

        mvc.perform(post("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slug\":\"global-draft-it\",\"title\":\"Global Draft\","
                                + "\"summary\":\"Global integration template\",\"lifecycleStatus\":\"DRAFT\","
                                + "\"organizationId\":999,\"collegeId\":" + COLLEGE_B + ","
                                + "\"overview\":{\"goal\":\"Ship a production project\","
                                + "\"deliverables\":[\"Working release\"]},"
                                + "\"sprints\":[{\"sprintKey\":\"sprint-1\",\"title\":\"Sprint One\","
                                + "\"releaseKey\":\"release-1\",\"releaseLabel\":\"Release One\"}]}"))
                .andExpect(status().isCreated());

        int id = jdbc.queryForObject(
                "select id from project_template where slug = 'global-draft-it'", Integer.class);
        assertEquals("DRAFT", jdbc.queryForObject(
                "select lifecycle_status from project_template where id = ?", String.class, id));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from project_template where id = ? and (organization_id is not null or college_id is not null)",
                Integer.class, id));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from project_template_version where template_id = ? and action_type = 'CREATE'",
                Integer.class, id));
    }

    @Test
    void publishedAssignedTemplateIsVisibleOnlyToAssignedCollegeAdmin() throws Exception {
        seedBase();
        int id = createTemplate("assigned-template-it", "Assigned Template");
        publishAndAssign(id, COLLEGE_A);

        String a = mvc.perform(get("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(a.contains("Assigned Template"), a);

        String b = mvc.perform(get("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_B, COLLEGE_B)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!b.contains("Assigned Template"), b);

        mvc.perform(get("/api/v1/admin/project-templates/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_B))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_B, COLLEGE_B)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateIncrementsTemplateVersionAndVersionHistoryRemainsSuperAdminOnly() throws Exception {
        seedBase();
        int id = createTemplate("versioned-template-it", "Versioned Template");

        mvc.perform(put("/api/v1/admin/project-templates/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(templateBody("versioned-template-it", "Versioned Template Updated")))
                .andExpect(status().isOk());

        assertEquals(2, jdbc.queryForObject(
                "select template_version from project_template where id = ?", Integer.class, id));
        assertEquals(2, jdbc.queryForObject(
                "select count(*) from project_template_version where template_id = ?",
                Integer.class, id));

        String versions = mvc.perform(get("/api/v1/admin/project-templates/" + id + "/versions")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(versions.contains("CREATE"), versions);
        assertTrue(versions.contains("UPDATE"), versions);

        mvc.perform(get("/api/v1/admin/project-templates/" + id + "/versions")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_A, COLLEGE_A)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unpublishImmediatelyRemovesTemplateFromCollegeCatalogAndRepublishRestoresIt() throws Exception {
        seedBase();
        int id = createTemplate("publish-cycle-it", "Publish Cycle Template");
        publishAndAssign(id, COLLEGE_A);

        mvc.perform(post("/api/v1/admin/project-templates/" + id + "/unpublish")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken()))
                .andExpect(status().isOk());
        assertEquals("DRAFT", jdbc.queryForObject(
                "select lifecycle_status from project_template where id = ?", String.class, id));

        String hidden = mvc.perform(get("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!hidden.contains("Publish Cycle Template"), hidden);

        mvc.perform(post("/api/v1/admin/project-templates/" + id + "/publish")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken()))
                .andExpect(status().isOk());

        String visible = mvc.perform(get("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(visible.contains("Publish Cycle Template"), visible);
    }

    @Test
    void unassignIsForwardLookingAndHidesTemplateFromCollegeCatalog() throws Exception {
        seedBase();
        int id = createTemplate("unassign-template-it", "Unassign Template");
        publishAndAssign(id, COLLEGE_A);

        mvc.perform(delete("/api/v1/admin/project-templates/" + id + "/colleges/" + COLLEGE_A)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + superToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from project_template_college where template_id = ? and college_id = ?",
                Integer.class, id, COLLEGE_A));

        String body = mvc.perform(get("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + adminToken(ADMIN_A, COLLEGE_A)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertTrue(!body.contains("Unassign Template"), body);
    }

    @Test
    void collegeAdminCannotCreateUpdatePublishOrDuplicateGlobalTemplate() throws Exception {
        seedBase();
        int id = createTemplate("super-only-template-it", "Super Only Template");
        String admin = adminToken(ADMIN_A, COLLEGE_A);

        mvc.perform(post("/api/v1/admin/project-templates")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(templateBody("attack-template-it", "Attack Template")))
                .andExpect(status().isForbidden());

        mvc.perform(put("/api/v1/admin/project-templates/" + id)
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(templateBody("super-only-template-it", "Tampered Template")))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/project-templates/" + id + "/publish")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/admin/project-templates/" + id + "/duplicate")
                        .param("collegeId", String.valueOf(COLLEGE_A))
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isForbidden());

        assertEquals("Super Only Template", jdbc.queryForObject(
                "select title from project_template where id = ?", String.class, id));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from project_template where slug = 'super-only-template-it'",
                Integer.class));
    }
}
