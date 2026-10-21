package com._42students.lms.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.impl.Log4jLogEvent;
import org.apache.logging.log4j.core.layout.PatternLayout;
import org.apache.logging.log4j.message.SimpleMessage;
import org.apache.logging.log4j.util.SortedArrayStringMap;
import org.apache.logging.log4j.util.StringMap;
import org.junit.jupiter.api.Test;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class StructuredLoggingConfigTest {
    @Test
    void consolePatternIsValidOneLineJsonAndEscapesMessageContent() throws Exception {
        String xml;
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("log4j2.xml")) {
            assertNotNull(in, "log4j2.xml must be on the test classpath");
            xml = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }

        // Parsing the XML catches malformed config before deployment.
        DocumentBuilderFactory.newInstance().newDocumentBuilder()
                .parse(new java.io.ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));

        var doc = DocumentBuilderFactory.newInstance().newDocumentBuilder()
                .parse(new java.io.ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
        var xpath = XPathFactory.newInstance().newXPath();
        String pattern = (String) xpath.evaluate(
                "/Configuration/Properties/Property[@name='consoleJsonPattern']/text()",
                doc,
                XPathConstants.STRING);

        assertFalse(pattern.isBlank());
        assertTrue(pattern.contains("\"severity\":\"%p\""));
        assertTrue(pattern.contains("\"requestId\""));
        assertTrue(pattern.contains("\"httpPath\""));
        assertFalse(pattern.contains("queryString"));
        assertFalse(pattern.contains("Authorization"));

        StringMap context = new SortedArrayStringMap();
        context.putValue("requestId", "req-12345678");
        context.putValue("httpMethod", "POST");
        context.putValue("httpPath", "/api/v1/test");
        context.putValue("httpStatus", "500");
        context.putValue("durationMs", "12");
        context.putValue("userId", "15");
        context.putValue("userType", "FACULTY");
        context.putValue("collegeId", "6");

        LogEvent event = Log4jLogEvent.newBuilder()
                .setLevel(Level.ERROR)
                .setLoggerName("com._42students.TestService")
                .setThreadName("test-thread")
                .setMessage(new SimpleMessage("message with \"quotes\" and\nnewline"))
                .setContextData(context)
                .setThrown(new IllegalStateException("boom\nsecond line"))
                .build();

        String rendered = PatternLayout.newBuilder()
                .withPattern(pattern)
                .build()
                .toSerializable(event)
                .trim();

        JsonNode json = new ObjectMapper().readTree(rendered);
        assertEquals("ERROR", json.get("severity").asText());
        assertEquals("req-12345678", json.get("requestId").asText());
        assertEquals("POST", json.get("httpMethod").asText());
        assertEquals("/api/v1/test", json.get("httpPath").asText());
        assertEquals("500", json.get("httpStatus").asText());
        assertEquals("12", json.get("durationMs").asText());
        assertEquals("15", json.get("userId").asText());
        assertEquals("FACULTY", json.get("userType").asText());
        assertEquals("6", json.get("collegeId").asText());
        assertEquals("", json.get("organizationId").asText(), "absent scope renders empty, never the word null");
        assertTrue(json.has("commit") && !json.get("commit").asText().isBlank());
        assertTrue(json.get("message").asText().contains("quotes"));
        assertTrue(json.get("exception").asText().contains("IllegalStateException"));
    }
}
