package com._42students.lms.integration;

import com._42students.lms.dto.response.TokenPair;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Real JWT + MySQL refresh/logout/session lifecycle.
 */
class AuthSessionLifecycleMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109701;
    private static final int LEARNER_A = 109711;
    private static final int LEARNER_B = 109712;
    private static final int FACULTY = 109713;

    @AfterEach
    void cleanup() {
        jdbc.update("delete from user_session where user_id in (?, ?, ?)", LEARNER_A, LEARNER_B, FACULTY);
        jdbc.update("delete from refresh_token_blocklist where user_id in (?, ?, ?)", LEARNER_A, LEARNER_B, FACULTY);
        jdbc.update("delete from learner where id in (?, ?)", LEARNER_A, LEARNER_B);
        jdbc.update("delete from faculty where id = ?", FACULTY);
        jdbc.update("delete from college where id = ?", COLLEGE);
    }

    private void seedBase() {
        seedCollege(COLLEGE, "Auth Session College");
        seedLearner(LEARNER_A, COLLEGE, "AuthLearnerA");
        seedLearner(LEARNER_B, COLLEGE, "AuthLearnerB");
        seedFaculty(FACULTY, COLLEGE, "AuthLecturer");
    }

    private TokenPair learnerTokens(int learnerId) {
        return jwtService.generateTokens(learnerPrincipal(learnerId, COLLEGE));
    }

    @Test
    void refreshRotatesTokenAndBlocklistsOldRefreshJti() throws Exception {
        seedBase();
        TokenPair original = learnerTokens(LEARNER_A);
        Claims oldClaims = jwtService.validateToken(original.getRefreshToken());

        String body = mvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"" + original.getRefreshToken() + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String newRefresh = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(body).get("refreshToken").asText();
        assertNotEquals(original.getRefreshToken(), newRefresh);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?",
                Integer.class, oldClaims.getId()));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?",
                Integer.class, jwtService.validateToken(newRefresh).getId()));
    }

    @Test
    void immediateDuplicateRefreshUsesGraceReplayInsteadOfMintingAnotherFamily() throws Exception {
        seedBase();
        TokenPair original = learnerTokens(LEARNER_A);

        String first = mvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"" + original.getRefreshToken() + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String second = mvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"" + original.getRefreshToken() + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        assertEquals(om.readTree(first).get("refreshToken").asText(),
                om.readTree(second).get("refreshToken").asText(),
                "grace replay must return the first rotation, not create a third token family");
    }

    @Test
    void tokenVersionChangeInvalidatesPreviouslyIssuedRefreshToken() throws Exception {
        seedBase();
        TokenPair original = learnerTokens(LEARNER_A);
        String oldJti = jwtService.validateToken(original.getRefreshToken()).getId();
        jdbc.update("update learner set token_version = token_version + 1 where id = ?", LEARNER_A);

        String body = mvc.perform(post("/api/v1/auth/refresh")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"" + original.getRefreshToken() + "\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertTrue(body.contains("Token invalidated"), body);
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?",
                Integer.class, oldJti));
    }

    @Test
    void logoutBlocklistsBothRefreshAndAccessTokensAndOldAccessStopsWorking() throws Exception {
        seedBase();
        TokenPair tokens = learnerTokens(LEARNER_A);
        String refreshJti = jwtService.validateToken(tokens.getRefreshToken()).getId();
        String accessJti = jwtService.validateToken(tokens.getAccessToken()).getId();

        mvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + tokens.getAccessToken())
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"" + tokens.getRefreshToken() + "\"}"))
                .andExpect(status().isOk());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?", Integer.class, refreshJti));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = ?", Integer.class, accessJti));

        mvc.perform(get("/api/v1/auth/memberships")
                        .header("Authorization", "Bearer " + tokens.getAccessToken()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void learnerCannotRevokeAnotherLearnersDeviceSession() throws Exception {
        seedBase();
        insertSession("victim-learner-session", LEARNER_B, "LEARNER");

        mvc.perform(delete("/api/v1/auth/sessions/victim-learner-session")
                        .header("Authorization", "Bearer " + learnerTokens(LEARNER_A).getAccessToken()))
                .andExpect(status().isForbidden());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from user_session where jti = 'victim-learner-session'",
                Integer.class));
    }

    @Test
    void ordinaryFacultyCannotRevokeAnotherUsersDeviceSession() throws Exception {
        seedBase();
        insertSession("victim-session-for-faculty-attack", LEARNER_B, "LEARNER");

        mvc.perform(delete("/api/v1/auth/sessions/victim-session-for-faculty-attack")
                        .header("Authorization", "Bearer "
                                + accessToken(facultyPrincipal(FACULTY, "LECTURER", COLLEGE))))
                .andExpect(status().isForbidden());

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from user_session where jti = 'victim-session-for-faculty-attack'",
                Integer.class));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = 'victim-session-for-faculty-attack'",
                Integer.class));
    }

    @Test
    void learnerCanRevokeOwnDeviceSessionAndJtiIsBlocklisted() throws Exception {
        seedBase();
        insertSession("own-device-session", LEARNER_A, "LEARNER");

        mvc.perform(delete("/api/v1/auth/sessions/own-device-session")
                        .header("Authorization", "Bearer " + learnerTokens(LEARNER_A).getAccessToken()))
                .andExpect(status().isOk());

        assertEquals(0, jdbc.queryForObject(
                "select count(*) from user_session where jti = 'own-device-session'",
                Integer.class));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from refresh_token_blocklist where jti = 'own-device-session'",
                Integer.class));
    }

    private void insertSession(String jti, int userId, String userType) {
        jdbc.update("insert into user_session "
                        + "(jti, user_id, user_type, device_name, created_at, last_used_at, expires_at) "
                        + "values (?, ?, ?, 'Integration Device', now(), now(), ?)",
                jti, userId, userType, java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(7)));
    }
}
