package com._42students.lms.controller;

import com._42students.lms.access.AccessControlService;
import com._42students.lms.dto.request.GcpLogDetailRequest;
import com._42students.lms.dto.request.GcpLogExportRequest;
import com._42students.lms.dto.request.GcpLogQueryRequest;
import com._42students.lms.dto.response.GcpLogEntryResponse;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.GcpCloudLoggingService;
import com._42students.lms.service.impl.LogAlertAdminService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SuperAdminLogsControllerTest {
    @Test
    void deniesNonSuperAdminBeforeCallingCloudLogging() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal faculty = new UserPrincipal(42, "FACULTY", "ADMIN", 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(accessControlService.isSuperAdmin(faculty)).thenReturn(false);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        assertThrows(AccessDeniedException.class, () ->
                controller.query(new GcpLogQueryRequest()));
        verifyNoInteractions(loggingService);
    }

    @Test
    void exportDeniesNonSuperAdminBeforeCallingCloudLogging() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal faculty = new UserPrincipal(42, "FACULTY", "ADMIN", 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(accessControlService.isSuperAdmin(faculty)).thenReturn(false);

        SuperAdminLogsController controller = new SuperAdminLogsController(
                loggingService, securityContextUtil, accessControlService, logAlertAdminService,
                new com.fasterxml.jackson.databind.ObjectMapper());

        assertThrows(AccessDeniedException.class, () -> controller.export(new GcpLogExportRequest()));
        verifyNoInteractions(loggingService);
    }

    @Test
    void exportReturnsNdjsonWithAttachmentHeadersAndAMetaTrailerLine() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);

        Instant since = Instant.parse("2026-09-26T10:00:00Z");
        Instant until = Instant.parse("2026-09-26T11:00:00Z");
        GcpLogEntryResponse entry = GcpLogEntryResponse.builder()
                .insertId("abc").severity("ERROR").message("boom").build();
        GcpCloudLoggingService.ExportResult result = new GcpCloudLoggingService.ExportResult(
                List.of(entry), false, "PRODUCTION", since, until);
        when(loggingService.export(any())).thenReturn(result);

        SuperAdminLogsController controller = new SuperAdminLogsController(
                loggingService, securityContextUtil, accessControlService, logAlertAdminService,
                new com.fasterxml.jackson.databind.ObjectMapper());

        ResponseEntity<byte[]> response = controller.export(new GcpLogExportRequest());

        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getHeaders().getContentDisposition().isAttachment());
        assertTrue(response.getHeaders().getContentDisposition().getFilename().startsWith("lms-logs_PRODUCTION_"));
        String body = new String(response.getBody(), java.nio.charset.StandardCharsets.UTF_8);
        String[] lines = body.strip().split("\n");
        assertEquals(2, lines.length, "one log line plus one trailing _meta line");
        assertTrue(lines[0].contains("\"boom\""));
        assertTrue(lines[1].contains("\"_meta\":true"));
        assertTrue(lines[1].contains("\"truncated\":false"));
    }

    @Test
    void postQueryUsesBodyInsteadOfUrlSearchParameters() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        GcpLogQueryRequest request = new GcpLogQueryRequest();
        request.setEnvironment("PRODUCTION");
        request.setSearch("CourseService");
        controller.query(request);

        verify(loggingService).search(request);
    }

    @Test
    void detailIsAlsoSuperAdminProtected() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        GcpLogDetailRequest request = new GcpLogDetailRequest();
        request.setEnvironment("PRODUCTION");
        request.setInsertId("abc");
        request.setLogName("projects/students-384817/logs/stdout");
        controller.detail(request);

        verify(loggingService).detail(request);
    }
    @Test
    void knownErrorsIsSuperAdminProtected() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal faculty = new UserPrincipal(42, "FACULTY", "ADMIN", 1, 2, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(faculty);
        when(accessControlService.isSuperAdmin(faculty)).thenReturn(false);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        assertThrows(AccessDeniedException.class, () -> controller.knownErrors("PRODUCTION"));
        verifyNoInteractions(logAlertAdminService);
    }

    @Test
    void knownErrorsDelegatesToTheAdminServiceForTheGivenEnvironment() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        controller.knownErrors("UAT");

        verify(logAlertAdminService).listKnownErrors("UAT");
    }

    @Test
    void muteByIdReturns404WhenSignatureDoesNotExist() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(logAlertAdminService.setMutedById(404L, true)).thenReturn(false);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        var response = controller.muteById(404L, java.util.Map.of("muted", true));

        assertEquals(404, response.getStatusCodeValue());
    }

    @Test
    void muteByIdDelegatesTheMutedFlagToTheAdminService() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);

        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(logAlertAdminService.setMutedById(5L, true, "crawler noise")).thenReturn(true);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        var response = controller.muteById(5L, java.util.Map.of("muted", true, "reason", "crawler noise"));

        assertEquals(200, response.getStatusCodeValue());
        verify(logAlertAdminService).setMutedById(5L, true, "crawler noise");
    }

    @Test
    void muteByIdWithoutAReasonStillWorks() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);
        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(logAlertAdminService.setMutedById(5L, false, null)).thenReturn(true);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        assertEquals(200, controller.muteById(5L, java.util.Map.of("muted", false)).getStatusCodeValue());
    }

    @Test
    void statusEndpointRejectsAnUnknownStatusWith400AndAMissingErrorWith404() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        LogAlertAdminService logAlertAdminService = mock(LogAlertAdminService.class);
        UserPrincipal superAdmin = UserPrincipal.forSuperAdmin();
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(superAdmin);
        when(accessControlService.isSuperAdmin(superAdmin)).thenReturn(true);
        when(logAlertAdminService.setStatus(eq(1L), eq("DONE"), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("status must be one of"));
        when(logAlertAdminService.setStatus(eq(2L), eq("FIXED"), any(), any(), any()))
                .thenReturn(java.util.Optional.empty());

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, logAlertAdminService, new com.fasterxml.jackson.databind.ObjectMapper());

        com._42students.lms.dto.request.LogStatusRequest bad = new com._42students.lms.dto.request.LogStatusRequest();
        bad.setStatus("DONE");
        com._42students.lms.dto.request.LogStatusRequest fixed = new com._42students.lms.dto.request.LogStatusRequest();
        fixed.setStatus("FIXED");

        assertEquals(400, controller.setStatus(1L, bad).getStatusCodeValue());
        assertEquals(404, controller.setStatus(2L, fixed).getStatusCodeValue());
    }

    @Test
    void newAdminEndpointsAreSuperAdminOnly() {
        GcpCloudLoggingService loggingService = mock(GcpCloudLoggingService.class);
        SecurityContextUtil securityContextUtil = mock(SecurityContextUtil.class);
        AccessControlService accessControlService = mock(AccessControlService.class);
        UserPrincipal learner = new UserPrincipal(5, "LEARNER", null, null, null, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(learner);
        when(accessControlService.isSuperAdmin(learner)).thenReturn(false);

        SuperAdminLogsController controller =
                new SuperAdminLogsController(loggingService, securityContextUtil, accessControlService, mock(LogAlertAdminService.class), new com.fasterxml.jackson.databind.ObjectMapper());

        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.context(null));
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.deploys("PRODUCTION", 7));
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.digest(24));
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.sendDigest());
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.deployHealth(java.util.Map.of("at", "2026-09-28T10:00:00Z")));
        org.junit.jupiter.api.Assertions.assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> controller.setStatus(1L, new com._42students.lms.dto.request.LogStatusRequest()));
    }

    @Test
    void searchAndDetailStayPostOnly() {
        // The concern this guards is free-text search ending up in a URL/browser history, not
        // GetMapping in general -- /status (added alongside the alerting work) takes no
        // parameters at all, so it doesn't reintroduce that risk.
        java.util.List<String> getMappedMethodNames = java.util.Arrays.stream(SuperAdminLogsController.class.getDeclaredMethods())
                .filter(method -> method.isAnnotationPresent(org.springframework.web.bind.annotation.GetMapping.class))
                .map(java.lang.reflect.Method::getName)
                .collect(java.util.stream.Collectors.toList());

        org.junit.jupiter.api.Assertions.assertFalse(getMappedMethodNames.contains("query"));
        org.junit.jupiter.api.Assertions.assertFalse(getMappedMethodNames.contains("detail"));
    }

}
