package com._42students.lms.common;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class CodingPlatformsTest {

    private static CodingPlatforms.Platform p(String key) { return CodingPlatforms.byKey(key); }

    @Test
    void aUsernameOrTheProfileLinkSaveTheSameThing() {
        assertEquals("asha_k", CodingPlatforms.username(p("LEETCODE"), "asha_k"));
        assertEquals("asha_k", CodingPlatforms.username(p("LEETCODE"), "https://leetcode.com/u/asha_k/"));
        assertEquals("asha_k", CodingPlatforms.username(p("LEETCODE"), "leetcode.com/u/asha_k?tab=x"));
        assertEquals("asha.k", CodingPlatforms.username(p("HACKERRANK"), "https://www.hackerrank.com/profile/asha.k"));
        assertEquals("asha", CodingPlatforms.username(p("HACKEREARTH"), "https://www.hackerearth.com/@asha"));
        assertEquals("asha99", CodingPlatforms.username(p("CODECHEF"), "  https://www.codechef.com/users/asha99  "));
    }

    @Test
    void aLinkToAnotherSiteOrABadUsernameIsRefusedInPlainWords() {
        IllegalArgumentException e = assertThrows(IllegalArgumentException.class, () -> CodingPlatforms.username(p("LEETCODE"), "https://evil.example.com/u/asha"));
        assertTrue(e.getMessage().contains("not a LeetCode profile"));
        assertThrows(IllegalArgumentException.class, () -> CodingPlatforms.username(p("CODECHEF"), "9starts_with_digit"));
        assertThrows(IllegalArgumentException.class, () -> CodingPlatforms.username(p("LEETCODE"), "a b"));
        assertThrows(IllegalArgumentException.class, () -> CodingPlatforms.username(p("LEETCODE"), "<script>"));
    }

    @Test
    void normalizeDropsBlanksRefusesUnknownPlatformsAndUsesCanonicalKeys() {
        Map<String, String> in = new LinkedHashMap<>();
        in.put("leetcode", "https://leetcode.com/u/asha_k");
        in.put("CODEFORCES", "   ");
        Map<String, String> out = CodingPlatforms.normalize(in);
        assertEquals(Map.of("LEETCODE", "asha_k"), out);
        assertThrows(IllegalArgumentException.class, () -> CodingPlatforms.normalize(Map.of("MYSPACE", "asha")));
    }

    @Test
    void describeBuildsTheLinkFromThePlatform() {
        var links = CodingPlatforms.describe(Map.of("GFG", "asha", "LEETCODE", "asha_k"));
        assertEquals("LEETCODE", links.get(0).get("key")); // platform order, not map order
        assertEquals("https://leetcode.com/u/asha_k", links.get(0).get("url"));
        assertEquals("https://www.geeksforgeeks.org/user/asha", links.get(1).get("url"));
    }
}
