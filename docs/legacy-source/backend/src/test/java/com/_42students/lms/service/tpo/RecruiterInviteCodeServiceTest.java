package com._42students.lms.service.tpo;

import com._42students.lms.service.ZeptoMailService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Recruiter phase 1, step 4: the code that proves the work mailbox before an invite link is spent. */
class RecruiterInviteCodeServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final ZeptoMailService mail = mock(ZeptoMailService.class);
    private final RecruiterInviteCodeService svc = new RecruiterInviteCodeService(jdbc, mail);

    private void stored(String code, int wrongTries) {
        String tokenHash = TpoRecruiterLeadService.sha256Hex("tok");
        when(jdbc.queryForList(contains("FROM recruiter_invite_code"), any(SqlParameterSource.class)))
                .thenReturn(List.of(Map.of("id", 1L, "h", TpoRecruiterLeadService.sha256Hex(tokenHash + ":" + code), "w", wrongTries)));
    }

    @Test
    void theRightCodeIsAcceptedAndUsedUp() {
        stored("123456", 0);
        svc.verify("tok", "kumar@omega.com", "123456");
        verify(jdbc).update(contains("SET used_at"), any(MapSqlParameterSource.class));
    }

    @Test
    void aWrongCodeIsRefusedAndCounted() {
        stored("123456", 0);
        RecruiterInviteCodeService.CodeProblem p = assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.verify("tok", "kumar@omega.com", "654321"));
        assertEquals("WRONG_CODE", p.getCode());
        verify(jdbc).update(contains("wrong_tries = wrong_tries + 1"), any(MapSqlParameterSource.class));
        verify(jdbc, never()).update(contains("SET used_at"), any(MapSqlParameterSource.class));
    }

    @Test
    void afterFiveWrongTriesEvenTheRightCodeIsRefused() {
        stored("123456", RecruiterInviteCodeService.MAX_WRONG);
        assertEquals("CODE_LOCKED", assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.verify("tok", "kumar@omega.com", "123456")).getCode());
    }

    @Test
    void noLiveCodeMeansSendANewOne() {
        when(jdbc.queryForList(contains("FROM recruiter_invite_code"), any(SqlParameterSource.class))).thenReturn(List.of());
        assertEquals("CODE_EXPIRED", assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.verify("tok", "kumar@omega.com", "123456")).getCode());
        assertEquals("CODE_REQUIRED", assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.verify("tok", "kumar@omega.com", null)).getCode());
    }

    @Test
    void tooManyCodesForOneLinkStopsSending() throws Exception {
        when(jdbc.queryForObject(contains("COUNT(*)"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(RecruiterInviteCodeService.MAX_PER_HOUR);
        assertEquals("TOO_MANY_CODES", assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.send("tok", "kumar@omega.com", "Kumar")).getCode());
        verify(mail, never()).sendEmailWithTemplateId(anyString(), anyString(), any());
    }

    @Test
    void aSharedLinkCountsCodesPerEmailSoOnePersonCannotBlockEveryone() throws Exception {
        // The link as a whole is busy (5 codes this hour), but this email has asked for none: it still gets a code.
        when(jdbc.queryForObject(contains("AND email = :e"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(0);
        when(jdbc.queryForObject(org.mockito.ArgumentMatchers.argThat((String sql) -> sql != null && sql.contains("COUNT(*)") && !sql.contains("email")),
                any(SqlParameterSource.class), eq(Integer.class))).thenReturn(5);
        svc.sendShared("tok", "kumar@omega.com", null);
        verify(mail).sendEmailWithTemplateId(any(), eq("kumar@omega.com"), any());
        // The same email, 5 times already: refused.
        when(jdbc.queryForObject(contains("AND email = :e"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(RecruiterInviteCodeService.MAX_PER_HOUR);
        assertEquals("TOO_MANY_CODES", assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.sendShared("tok", "kumar@omega.com", null)).getCode());
    }

    @Test
    void aSharedLinkStillHasACapForEveryone() {
        when(jdbc.queryForObject(contains("AND email = :e"), any(SqlParameterSource.class), eq(Integer.class))).thenReturn(0);
        when(jdbc.queryForObject(org.mockito.ArgumentMatchers.argThat((String sql) -> sql != null && sql.contains("COUNT(*)") && !sql.contains("email")),
                any(SqlParameterSource.class), eq(Integer.class))).thenReturn(RecruiterInviteCodeService.SHARED_MAX_PER_LINK_PER_HOUR);
        assertEquals("TOO_MANY_CODES", assertThrows(RecruiterInviteCodeService.CodeProblem.class, () -> svc.sendShared("tok", "new@omega.com", null)).getCode());
    }
}
