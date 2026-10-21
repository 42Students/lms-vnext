package com._42students.lms.service.impl;

import com._42students.lms.utils.R2StorageUtils;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Old intros were saved as a bare storage key; the profile plays the value as a URL. */
class VideoIntroPlayableUrlTest {

    private LearnerProfileServiceImpl service(String base) {
        LearnerProfileServiceImpl s = new LearnerProfileServiceImpl();
        R2StorageUtils r2 = mock(R2StorageUtils.class);
        when(r2.getPublicUrlBase()).thenReturn(base);
        ReflectionTestUtils.setField(s, "r2StorageUtils", r2);
        return s;
    }

    @Test
    void bareKeyBecomesItsPublicUrl() {
        assertEquals("https://storesuuploads.42lms.in/org-6/college-6/video-intros/user-164/a.webm",
                service("https://storesuuploads.42lms.in/").playableVideoIntroUrl("org-6/college-6/video-intros/user-164/a.webm"));
    }

    @Test
    void fullUrlAndEmptyAreLeftAlone() {
        LearnerProfileServiceImpl s = service("https://storesuuploads.42lms.in/");
        assertEquals("https://storesuuploads.42lms.in/x.webm", s.playableVideoIntroUrl("https://storesuuploads.42lms.in/x.webm"));
        assertNull(s.playableVideoIntroUrl(null));
        assertEquals("", s.playableVideoIntroUrl(""));
    }

    @Test
    void noPublicBaseKeepsTheStoredValue() {
        assertEquals("video-intros/a.webm", service(null).playableVideoIntroUrl("video-intros/a.webm"));
    }
}
