package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.dto.request.AnnouncementCreateRequest;
import com._42students.lms.dto.response.AnnouncementResponseDTO;
import com._42students.lms.enums.AnnouncementType;
import com._42students.lms.exceptions.GlobalExceptionHandler;
import com._42students.lms.model.Announcement;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.AnnouncementService;
import com._42students.lms.service.FacultyService;
import com._42students.lms.util.SecurityContextUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com._42students.lms.dto.response.PageDTO;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for AnnouncementController covering all endpoints and edge cases.
 */
@ExtendWith(MockitoExtension.class)
class AnnouncementControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private AnnouncementService announcementService;

    @Mock
    private AccessControlService accessControlService;

    @Mock
    private SecurityContextUtil securityContextUtil;

    @Mock
    private FacultyService facultyService;

    @Mock
    private ScopeResolutionService scopeResolutionService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static Announcement announcement(long id, AnnouncementType type, Long value) {
        Announcement a = new Announcement();
        a.setId(id);
        a.setReceiverType(type);
        a.setReceiverValue(value);
        a.setTitle("Test Title");
        a.setMessage("Test Message");
        a.setSenderType("ADMIN");
        a.setSenderId(1L);
        a.setIsDeleted(false);
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        return a;
    }

    private static AnnouncementCreateRequest validRequest(AnnouncementType type, Long value) {
        AnnouncementCreateRequest r = new AnnouncementCreateRequest();
        r.setReceiverType(type);
        r.setReceiverValue(value);
        r.setTitle("Title");
        r.setMessage("Message");
        r.setSenderId(1L);
        r.setSenderType("FACULTY");
        return r;
    }

    @BeforeEach
    void setUp() {
        AnnouncementController controller = new AnnouncementController(announcementService);
        ReflectionTestUtils.setField(controller, "accessControlService", accessControlService);
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "facultyService", facultyService);
        ReflectionTestUtils.setField(controller, "scopeResolutionService", scopeResolutionService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ==================== POST /create ====================

    @Nested
    @DisplayName("POST /api/v1/announcements/create")
    class CreateAnnouncement {

        @Test
        @DisplayName("returns 200 when COLLEGE announcement created with access")
        void create_college_withAccess_returns200() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            Announcement saved = announcement(1L, AnnouncementType.COLLEGE, 1L);
            when(announcementService.createAnnouncement(any(AnnouncementCreateRequest.class))).thenReturn(saved);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("OK"))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.receiverType").value("COLLEGE"))
                    .andExpect(jsonPath("$.data.title").value("Test Title"));
        }

        @Test
        @DisplayName("returns 403 when COLLEGE and access denied")
        void create_college_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied to this college"))
                    .when(accessControlService).requireAccessCollege(eq(principal), eq(2));
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 2L);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("Access denied to this college"));
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 403 when DEPARTMENT and access denied")
        void create_department_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessDepartment(any(), eq(99));
            AnnouncementCreateRequest req = validRequest(AnnouncementType.DEPARTMENT, 99L);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 403 when PROGRAM and access denied")
        void create_program_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessProgram(any(), eq(5L));
            AnnouncementCreateRequest req = validRequest(AnnouncementType.PROGRAM, 5L);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 403 when CLASS and access denied")
        void create_class_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessClass(any(), eq(10));
            AnnouncementCreateRequest req = validRequest(AnnouncementType.CLASS, 10L);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 403 when LEARNER and access denied")
        void create_learner_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessLearner(any(), eq(100));
            AnnouncementCreateRequest req = validRequest(AnnouncementType.LEARNER, 100L);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("a fully-null receiver is rejected before any access check runs")
        void create_nullReceiverTypeAndValue_returns400() throws Exception {
            // receiverType is @NotNull: a null type has no audience and would otherwise slip past
            // the per-receiver access check entirely, so it is rejected before the service is hit.
            AnnouncementCreateRequest req = new AnnouncementCreateRequest();
            req.setReceiverType(null);
            req.setReceiverValue(null);
            req.setTitle("Title");
            req.setMessage("Message");

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
            verify(announcementService, never()).createAnnouncement(any());
            verify(accessControlService, never()).requireAccessCollege(any(), anyInt());
        }

        @Test
        @DisplayName("returns 400 when title is blank")
        void create_blankTitle_returns400() throws Exception {
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            req.setTitle("");

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value("error"))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("title")));
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 400 when message is blank")
        void create_blankMessage_returns400() throws Exception {
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            req.setMessage("");

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("message")));
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 400 when receiverType is null")
        void create_nullReceiverType_returns400() throws Exception {
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            req.setReceiverType(null);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("receiverType")));
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 400 when receiverValue is null")
        void create_nullReceiverValue_returns400() throws Exception {
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            req.setReceiverValue(null);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("receiverValue")));
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 400 when title is null")
        void create_nullTitle_returns400() throws Exception {
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            req.setTitle(null);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
            verify(announcementService, never()).createAnnouncement(any());
        }

        @Test
        @DisplayName("returns 400 when message is null")
        void create_nullMessage_returns400() throws Exception {
            AnnouncementCreateRequest req = validRequest(AnnouncementType.COLLEGE, 1L);
            req.setMessage(null);

            mockMvc.perform(MockMvcRequestBuilders.post("/api/v1/announcements/create")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
            verify(announcementService, never()).createAnnouncement(any());
        }
    }

    // ==================== GET /fetchAll ====================

    @Nested
    @DisplayName("GET /api/v1/announcements/fetchAll")
    class FetchAll {

        private PageDTO<AnnouncementResponseDTO> page(List<AnnouncementResponseDTO> records, int pageNumber, int pageSize) {
            PageDTO<AnnouncementResponseDTO> dto = new PageDTO<>();
            dto.setRecords(records);
            dto.setPageNumber(pageNumber);
            dto.setPageSize(pageSize);
            dto.setTotalRecords(records.size());
            return dto;
        }

        @Test
        @DisplayName("returns 200 when super-admin fetches all")
        void fetchAll_superAdmin_returns200() throws Exception {
            UserPrincipal superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
            when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
            List<AnnouncementResponseDTO> dtos = Collections.singletonList(new AnnouncementResponseDTO(announcement(1L, AnnouncementType.COLLEGE, 1L)));
            when(announcementService.findAllScopedPaged(null, null, 0, 20)).thenReturn(page(dtos, 0, 20));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchAll")
                            .param("pageNumber", "0")
                            .param("pageSize", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("OK"))
                    .andExpect(jsonPath("$.data.records.length()").value(1))
                    .andExpect(jsonPath("$.data.totalRecords").value(1));
        }

        @Test
        @DisplayName("college admin gets 200 scoped to their own college, never another's")
        void fetchAll_collegeAdmin_scopedToOwnCollege() throws Exception {
            UserPrincipal collegeAdmin = new UserPrincipal(1, "FACULTY", "ADMIN", 7, 3, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(collegeAdmin);
            when(accessControlService.isSuperAdmin(collegeAdmin)).thenReturn(false);
            when(accessControlService.canPerformAdminActionForCollege(collegeAdmin, 3)).thenReturn(true);
            when(announcementService.findAllScopedPaged(7, 3, 0, 20)).thenReturn(page(Collections.emptyList(), 0, 20));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchAll"))
                    .andExpect(status().isOk());

            // Scope args come from the principal, never from the request.
            verify(announcementService).findAllScopedPaged(7, 3, 0, 20);
        }

        @Test
        @DisplayName("returns 403 when caller is not an admin")
        void fetchAll_nonAdmin_returns403() throws Exception {
            UserPrincipal learner = new UserPrincipal(1, "LEARNER", null, 7, 3, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
            when(accessControlService.isSuperAdmin(learner)).thenReturn(false);
            when(accessControlService.canPerformAdminActionForCollege(learner, 3)).thenReturn(false);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchAll"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Admin access required")));
            verify(announcementService, never()).findAllScopedPaged(any(), any(), anyInt(), anyInt());
        }

        @Test
        @DisplayName("returns 200 with empty records when no announcements")
        void fetchAll_emptyList_returns200Empty() throws Exception {
            UserPrincipal superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
            when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
            when(announcementService.findAllScopedPaged(null, null, 0, 20)).thenReturn(page(Collections.emptyList(), 0, 20));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchAll"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.records.length()").value(0))
                    .andExpect(jsonPath("$.data.totalRecords").value(0));
        }

        @Test
        @DisplayName("pagination params are forwarded verbatim (clamping lives in the service)")
        void fetchAll_forwardsPaginationParams() throws Exception {
            UserPrincipal superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
            when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
            when(announcementService.findAllScopedPaged(null, null, -1, 10)).thenReturn(page(Collections.emptyList(), 0, 10));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchAll")
                            .param("pageNumber", "-1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.pageNumber").value(0));

            verify(announcementService).findAllScopedPaged(null, null, -1, 10);
        }

        @Test
        @DisplayName("uses default pageNumber 0 and pageSize 20 when not provided")
        void fetchAll_defaultParams() throws Exception {
            UserPrincipal superAdmin = new UserPrincipal(0, "FACULTY", "ADMIN", null, null, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
            when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
            when(announcementService.findAllScopedPaged(null, null, 0, 20))
                    .thenReturn(page(Collections.emptyList(), 0, 20));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchAll"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.pageNumber").value(0))
                    .andExpect(jsonPath("$.data.pageSize").value(20));

            verify(announcementService).findAllScopedPaged(null, null, 0, 20);
        }
    }

    // ==================== GET /fetch/{id} ====================

    @Nested
    @DisplayName("GET /api/v1/announcements/fetch/{id}")
    class FetchById {

        @Test
        @DisplayName("returns 200 when announcement exists and principal has access")
        void fetchById_exists_withAccess_returns200() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            Announcement a = announcement(10L, AnnouncementType.COLLEGE, 1L);
            when(announcementService.findById(10L)).thenReturn(Optional.of(a));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetch/10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("OK"))
                    .andExpect(jsonPath("$.data.id").value(10))
                    .andExpect(jsonPath("$.data.title").value("Test Title"));
        }

        @Test
        @DisplayName("returns 404 when announcement does not exist")
        void fetchById_notExists_returns404() throws Exception {
            when(announcementService.findById(999L)).thenReturn(Optional.empty());

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetch/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value("NOT_FOUND"))
                    .andExpect(jsonPath("$.message").value("Announcement not found"));
        }

        @Test
        @DisplayName("returns 403 when announcement exists but access denied")
        void fetchById_exists_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            Announcement a = announcement(10L, AnnouncementType.COLLEGE, 2L);
            when(announcementService.findById(10L)).thenReturn(Optional.of(a));
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessCollege(eq(principal), eq(2));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetch/10"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("FORBIDDEN"));
        }

        @Test
        @DisplayName("returns 200 when announcement has null receiverType (skips access check)")
        void fetchById_nullReceiverType_skipsAccessCheck_returns200() throws Exception {
            Announcement a = announcement(10L, null, null);
            when(announcementService.findById(10L)).thenReturn(Optional.of(a));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetch/10"))
                    .andExpect(status().isOk());
            verify(accessControlService, never()).requireAccessCollege(any(), anyInt());
        }
    }

    // ==================== PUT /update/{id} ====================

    @Nested
    @DisplayName("PUT /api/v1/announcements/update/{id}")
    class UpdateAnnouncement {

        @Test
        @DisplayName("returns 200 when update succeeds")
        void update_success_returns200() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            Announcement existing = announcement(5L, AnnouncementType.COLLEGE, 1L);
            Announcement updated = announcement(5L, AnnouncementType.COLLEGE, 1L);
            updated.setTitle("Updated Title");
            when(announcementService.findById(5L)).thenReturn(Optional.of(existing));
            when(announcementService.updateAnnouncement(eq(5L), any(AnnouncementCreateRequest.class))).thenReturn(updated);

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/announcements/update/5")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest(AnnouncementType.COLLEGE, 1L))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.title").value("Updated Title"));
        }

        @Test
        @DisplayName("returns 404 when announcement does not exist")
        void update_notExists_returns404() throws Exception {
            when(announcementService.findById(999L)).thenReturn(Optional.empty());

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/announcements/update/999")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest(AnnouncementType.COLLEGE, 1L))))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value("NOT_FOUND"));
        }

        @Test
        @DisplayName("returns 403 when principal has no access to announcement")
        void update_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            Announcement a = announcement(5L, AnnouncementType.COLLEGE, 99L);
            when(announcementService.findById(5L)).thenReturn(Optional.of(a));
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessCollege(eq(principal), eq(99));

            mockMvc.perform(MockMvcRequestBuilders.put("/api/v1/announcements/update/5")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validRequest(AnnouncementType.COLLEGE, 99L))))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).updateAnnouncement(any(), any());
        }
    }

    // ==================== DELETE /delete/{id} ====================

    @Nested
    @DisplayName("DELETE /api/v1/announcements/delete/{id}")
    class DeleteAnnouncement {

        @Test
        @DisplayName("returns 200 when delete succeeds")
        void delete_success_returns200() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            Announcement a = announcement(5L, AnnouncementType.COLLEGE, 1L);
            when(announcementService.findById(5L)).thenReturn(Optional.of(a));

            mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/announcements/delete/5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("OK"))
                    .andExpect(jsonPath("$.message").value("Announcement deleted successfully"));
            verify(announcementService).deleteAnnouncement(5L);
        }

        @Test
        @DisplayName("returns 404 when announcement does not exist")
        void delete_notExists_returns404() throws Exception {
            when(announcementService.findById(999L)).thenReturn(Optional.empty());
            doThrow(new RuntimeException("Announcement not found with id 999"))
                    .when(announcementService).deleteAnnouncement(999L);

            mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/announcements/delete/999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value("NOT_FOUND"))
                    .andExpect(jsonPath("$.message").value("Announcement not found with id 999"));
        }

        @Test
        @DisplayName("returns 403 when principal has no access")
        void delete_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            Announcement a = announcement(5L, AnnouncementType.COLLEGE, 99L);
            when(announcementService.findById(5L)).thenReturn(Optional.of(a));
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessCollege(eq(principal), eq(99));

            mockMvc.perform(MockMvcRequestBuilders.delete("/api/v1/announcements/delete/5"))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).deleteAnnouncement(any());
        }
    }

    // ==================== GET /forLearner ====================

    @Nested
    @DisplayName("GET /api/v1/announcements/forLearner")
    class ForLearner {

        @Test
        @DisplayName("returns 200 with announcements when learner has scope")
        void forLearner_learnerWithScope_returns200() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
            ResolvedLearnerScope scope = ResolvedLearnerScope.builder()
                    .learnerId(42)
                    .collegeId(1)
                    .programId(2)
                    .classId(3)
                    .build();
            when(scopeResolutionService.resolveFullScope(42)).thenReturn(scope);
            List<AnnouncementResponseDTO> dtos = Collections.singletonList(
                    new AnnouncementResponseDTO(announcement(1L, AnnouncementType.COLLEGE, 1L)));
            when(announcementService.fetchLearnerAnnouncements(eq(1L), eq(2L), eq(3L), eq(42L))).thenReturn(dtos);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("OK"))
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].id").value(1));
        }

        @Test
        @DisplayName("returns 403 when principal is faculty")
        void forLearner_facultyPrincipal_returns403() throws Exception {
            UserPrincipal faculty = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("Learners only"));
            verify(scopeResolutionService, never()).resolveFullScope(any(Integer.class));
        }

        @Test
        @DisplayName("returns 403 when principal is null")
        void forLearner_nullPrincipal_returns403() throws Exception {
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(null);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value("Learners only"));
        }

        @Test
        @DisplayName("returns 400 when learnerId is null")
        void forLearner_nullLearnerId_returns400() throws Exception {
            UserPrincipal learner = new UserPrincipal(null, "LEARNER", null, null, null, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Learner ID not found"));
        }

        @Test
        @DisplayName("returns 200 empty when scopeResolutionService is null")
        void forLearner_scopeServiceNull_returns200Empty() throws Exception {
            AnnouncementController controller = new AnnouncementController(announcementService);
            ReflectionTestUtils.setField(controller, "accessControlService", accessControlService);
            ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
            ReflectionTestUtils.setField(controller, "facultyService", facultyService);
            ReflectionTestUtils.setField(controller, "scopeResolutionService", null);
            mockMvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build();

            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));
        }

        @Test
        @DisplayName("returns 200 empty when scope has all null college/program/class")
        void forLearner_scopeAllNull_returns200Empty() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, null, null, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
            ResolvedLearnerScope scope = ResolvedLearnerScope.builder().learnerId(42).build();
            when(scopeResolutionService.resolveFullScope(42)).thenReturn(scope);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.length()").value(0));
            verify(announcementService, never()).fetchLearnerAnnouncements(any(), any(), any(), any());
        }

        @Test
        @DisplayName("passes 0 for null scope values when calling fetchLearnerAnnouncements")
        void forLearner_partialScope_passesZerosForNull() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
            ResolvedLearnerScope scope = ResolvedLearnerScope.builder()
                    .learnerId(42)
                    .collegeId(1)
                    .programId(null)
                    .classId(null)
                    .build();
            when(scopeResolutionService.resolveFullScope(42)).thenReturn(scope);
            when(announcementService.fetchLearnerAnnouncements(eq(1L), eq(0L), eq(0L), eq(42L)))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/forLearner"))
                    .andExpect(status().isOk());
        }
    }

    // ==================== GET /fetchLearnerAnnouncements ====================

    @Nested
    @DisplayName("GET /api/v1/announcements/fetchLearnerAnnouncements")
    class FetchLearnerAnnouncements {

        @Test
        @DisplayName("returns 200 with paginated records when college admin has access")
        void fetchLearner_collegeAdmin_returns200() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(accessControlService.canPerformAdminActionForCollege(principal, 1)).thenReturn(true);
            List<AnnouncementResponseDTO> dtos = Collections.singletonList(
                    new AnnouncementResponseDTO(announcement(1L, AnnouncementType.COLLEGE, 1L)));
            PageDTO<AnnouncementResponseDTO> pageDTO = new PageDTO<>();
            pageDTO.setRecords(dtos);
            pageDTO.setPageNumber(0);
            pageDTO.setPageSize(10);
            pageDTO.setTotalRecords(1);
            when(announcementService.fetchLearnerAnnouncementsPaged(1L, 2L, 3L, 42L, 0, 10)).thenReturn(pageDTO);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchLearnerAnnouncements")
                            .param("collegeId", "1")
                            .param("programId", "2")
                            .param("classId", "3")
                            .param("learnerId", "42"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.records.length()").value(1))
                    .andExpect(jsonPath("$.totalRecords").value(1));
        }

        @Test
        @DisplayName("learner cannot read another learner's feed: scope is re-derived from principal")
        void fetchLearner_learnerCannotSpoofAnotherLearner() throws Exception {
            UserPrincipal learner = new UserPrincipal(42, "LEARNER", null, 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
            ResolvedLearnerScope scope = ResolvedLearnerScope.builder()
                    .learnerId(42).collegeId(1).programId(2).classId(3).build();
            when(scopeResolutionService.resolveFullScope(42)).thenReturn(scope);
            when(announcementService.fetchLearnerAnnouncementsPaged(1L, 2L, 3L, 42L, 0, 10))
                    .thenReturn(new PageDTO<>());

            // Learner asks for someone else's ids entirely; all of them must be ignored.
            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchLearnerAnnouncements")
                            .param("collegeId", "1")
                            .param("programId", "999")
                            .param("classId", "888")
                            .param("learnerId", "777"))
                    .andExpect(status().isOk());

            verify(announcementService).fetchLearnerAnnouncementsPaged(1L, 2L, 3L, 42L, 0, 10);
            verify(announcementService, never()).fetchLearnerAnnouncementsPaged(1L, 999L, 888L, 777L, 0, 10);
        }

        @Test
        @DisplayName("returns 403 when access denied")
        void fetchLearner_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessCollege(eq(principal), eq(99));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchLearnerAnnouncements")
                            .param("collegeId", "99")
                            .param("programId", "2")
                            .param("classId", "3")
                            .param("learnerId", "42"))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).fetchLearnerAnnouncementsPaged(any(), any(), any(), any(), anyInt(), anyInt());
        }

        @Test
        @DisplayName("pagination: default pageNumber 0 and pageSize 10")
        void fetchLearner_defaultPagination() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(accessControlService.canPerformAdminActionForCollege(principal, 1)).thenReturn(true);
            PageDTO<AnnouncementResponseDTO> pageDTO = new PageDTO<>();
            pageDTO.setRecords(Collections.emptyList());
            pageDTO.setPageNumber(0);
            pageDTO.setPageSize(10);
            when(announcementService.fetchLearnerAnnouncementsPaged(1L, 2L, 3L, 42L, 0, 10)).thenReturn(pageDTO);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchLearnerAnnouncements")
                            .param("collegeId", "1")
                            .param("programId", "2")
                            .param("classId", "3")
                            .param("learnerId", "42"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.pageNumber").value(0))
                    .andExpect(jsonPath("$.pageSize").value(10));
        }
    }

    // ==================== GET /fetchFacultyAnnouncements ====================

    @Nested
    @DisplayName("GET /api/v1/announcements/fetchFacultyAnnouncements")
    class FetchFacultyAnnouncements {

        @Test
        @DisplayName("returns 200 with paginated records when college admin has access")
        void fetchFaculty_collegeAdmin_returns200() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(accessControlService.canPerformAdminActionForCollege(principal, 1)).thenReturn(true);
            List<AnnouncementResponseDTO> dtos = Collections.singletonList(
                    new AnnouncementResponseDTO(announcement(1L, AnnouncementType.COLLEGE, 1L)));
            PageDTO<AnnouncementResponseDTO> pageDTO = new PageDTO<>();
            pageDTO.setRecords(dtos);
            pageDTO.setTotalRecords(1);
            when(announcementService.fetchFacultyAnnouncementsPaged(1L, 0L, 0L, 0, 10)).thenReturn(pageDTO);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchFacultyAnnouncements")
                            .param("collegeId", "1")
                            .param("deptId", "0")
                            .param("facultyId", "0"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.records.length()").value(1));
        }

        @Test
        @DisplayName("returns 403 when access denied")
        void fetchFaculty_accessDenied_returns403() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            doThrow(new AccessDeniedException("Access denied")).when(accessControlService).requireAccessCollege(eq(principal), eq(99));

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchFacultyAnnouncements")
                            .param("collegeId", "99")
                            .param("deptId", "0")
                            .param("facultyId", "0"))
                    .andExpect(status().isForbidden());
            verify(announcementService, never()).fetchFacultyAnnouncementsPaged(any(), any(), any(), anyInt(), anyInt());
        }

        @Test
        @DisplayName("returns 200 with empty list when no announcements")
        void fetchFaculty_empty_returns200Empty() throws Exception {
            UserPrincipal principal = new UserPrincipal(1, "FACULTY", "ADMIN", 1, 1, 0);
            when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);
            when(accessControlService.canPerformAdminActionForCollege(principal, 1)).thenReturn(true);
            PageDTO<AnnouncementResponseDTO> pageDTO = new PageDTO<>();
            pageDTO.setRecords(Collections.emptyList());
            pageDTO.setTotalRecords(0);
            when(announcementService.fetchFacultyAnnouncementsPaged(1L, 0L, 0L, 0, 10)).thenReturn(pageDTO);

            mockMvc.perform(MockMvcRequestBuilders.get("/api/v1/announcements/fetchFacultyAnnouncements")
                            .param("collegeId", "1")
                            .param("deptId", "0")
                            .param("facultyId", "0"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.records.length()").value(0))
                    .andExpect(jsonPath("$.totalRecords").value(0));
        }
    }
}
