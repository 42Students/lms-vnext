package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 13 Oct 2026: the placement cell's messages are emailed only when they wait unread, as one email, with a reply address. */
class RecruiterMessageEmailServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoMailService mail = mock(TpoMailService.class);
    private final TpoMessagesService messages = mock(TpoMessagesService.class);
    private final RecruiterMessageEmailService svc = new RecruiterMessageEmailService(jdbc, mail, messages);

    private Map<String, Object> conversation() {
        Map<String, Object> t = new HashMap<>();
        t.put("id", 9L); t.put("collegeId", 6); t.put("recruiterId", 2L); t.put("jobId", 46);
        t.put("company", "Omega Tech"); t.put("role", "Software Engineer"); t.put("email", "priya@omega.test"); t.put("name", "Priya");
        return t;
    }

    private Map<String, Object> msg(String body, int minute) {
        Map<String, Object> m = new HashMap<>();
        m.put("body", body); m.put("createdAt", LocalDateTime.of(2026, 10, 13, 5, minute)); m.put("sender", "Dr. K. Ramesh");
        return m;
    }

    @Test
    void oneEmailCarriesTheLatestThreeOldestFirstAndTheReplyAddress() {
        ReflectionTestUtils.setField(svc, "mailbox", "hello@42lms.com");
        ReflectionTestUtils.setField(svc, "replyTag", "r");
        when(jdbc.queryForList(contains("m.read_at IS NULL ORDER BY m.id DESC"), any(MapSqlParameterSource.class)))
                .thenReturn(List.of(msg("Fourth", 4), msg("Third", 3), msg("Second", 2), msg("First", 1)));
        when(jdbc.update(contains("SET recruiter_emailed_at = NOW()"), any(MapSqlParameterSource.class))).thenReturn(1);
        when(messages.replyToken(9L)).thenReturn("0123456789abcdef0123");
        when(mail.collegeLink(6, "/recruiter/drives/46")).thenReturn("https://nsrit.42lms.com/recruiter/drives/46");
        when(mail.sendAsCollege(eq("recruiter-message"), eq("priya@omega.test"), anyMap(), eq(6), anyString())).thenReturn(TpoMailService.Result.SENT);

        assertTrue(svc.emailOne(conversation()));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, String>> merge = ArgumentCaptor.forClass(Map.class);
        verify(mail).sendAsCollege(eq("recruiter-message"), eq("priya@omega.test"), merge.capture(), eq(6), eq("hello+r-0123456789abcdef0123@42lms.com"));
        Map<String, String> m = merge.getValue();
        assertEquals("4 new messages", m.get("count"));
        assertEquals("Omega Tech · Software Engineer", m.get("subject"));
        assertEquals("Dr. K. Ramesh · 13 Oct, 10:32 AM\nSecond\n\nDr. K. Ramesh · 13 Oct, 10:33 AM\nThird\n\nDr. K. Ramesh · 13 Oct, 10:34 AM\nFourth", m.get("messages"));
        assertEquals("+ 1 earlier message in the conversation", m.get("more"));
    }

    @Test
    void anotherWorkerThatAlreadyClaimedItMeansNoSecondEmail() {
        when(jdbc.queryForList(contains("m.read_at IS NULL ORDER BY m.id DESC"), any(MapSqlParameterSource.class))).thenReturn(List.of(msg("Hi", 1)));
        when(jdbc.update(contains("SET recruiter_emailed_at = NOW()"), any(MapSqlParameterSource.class))).thenReturn(0);
        assertFalse(svc.emailOne(conversation()));
        verify(mail, never()).sendAsCollege(anyString(), anyString(), anyMap(), any(), any());
    }

    @Test
    void withoutTheTemplateTheConversationIsTriedAgainLater() {
        when(jdbc.queryForList(contains("m.read_at IS NULL ORDER BY m.id DESC"), any(MapSqlParameterSource.class))).thenReturn(List.of(msg("Hi", 1)));
        when(jdbc.update(contains("SET recruiter_emailed_at = NOW()"), any(MapSqlParameterSource.class))).thenReturn(1);
        when(mail.sendAsCollege(anyString(), anyString(), anyMap(), any(), any())).thenReturn(TpoMailService.Result.NOT_CONFIGURED);
        assertFalse(svc.emailOne(conversation()));
        verify(jdbc).update(contains("SET recruiter_emailed_at = NULL"), any(MapSqlParameterSource.class));
    }

    @Test
    void theRulesAreInTheQuery() {
        String q = RecruiterMessageEmailService.DUE;
        assertTrue(q.contains("INTERVAL 15 MINUTE") && q.contains("INTERVAL 2 MINUTE") && q.contains("INTERVAL 45 MINUTE"));
        assertTrue(q.contains("recruiter_emailed_at <= NOW() - INTERVAL 6 HOUR"));
        assertTrue(q.contains("m.created_at > x.recruiter_emailed_at"), "only messages that arrived after the last email count");
        assertTrue(q.contains("x.status = 'ACTIVE'"), "never while the recruiter's access has ended");
        assertEquals("hello+r-abc@42lms.com", RecruiterMessageEmailService.replyAddress("hello@42lms.com", "r", "abc"));
    }
}
