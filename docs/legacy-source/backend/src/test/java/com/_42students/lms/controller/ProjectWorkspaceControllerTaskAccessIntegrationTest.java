package com._42students.lms.controller;

import com._42students.lms.dto.projects.ProjectTaskDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentDTO;
import com._42students.lms.dto.projects.ProjectTaskCommentUpsertDTO;
import com._42students.lms.dto.projects.ProjectTaskUpsertDTO;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.ProjectWorkspaceService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectWorkspaceControllerTaskAccessIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private ProjectWorkspaceService projectWorkspaceService;

    @Mock
    private SecurityContextUtil securityContextUtil;

    @BeforeEach
    void setUp() {
        ProjectWorkspaceController controller = new ProjectWorkspaceController(projectWorkspaceService, securityContextUtil);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/projects/{projectId}/tasks/items returns project tasks for enrolled user")
    void getProjectTasks_returnsTasks() throws Exception {
        UserPrincipal faculty = new UserPrincipal(16, "FACULTY", null, 6, 6, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(projectWorkspaceService.getProjectTasks(faculty, "proj-1", null, null, null, null))
                .thenReturn(Collections.singletonList(new ProjectTaskDTO()));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/projects/proj-1/tasks/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"));

        verify(projectWorkspaceService).getProjectTasks(faculty, "proj-1", null, null, null, null);
    }

    @Test
    @DisplayName("POST /api/v1/projects/{projectId}/tasks/items is blocked when user lacks access")
    void addProjectTask_forbidden_returns403() throws Exception {
        UserPrincipal faculty = new UserPrincipal(16, "FACULTY", null, 6, 6, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        doThrow(new AccessDeniedException("Access denied to this project"))
                .when(projectWorkspaceService).upsertProjectTask(eq(faculty), eq("proj-1"), any(ProjectTaskUpsertDTO.class));

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/projects/proj-1/tasks/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(new ProjectTaskUpsertDTO())))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("Access denied to this project"));
    }

    @Test
    @DisplayName("DELETE /api/v1/projects/{projectId}/tasks/items/{taskId} reaches task delete service")
    void removeProjectTask_reachesService() throws Exception {
        UserPrincipal faculty = new UserPrincipal(16, "FACULTY", null, 6, 6, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(projectWorkspaceService.removeProjectTask(faculty, "proj-1", "99"))
                .thenReturn(Collections.singletonList(new ProjectTaskDTO()));

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/projects/proj-1/tasks/items/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"));

        verify(projectWorkspaceService).removeProjectTask(faculty, "proj-1", "99");
    }

    @Test
    @DisplayName("POST /api/v1/projects/{projectId}/tasks/items/{taskId}/comments reaches task comment service")
    void addProjectTaskComment_reachesService() throws Exception {
        UserPrincipal faculty = new UserPrincipal(16, "FACULTY", null, 6, 6, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(projectWorkspaceService.addProjectTaskComment(eq(faculty), eq("proj-1"), eq("99"), any(ProjectTaskCommentUpsertDTO.class)))
                .thenReturn(Collections.singletonList(new ProjectTaskCommentDTO()));
        ProjectTaskCommentUpsertDTO comment = new ProjectTaskCommentUpsertDTO();
        comment.setMessage("Reviewed the task");

        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/projects/proj-1/tasks/items/99/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(comment)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"));

        verify(projectWorkspaceService).addProjectTaskComment(eq(faculty), eq("proj-1"), eq("99"), any(ProjectTaskCommentUpsertDTO.class));
    }

    @Test
    @DisplayName("POST project comment rejects empty message before calling service")
    void addProjectTaskComment_emptyMessage_returns400() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/projects/proj-1/tasks/items/99/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(new ObjectMapper().writeValueAsString(new ProjectTaskCommentUpsertDTO())))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(projectWorkspaceService);
    }

    @Test
    @DisplayName("GET /api/v1/projects/{projectId}/tasks/items/{taskId}/comments reaches comments service")
    void getProjectTaskComments_reachesService() throws Exception {
        UserPrincipal faculty = new UserPrincipal(16, "FACULTY", null, 6, 6, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(projectWorkspaceService.getProjectTaskComments(faculty, "proj-1", "99"))
                .thenReturn(Collections.singletonList(new ProjectTaskCommentDTO()));

        mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/projects/proj-1/tasks/items/99/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OK"));

        verify(projectWorkspaceService).getProjectTaskComments(faculty, "proj-1", "99");
    }
}
