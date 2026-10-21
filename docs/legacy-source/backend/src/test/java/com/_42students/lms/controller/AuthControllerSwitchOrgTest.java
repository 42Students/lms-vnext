package com._42students.lms.controller;

import com._42students.lms.dto.response.TokenPair;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.AuthHandoffTokenRepository;
import com._42students.lms.repository.LearnerRepository;
import com._42students.lms.security.JwtService;
import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.OrgMembershipService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerSwitchOrgTest {

    private MockMvc mockMvc;
    private OrgMembershipService orgMembershipService;
    private SecurityContextUtil securityContextUtil;
    private JwtService jwtService;

    @BeforeEach
    void setup() {
        AuthController controller = new AuthController();

        orgMembershipService = mock(OrgMembershipService.class);
        securityContextUtil = mock(SecurityContextUtil.class);
        jwtService = mock(JwtService.class);
        LearnerRepository learnerRepository = mock(LearnerRepository.class);
        Learner targetLearner = new Learner();
        targetLearner.setId(99);
        targetLearner.setTokenVersion(3);
        when(learnerRepository.findById(99)).thenReturn(Optional.of(targetLearner));

        // Switching must resolve the target account's CURRENT token version, never inherit
        // the original principal's version or silently use zero when the target is missing.
        ReflectionTestUtils.setField(controller, "orgMembershipService", orgMembershipService);
        ReflectionTestUtils.setField(controller, "securityContextUtil", securityContextUtil);
        ReflectionTestUtils.setField(controller, "jwtService", jwtService);
        ReflectionTestUtils.setField(controller, "learnerRepository", learnerRepository);
        // No handoff repository: cross-host switches must fail before setting cookies.
        ReflectionTestUtils.setField(controller, "authHandoffTokenRepository", (AuthHandoffTokenRepository) null);

        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void returnsHandoffUnavailableWhenHostChangesAndHandoffCannotBeIssued() throws Exception {
        UserPrincipal principal = new UserPrincipal(10, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

        when(orgMembershipService.resolveTarget(eq(principal), anyString()))
                .thenReturn(Optional.of(Map.of(
                        "key", "abc",
                        "collegeId", 2,
                        "organizationId", 2,
                        "userId", 99,
                        "host", "tenant2.example.com"
                )));

        when(jwtService.generateTokens(any(UserPrincipal.class)))
                .thenAnswer(invocation -> {
                    UserPrincipal target = invocation.getArgument(0);
                    org.junit.jupiter.api.Assertions.assertEquals(99, target.getId());
                    org.junit.jupiter.api.Assertions.assertEquals(3, target.getTokenVersion());
                    return new TokenPair("access", "refresh", null, 900);
                });

        mockMvc.perform(
                        MockMvcRequestBuilders.post("/api/v1/auth/switch")
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("X-Forwarded-Host", "tenant1.example.com")
                                .content("{\"targetKey\":\"abc\"}")
                )
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("HANDOFF_UNAVAILABLE"));
    }

    @Test
    void returnsOkWhenSameHostEvenIfHandoffRepoMissing() throws Exception {
        UserPrincipal principal = new UserPrincipal(10, "LEARNER", null, 1, 1, 0);
        when(securityContextUtil.getAuthenticatedUserPrincipal()).thenReturn(principal);

        when(orgMembershipService.resolveTarget(eq(principal), anyString()))
                .thenReturn(Optional.of(Map.of(
                        "key", "abc",
                        "collegeId", 2,
                        "organizationId", 2,
                        "userId", 99,
                        "host", "tenant1.example.com"
                )));

        when(jwtService.generateTokens(any(UserPrincipal.class)))
                .thenAnswer(invocation -> {
                    UserPrincipal target = invocation.getArgument(0);
                    org.junit.jupiter.api.Assertions.assertEquals(99, target.getId());
                    org.junit.jupiter.api.Assertions.assertEquals(3, target.getTokenVersion());
                    return new TokenPair("access", "refresh", null, 900);
                });

        mockMvc.perform(
                        MockMvcRequestBuilders.post("/api/v1/auth/switch")
                                .contentType(MediaType.APPLICATION_JSON)
                                .header("Host", "tenant1.example.com")
                                .content("{\"targetKey\":\"abc\"}")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetHost").value("tenant1.example.com"))
                .andExpect(jsonPath("$.handoffToken").doesNotExist());
    }
}
