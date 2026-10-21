package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Step 17: Engage email campaigns go to each recruiter lead with an email, skip the unsubscribed, and wait for the template. */
class TpoEmailCampaignServiceTest {

    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final RecruiterLeadRepository leads = mock(RecruiterLeadRepository.class);
    private final TpoRecruiterLeadService leadService = mock(TpoRecruiterLeadService.class);
    private final TpoMailService mail = mock(TpoMailService.class);
    private final TpoAuditService audit = mock(TpoAuditService.class);
    private final TpoEmailCampaignService svc = new TpoEmailCampaignService(jdbc, leads, leadService, mail, audit);

    private static RecruiterLead lead(long id, String email, boolean unsubscribed) {
        RecruiterLead l = new RecruiterLead();
        l.setId(id);
        l.setCollegeId(6);
        l.setName("Person " + id);
        l.setCompanyName("Omega");
        l.setEmailNorm(email);
        if (unsubscribed) l.setUnsubscribedAt(LocalDateTime.now());
        return l;
    }

    @BeforeEach
    void setUp() {
        when(jdbc.queryForObject(contains("LAST_INSERT_ID"), any(MapSqlParameterSource.class), eq(Long.class))).thenReturn(3L);
        when(jdbc.queryForList(contains("FROM college c"), any(MapSqlParameterSource.class))).thenReturn(List.of(Map.of("college", "NSRIT")));
        when(leads.findById(1L)).thenReturn(Optional.of(lead(1, "a@omega.com", false)));
        when(leads.findById(2L)).thenReturn(Optional.of(lead(2, "b@omega.com", true)));
        when(leads.findById(3L)).thenReturn(Optional.of(lead(3, null, false)));
    }

    @Test
    void sendsToTheReachableAndSkipsTheRest() {
        when(mail.isConfigured(TpoEmailCampaignService.TEMPLATE)).thenReturn(true);
        when(mail.sendAsCollege(eq(TpoEmailCampaignService.TEMPLATE), eq("a@omega.com"), any(), eq(6))).thenReturn(TpoMailService.Result.SENT);
        Map<String, Object> out = svc.send(6, 12, "Campus hiring 2027", "Hello {name}", List.of(1L, 2L, 3L), "https://nsrit.42lms.com");
        assertEquals(1, out.get("sent"));
        assertEquals(2, out.get("skipped"));
        verify(mail, times(1)).sendAsCollege(eq(TpoEmailCampaignService.TEMPLATE), anyString(), any(), eq(6)); // sent in the college's name
        verify(leadService).logActivity(eq(1L), eq("EMAIL"), any(), eq("Campaign: Campus hiring 2027"), eq(12));
    }

    @Test
    void withoutTheTemplateNothingGoesOutAndThePageIsTold() {
        when(mail.isConfigured(TpoEmailCampaignService.TEMPLATE)).thenReturn(false);
        Map<String, Object> out = svc.send(6, 12, "Subject", "Body", List.of(1L), null);
        assertEquals(false, out.get("emailAvailable"));
        verify(mail, never()).sendAsCollege(anyString(), anyString(), any(), any());
    }

    @Test
    void aSubjectABodyAndRecipientsAreNeeded() {
        assertThrows(IllegalArgumentException.class, () -> svc.send(6, 12, " ", "Body", List.of(1L), null));
        assertThrows(IllegalArgumentException.class, () -> svc.send(6, 12, "Subject", "", List.of(1L), null));
        assertThrows(IllegalArgumentException.class, () -> svc.send(6, 12, "Subject", "Body", List.of(), null));
    }
}
