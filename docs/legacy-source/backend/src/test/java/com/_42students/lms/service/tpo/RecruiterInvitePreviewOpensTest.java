package com._42students.lms.service.tpo;

import com._42students.lms.model.College;
import com._42students.lms.model.tpo.RecruiterLead;
import com._42students.lms.repository.CollegeRepository;
import com._42students.lms.repository.tpo.RecruiterLeadRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** BE-0206: opening the invite counts as a click, so the "still unopened" reminder does not rotate an opened link. */
class RecruiterInvitePreviewOpensTest {

    private final RecruiterLeadRepository leads = mock(RecruiterLeadRepository.class);
    private final CollegeRepository colleges = mock(CollegeRepository.class);
    private final RecruiterInviteService service = new RecruiterInviteService(leads, null, null, null, colleges, null, null, null, null, null);

    private RecruiterLead lead(LocalDateTime clickedAt) {
        RecruiterLead l = new RecruiterLead();
        l.setId(5L);
        l.setCollegeId(3);
        l.setInviteSentAt(LocalDateTime.now().minusDays(1));
        l.setInviteClickedAt(clickedAt);
        l.setManualStage("AUTO");
        when(leads.findByInviteTokenHash(anyString())).thenReturn(Optional.of(l));
        College c = new College();
        c.setName("NSRIT");
        when(colleges.findById(3)).thenReturn(Optional.of(c));
        return l;
    }

    @Test
    void theFirstOpenIsRecorded() {
        lead(null);
        service.preview("tok");
        verify(leads).markInviteOpened(eq(5L), any(LocalDateTime.class));
    }

    @Test
    void anOpenedInviteIsNotWrittenAgain() {
        lead(LocalDateTime.now().minusHours(2));
        service.preview("tok");
        verify(leads, never()).markInviteOpened(anyLong(), any());
    }
}
