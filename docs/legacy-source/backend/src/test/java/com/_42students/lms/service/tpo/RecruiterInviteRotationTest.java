package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.tpo.RecruiterLeadActivityRepository;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** BE-0104: making an invite link is compare-and-set on the previous link, so a racing second request is refused, not handed a dead link. */
class RecruiterInviteRotationTest {

    private final RecruiterLeadRepository leads = mock(RecruiterLeadRepository.class);
    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final TpoRecruiterLeadService service = new TpoRecruiterLeadService(leads, jdbc, null, null, mock(RecruiterLeadActivityRepository.class), null, null);

    private RecruiterLead lead(String hash) {
        RecruiterLead l = new RecruiterLead();
        l.setId(9L);
        l.setInviteTokenHash(hash);
        when(leads.findById(9L)).thenReturn(Optional.of(l));
        return l;
    }

    @Test
    void theWinnerGetsTheLinkAndTheSwapNamesTheOldHash() {
        RecruiterLead l = lead("old-hash");
        when(jdbc.update(anyString(), any(MapSqlParameterSource.class))).thenReturn(1);
        String token = (String) service.invite(9L).get("token");
        assertNotNull(token);
        verify(jdbc).update(contains("invite_token_hash = :old"), argThat((MapSqlParameterSource q) -> "old-hash".equals(q.getValue("old"))));
        assertEquals(TpoRecruiterLeadService.sha256Hex(token), l.getInviteTokenHash());
        verify(leads, never()).save(any());
    }

    @Test
    void theLoserIsRefusedInsteadOfGettingADeadLink() {
        lead("old-hash");
        when(jdbc.update(anyString(), any(MapSqlParameterSource.class))).thenReturn(0); // the other request swapped first
        IllegalStateException e = assertThrows(IllegalStateException.class, () -> service.invite(9L));
        assertTrue(e.getMessage().startsWith("Someone else just made a new invite link"));
    }

    @Test
    void aFirstInviteMatchesAnEmptyLink() {
        lead(null);
        when(jdbc.update(anyString(), any(MapSqlParameterSource.class))).thenReturn(1);
        service.invite(9L);
        verify(jdbc).update(contains("invite_token_hash IS NULL"), any(MapSqlParameterSource.class));
    }
}
