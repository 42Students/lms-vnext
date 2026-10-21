package com._42students.lms.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** A drive's description is rich text: kept as HTML, never escaped, never unsafe (night audit 13 Oct 2026). */
class TextSanitizerRichTextTest {

    @Test
    void formattingIsKeptNotEscaped() {
        String out = TextSanitizer.sanitizeRichTextAndTruncate("<p>Role: <strong>SDE</strong></p><ul><li>Java</li></ul>", 5000);
        assertTrue(out.contains("<p>Role: <strong>SDE</strong></p>"), out);
        assertTrue(out.contains("<li>Java</li>"), out);
        assertFalse(out.contains("&lt;"), out);
    }

    @Test
    void unsafeHtmlIsDropped() {
        String out = TextSanitizer.sanitizeRichTextAndTruncate("<p onclick=\"x()\">Hi</p><script>alert(1)</script><a href=\"javascript:alert(1)\">x</a><img src=x onerror=y>", 5000);
        assertFalse(out.contains("script"), out);
        assertFalse(out.contains("onclick"), out);
        assertFalse(out.contains("javascript:"), out);
        assertFalse(out.contains("<img"), out);
        assertTrue(out.contains("Hi"), out);
    }

    @Test
    void plainTextStaysTextAndLengthIsCapped() {
        assertEquals("Hello &amp; welcome", TextSanitizer.sanitizeRichTextAndTruncate("Hello & welcome", 5000));
        assertTrue(TextSanitizer.sanitizeRichTextAndTruncate("<p>" + "a".repeat(100) + "</p>", 50).length() <= 50);
        assertEquals(null, TextSanitizer.sanitizeRichTextAndTruncate(null, 50));
    }
}
