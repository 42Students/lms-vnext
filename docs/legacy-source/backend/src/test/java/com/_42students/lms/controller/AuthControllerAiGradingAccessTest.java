package com._42students.lms.controller;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** BE-0188/BE-0189: the AI-grading gate is the backend's verified session, staff only, with a daily allowance. */
class AuthControllerAiGradingAccessTest {

    private MockMvc mockMvc;
    private SecurityContextUtil securityContextUtil;

    @BeforeEach
    void setup() {
        AuthController controller = new AuthController();
        securityContextUtil = mock(SecurityContextUtil.class);
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void noVerifiedSessionIsRefused() throws Exception {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(null);
        mockMvc.perform(get("/api/v1/auth/ai-grading-access")).andExpect(status().isUnauthorized());
    }

    @Test
    void aLearnerIsRefused() throws Exception {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(5, "LEARNER", null, 1, 1, 0));
        mockMvc.perform(get("/api/v1/auth/ai-grading-access").param("use", "true")).andExpect(status().isForbidden());
    }

    @Test
    void facultyPassesUntilTheDailyAllowanceIsUsed() throws Exception {
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(7, "FACULTY", "TEACHER", 1, 1, 0));
        mockMvc.perform(get("/api/v1/auth/ai-grading-access"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingToday").value(AuthController.AI_GRADING_DAILY_LIMIT));
        for (int i = 0; i < AuthController.AI_GRADING_DAILY_LIMIT; i++) {
            mockMvc.perform(get("/api/v1/auth/ai-grading-access").param("use", "true")).andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/v1/auth/ai-grading-access").param("use", "true")).andExpect(status().isTooManyRequests());
        // Checking (no use) still answers, with nothing left.
        mockMvc.perform(get("/api/v1/auth/ai-grading-access"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingToday").value(0));
    }
}
