package com._42students.lms.service.impl;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ResourceMaterialMimePolicyTest {
    @Test
    void acceptsKnownDocumentAndImagePairs() {
        assertTrue(ResourceMaterialMimePolicy.matches("week.pdf", "application/pdf"));
        assertTrue(ResourceMaterialMimePolicy.matches("slides.PPTX", "application/vnd.openxmlformats-officedocument.presentationml.presentation"));
        assertTrue(ResourceMaterialMimePolicy.matches("table.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        assertTrue(ResourceMaterialMimePolicy.matches("photo.jpg", "image/jpeg"));
        assertTrue(ResourceMaterialMimePolicy.matches("data.csv", "text/csv"));
    }

    @Test
    void rejectsActiveContentAndMismatchedMime() {
        assertFalse(ResourceMaterialMimePolicy.matches("script.svg", "image/svg+xml"));
        assertFalse(ResourceMaterialMimePolicy.matches("index.html", "text/html"));
        assertFalse(ResourceMaterialMimePolicy.matches("agenda.pdf", "text/html"));
        assertFalse(ResourceMaterialMimePolicy.matches("agenda.pdf", "application/octet-stream"));
        assertFalse(ResourceMaterialMimePolicy.matches("evil.exe", "application/pdf"));
    }

    @Test
    void permitsOnlyKnownLegacyMultipartOctetFallbacks() {
        assertTrue(ResourceMaterialMimePolicy.matchesStored("readme.txt", "application/octet-stream"));
        assertTrue(ResourceMaterialMimePolicy.matchesStored("table.xlsx", "application/octet-stream"));
        assertFalse(ResourceMaterialMimePolicy.matchesStored("document.pdf", "application/octet-stream"));
        assertFalse(ResourceMaterialMimePolicy.matchesStored("payload.svg", "application/octet-stream"));
    }
}
