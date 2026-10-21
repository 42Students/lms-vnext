package com._42students.lms.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Input normalization contracts at the API input boundary. */
class InputSanitizerBoundaryRegressionTest {
    @Test void nullTextRemainsNull() { assertNull(InputSanitizer.sanitize(null)); }
    @Test void emptyTextRemainsEmpty() { assertEquals("", InputSanitizer.sanitize("")); }
    @Test void textIsTrimmed() { assertEquals("hello", InputSanitizer.sanitize("  hello  ")); }
    @Test void scriptTagIsEscaped() { assertEquals("&lt;script&gt;", InputSanitizer.sanitize("<script>")); }
    @Test void ampersandIsEscaped() { assertEquals("a&amp;b", InputSanitizer.sanitize("a&b")); }
    @Test void quotedAttributeIsEscaped() { assertEquals("&quot;onload&quot;", InputSanitizer.sanitize("\"onload\"")); }
    @Test void nullMultilineRemainsNull() { assertNull(InputSanitizer.sanitizePreserveNewlines(null)); }
    @Test void multilinePreservesLeadingWhitespace() { assertEquals("  hello", InputSanitizer.sanitizePreserveNewlines("  hello")); }
    @Test void multilinePreservesTrailingWhitespace() { assertEquals("hello  ", InputSanitizer.sanitizePreserveNewlines("hello  ")); }
    @Test void multilinePreservesLineBreaks() { assertEquals("one\ntwo", InputSanitizer.sanitizePreserveNewlines("one\ntwo")); }
    @Test void multilineEscapesMarkup() { assertEquals("&lt;b&gt;\ntext", InputSanitizer.sanitizePreserveNewlines("<b>\ntext")); }
    @Test void nullEmailRemainsNull() { assertNull(InputSanitizer.sanitizeEmail(null)); }
    @Test void emailIsTrimmed() { assertEquals("a@b.com", InputSanitizer.sanitizeEmail("  a@b.com  ")); }
    @Test void emailIsLowercased() { assertEquals("user@example.com", InputSanitizer.sanitizeEmail("USER@EXAMPLE.COM")); }
    @Test void emailPreservesPlusAlias() { assertEquals("a+b@example.com", InputSanitizer.sanitizeEmail("A+B@EXAMPLE.COM")); }
    @Test void nullPhoneRemainsNull() { assertNull(InputSanitizer.sanitizePhone(null)); }
    @Test void phoneRemovesSpaces() { assertEquals("9876543210", InputSanitizer.sanitizePhone("98765 43210")); }
    @Test void phoneRemovesPunctuation() { assertEquals("9876543210", InputSanitizer.sanitizePhone("(987) 654-3210")); }
    @Test void phonePreservesInternationalPrefix() { assertEquals("+919876543210", InputSanitizer.sanitizePhone("+91 98765 43210")); }
    @Test void phoneRemovesLetters() { assertEquals("123", InputSanitizer.sanitizePhone("call 123")); }
    @Test void nullUrlRemainsNull() { assertNull(InputSanitizer.sanitizeUrl(null)); }
    @Test void urlTrimsWhitespace() { assertEquals("https://example.com", InputSanitizer.sanitizeUrl(" https://example.com ")); }
    @Test void urlEscapesQueryAmpersand() { assertEquals("https://example.com/?a=1&amp;b=2", InputSanitizer.sanitizeUrl("https://example.com/?a=1&b=2")); }
    @Test void relativeUrlEscapesMarkup() { assertEquals("/path?x=&lt;tag&gt;", InputSanitizer.sanitizeUrl("/path?x=<tag>")); }
    @Test void urlDoesNotSilentlyUpgradeHttp() { assertEquals("http://example.com", InputSanitizer.sanitizeUrl("http://example.com")); }
}
