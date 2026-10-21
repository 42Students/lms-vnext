package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 13 Oct 2026: a recruiter's reply to our email comes back into the conversation, only from them and only when verified. */
class InboundReplyServiceTest {

    private static final String TOKEN = "0123456789abcdef0123";
    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoMessagesService messages = mock(TpoMessagesService.class);
    private final InboundReplyService inbound = new InboundReplyService(jdbc, messages);

    private static InboundReplyService.Inbound email(String from, String to, String auth, String text) {
        InboundReplyService.Inbound e = new InboundReplyService.Inbound();
        e.id = "<abc@mail.omega.test>"; e.from = from; e.headerFrom = from; e.to = to; e.subject = "Re: 2 new messages from NSRIT";
        e.auth = auth; e.text = text;
        return e;
    }

    private void conversation(String recruiterEmail) {
        Map<String, Object> t = new HashMap<>();
        t.put("id", 9L); t.put("collegeId", 6); t.put("recruiterId", 2L); t.put("jobId", 46); t.put("email", recruiterEmail);
        when(jdbc.queryForList(contains("WHERE t.reply_token = :k"), any(MapSqlParameterSource.class))).thenReturn(List.of(t));
        when(jdbc.update(contains("INSERT IGNORE INTO inbound_email"), any(MapSqlParameterSource.class))).thenReturn(1);
    }

    private String logged() {
        ArgumentCaptor<MapSqlParameterSource> p = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).update(contains("UPDATE inbound_email SET"), p.capture());
        return String.valueOf(p.getValue().getValue("st"));
    }

    @Test
    void theRecruitersVerifiedReplyIsPostedWithoutTheQuotedEmail() {
        conversation("priya@omega.test");
        when(messages.postEmailReply(6, 2L, 46, "Yes, the panel will be there by 9:30.\n\nThanks,\nPriya")).thenReturn(77L);
        String text = "Yes, the panel will be there by 9:30.\n\nThanks,\nPriya\n\nOn Mon, 13 Oct 2026 at 10:42, NSRIT Campus Recruitment <recruitment+r-" + TOKEN + "@42lms.com> wrote:\n> Hi Priya, the hall is booked.";
        assertEquals("POSTED", inbound.receive(email("Priya <Priya@omega.test>", "recruitment+r-" + TOKEN + "@42lms.com",
                "i=1; mx.cloudflare.net; dkim=pass header.d=omega.test; spf=pass smtp.mailfrom=omega.test; dmarc=pass header.from=omega.test", text)));
        assertEquals("POSTED", logged());
    }

    @Test
    void someoneElseWritingToTheAddressIsNotPosted() {
        conversation("priya@omega.test");
        assertEquals("WRONG_SENDER", inbound.receive(email("x@evil.test", "recruitment+r-" + TOKEN + "@42lms.com", "dmarc=pass", "Hello")));
        verify(messages, never()).postEmailReply(anyInt(), anyLong(), any(), anyString());
    }

    @Test
    void aSpoofedSenderIsNotPosted() {
        conversation("priya@omega.test");
        assertEquals("NOT_VERIFIED", inbound.receive(email("priya@omega.test", "recruitment+r-" + TOKEN + "@42lms.com", "spf=fail; dmarc=fail", "Hello")));
    }

    @Test
    void anEndedAccessIsLoggedNotPosted() {
        conversation("priya@omega.test");
        when(messages.postEmailReply(eq(6), eq(2L), eq(46), anyString())).thenThrow(new IllegalStateException("ended"));
        assertEquals("ACCESS_ENDED", inbound.receive(email("priya@omega.test", "recruitment+r-" + TOKEN + "@42lms.com", "dmarc=pass", "Hello")));
    }

    @Test
    void anyOtherEmailIsKeptForInboundMail() {
        when(jdbc.update(contains("INSERT IGNORE INTO inbound_email"), any(MapSqlParameterSource.class))).thenReturn(1);
        Map<String, Object> learner = new HashMap<>();
        learner.put("id", 159); learner.put("college_id", 6);
        when(jdbc.queryForList(contains("FROM learner WHERE LOWER(contact_mail)"), any(MapSqlParameterSource.class))).thenReturn(List.of(learner));
        assertEquals("STORED", inbound.receive(email("Ravi <ravi@student.test>", "hello@42lms.com", "dmarc=pass", "I did not get my code\n\nOn Mon wrote:\n> code")));
        ArgumentCaptor<MapSqlParameterSource> p = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).update(contains("UPDATE inbound_email SET"), p.capture());
        assertEquals("STORED", p.getValue().getValue("st"));
        assertEquals(159, p.getValue().getValue("lid"), "matched to the student who wrote");
        assertEquals(6, p.getValue().getValue("cid"));
        assertTrue(String.valueOf(p.getValue().getValue("bt")).contains("On Mon wrote:"), "kept whole, quote and all");
        verify(messages, never()).postEmailReply(anyInt(), anyLong(), any(), anyString());
    }

    @Test
    void anotherEnvironmentsReplyIsNotTouched() {
        assertEquals("NOT_OURS", inbound.receive(email("priya@omega.test", "recruitment+rdev-" + TOKEN + "@42lms.com", "dmarc=pass", "Hi")));
        verify(jdbc, never()).update(contains("inbound_email"), any(MapSqlParameterSource.class));
    }

    @Test
    void theSameEmailTwiceIsHandledOnce() {
        when(jdbc.update(contains("INSERT IGNORE INTO inbound_email"), any(MapSqlParameterSource.class))).thenReturn(0);
        assertEquals("DUPLICATE", inbound.receive(email("priya@omega.test", "recruitment+r-" + TOKEN + "@42lms.com", "dmarc=pass", "Hello")));
        verify(messages, never()).postEmailReply(anyInt(), anyLong(), any(), anyString());
    }

    @Test
    void onlyTheWorkersSecretIsAccepted() {
        assertFalse(inbound.acceptsSecret("anything"), "no secret configured: nothing is accepted");
        ReflectionTestUtils.setField(inbound, "secret", "s3cret-value");
        assertTrue(inbound.acceptsSecret("s3cret-value"));
        assertFalse(inbound.acceptsSecret("s3cret-valuf"));
        assertFalse(inbound.acceptsSecret(null));
    }

    @Test
    void anHtmlOnlyReplyIsReadAsText() {
        conversation("priya@omega.test");
        InboundReplyService.Inbound e = email("priya@omega.test", "recruitment+r-" + TOKEN + "@42lms.com", "dmarc=pass", null);
        e.html = "<div>Confirmed for Friday.<br>Priya</div><blockquote>On Mon wrote: old</blockquote>";
        when(messages.postEmailReply(eq(6), eq(2L), eq(46), anyString())).thenReturn(5L);
        assertEquals("POSTED", inbound.receive(e));
    }

    @Test
    void parsing() {
        assertEquals(TOKEN, InboundReplyService.tokenOf("r", null, "RECRUITMENT+R-" + TOKEN.toUpperCase() + "@42lms.com"));
        assertNull(InboundReplyService.tokenOf("r", "recruitment@42lms.com"));
        assertNull(InboundReplyService.tokenOf("r", "recruitment+rdev-" + TOKEN + "@42lms.com"), "prod never reads dev's replies");
        assertEquals(TOKEN, InboundReplyService.tokenOf("rdev", "recruitment+rdev-" + TOKEN + "@42lms.com"));
        assertEquals("priya@omega.test", InboundReplyService.addressOf("\"Priya S\" <Priya@Omega.test>"));
        assertTrue(InboundReplyService.verified("i=1; mx.cloudflare.net; spf=pass smtp.mailfrom=omega.test"));
        assertFalse(InboundReplyService.verified("spf=pass; dmarc=fail"));
        assertFalse(InboundReplyService.verified(null));
        assertEquals("Sure, works for us.", InboundReplyService.stripQuoted("Sure, works for us.\n\n________________________________\nFrom: NSRIT Campus Recruitment\nSent: Monday"));
        assertEquals("Confirmed", InboundReplyService.stripQuoted("Confirmed\n\nSent from my iPhone\n\nOn 13 Oct 2026, at 10:42,\nNSRIT wrote:\n> hi"));
        assertEquals("Line one\n\nLine two", InboundReplyService.stripQuoted("Line one\n\n\n\nLine two\n-- \nPriya"));
    }
}
