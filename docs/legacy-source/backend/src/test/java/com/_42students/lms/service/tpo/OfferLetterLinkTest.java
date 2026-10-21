package com._42students.lms.service.tpo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** An offer letter becomes a link a student clicks: only http(s) is stored (javascript: and data: ran in their browser). */
class OfferLetterLinkTest {
    @Test
    void onlyWebLinksAreKept() {
        assertEquals("https://r2.example.com/a.pdf", TpoOfferService.webLink("  https://r2.example.com/a.pdf "));
        assertNull(TpoOfferService.webLink(" "));
        assertThrows(IllegalArgumentException.class, () -> TpoOfferService.webLink("javascript:alert(1)"));
        assertThrows(IllegalArgumentException.class, () -> TpoOfferService.webLink("data:text/html,hi"));
        assertThrows(IllegalArgumentException.class, () -> TpoOfferService.webLink("https://a b"));
    }
}
