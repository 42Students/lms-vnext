package com._42students.lms.controller.tpo;

import com._42students.lms.security.UserPrincipal;
import com._42students.lms.service.tpo.TpoAccessGuard;
import com._42students.lms.service.tpo.TpoOfferService;
import com._42students.lms.util.SecurityContextUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** One call verifies many selections; one the rules block does not stop the rest, and the answer says why. */
class TpoOfferControllerBulkVerifyTest {

    private TpoOfferService offers;
    private TpoAccessGuard guard;
    private TpoOfferController controller;

    @BeforeEach
    void setUp() {
        offers = mock(TpoOfferService.class);
        guard = mock(TpoAccessGuard.class);
        SecurityContextUtil sec = mock(SecurityContextUtil.class);
        when(sec.getAuthenticatedUserPrincipal()).thenReturn(new UserPrincipal(7, "FACULTY", "TPO", 1, 42, 0));
        controller = new TpoOfferController(offers, sec, guard);
    }

    private static TpoOfferController.BulkVerifyRequest req(Long... ids) {
        TpoOfferController.BulkVerifyRequest r = new TpoOfferController.BulkVerifyRequest();
        r.offerIds = List.of(ids);
        return r;
    }

    @Test
    @SuppressWarnings("unchecked")
    void aBlockedOfferDoesNotStopTheOthers() {
        when(offers.verifyAndRelease(eq(2L), eq(7))).thenThrow(new IllegalStateException("Not allowed by college rules: student already holds an offer this one doesn't clear"));
        Map<String, Object> out = controller.bulkVerify(req(1L, 2L, 3L)).getBody();
        assertEquals(List.of(1L, 3L), out.get("released"));
        List<Map<String, Object>> failed = (List<Map<String, Object>>) out.get("failed");
        assertEquals(1, failed.size());
        assertEquals(2L, failed.get(0).get("offerId"));
        assertTrue(String.valueOf(failed.get(0).get("reason")).startsWith("Not allowed by college rules"));
        verify(offers, times(3)).verifyAndRelease(any(Long.class), eq(7));
    }

    @Test
    @SuppressWarnings("unchecked")
    void anOfferFromAnotherCollegeIsRefusedAndNeverVerified() {
        doThrow(new IllegalArgumentException("Not found")).when(guard).requireOfferWritable(any(), eq(9L));
        Map<String, Object> out = controller.bulkVerify(req(9L, 1L)).getBody();
        assertEquals(List.of(1L), out.get("released"));
        assertEquals(9L, ((List<Map<String, Object>>) out.get("failed")).get(0).get("offerId"));
        verify(offers, never()).verifyAndRelease(eq(9L), any());
    }

    @Test
    void duplicatesAreVerifiedOnceAndTheSizeIsCapped() {
        controller.bulkVerify(req(1L, 1L, 1L));
        verify(offers, times(1)).verifyAndRelease(eq(1L), eq(7));
        Long[] many = new Long[201];
        for (int i = 0; i < many.length; i++) many[i] = (long) (i + 1);
        assertThrows(IllegalArgumentException.class, () -> controller.bulkVerify(req(many)));
    }
}
