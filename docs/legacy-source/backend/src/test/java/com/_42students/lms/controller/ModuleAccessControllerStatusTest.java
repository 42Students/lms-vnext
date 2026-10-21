package com._42students.lms.controller;

import com._42students.lms.service.ModuleAccessService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ModuleAccessControllerStatusTest {

    @Test
    void settingsStoreUnavailableRemainsServiceUnavailable() {
        ModuleAccessService service = mock(ModuleAccessService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(null);
        when(service.getCollegeTree(null, 7)).thenThrow(
                new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "OPTIONAL_MODULE_SETTINGS_UNAVAILABLE"));

        ResponseEntity<?> response = new ModuleAccessController(service, security).getTree(7);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }

    @Test
    void invalidStoredSettingRemainsServiceUnavailableOnNodeRead() {
        ModuleAccessService service = mock(ModuleAccessService.class);
        SecurityContextUtil security = mock(SecurityContextUtil.class);
        when(security.getAuthenticatedUserPrincipal()).thenReturn(null);
        when(service.getNode(null, "COLLEGE", 7)).thenThrow(
                new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "INVALID_OPTIONAL_MODULE_SETTING"));

        ResponseEntity<?> response = new ModuleAccessController(service, security)
                .getNode("COLLEGE", 7);

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }
}
