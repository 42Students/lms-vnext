package com._42students.lms.integration;

import com._42students.lms.dto.response.TokenPair;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** One-time and expiry semantics for cross-host authentication handoff tokens. */
class AuthHandoffLifecycleMySqlIT extends AbstractMySqlHttpIT {

    private static final int COLLEGE = 109721;
    private static final int LEARNER = 109722;
    private static final String PREFIX = "it-handoff-";

    @AfterEach
    void cleanup() {
        jdbc.update("delete from auth_handoff_token where token like ?", PREFIX + "%");
        jdbc.update("delete from learner where id = ?", LEARNER);
        jdbc.update("delete from college where id = ?", COLLEGE);
    }

    @Test
    void handoffTokenCanBeConsumedExactlyOnce() throws Exception {
        seedCollege(COLLEGE, "Handoff IT College");
        seedLearner(LEARNER, COLLEGE, "HandoffLearner");
        TokenPair pair = jwtService.generateTokens(learnerPrincipal(LEARNER, COLLEGE));
        String token = PREFIX + "once";
        insert(token, pair, LocalDateTime.now().plusMinutes(2));

        String first = mvc.perform(post("/api/v1/auth/handoff/consume")
                        .contentType("application/json")
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertTrue(first.contains("\"ok\":true"), first);
        assertEquals(1, used(token));

        mvc.perform(post("/api/v1/auth/handoff/consume")
                        .contentType("application/json")
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void expiredHandoffIsBurnedAndSubsequentAttemptIsInvalid() throws Exception {
        seedCollege(COLLEGE, "Handoff Expiry IT College");
        seedLearner(LEARNER, COLLEGE, "ExpiredHandoffLearner");
        TokenPair pair = jwtService.generateTokens(learnerPrincipal(LEARNER, COLLEGE));
        String token = PREFIX + "expired";
        insert(token, pair, LocalDateTime.now().minusSeconds(1));

        mvc.perform(post("/api/v1/auth/handoff/consume")
                        .contentType("application/json")
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isGone());

        assertEquals(1, used(token));

        mvc.perform(post("/api/v1/auth/handoff/consume")
                        .contentType("application/json")
                        .content("{\"token\":\"" + token + "\"}"))
                .andExpect(status().isNotFound());
    }

    private void insert(String token, TokenPair pair, LocalDateTime expiry) {
        jdbc.update("insert into auth_handoff_token "
                        + "(token, access_token, refresh_token, expires_at, used, is_deleted, created_at, updated_at) "
                        + "values (?, ?, ?, ?, 0, 0, now(), now())",
                token, pair.getAccessToken(), pair.getRefreshToken(), expiry);
    }

    private int used(String token) {
        Integer value = jdbc.queryForObject(
                "select used from auth_handoff_token where token = ?", Integer.class, token);
        return value == null ? -1 : value;
    }
}
