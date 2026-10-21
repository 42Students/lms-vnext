package com._42students.lms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

/**
 * Retrieves short-lived Google access tokens from the GKE metadata service.
 * No credential material is stored in the application or returned to callers.
 */
@Component
public class GcpMetadataCredentialProvider {
    private static final URI TOKEN_URI = URI.create(
            "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token");
    private static final URI PROJECT_URI = URI.create(
            "http://metadata.google.internal/computeMetadata/v1/project/project-id");

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;
    private volatile String cachedProjectId;

    @Autowired
    public GcpMetadataCredentialProvider(ObjectMapper objectMapper) {
        this(objectMapper, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build());
    }

    GcpMetadataCredentialProvider(ObjectMapper objectMapper, HttpClient httpClient) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
    }

    public synchronized String getAccessToken() {
        Instant now = Instant.now();
        if (cachedToken != null && now.plusSeconds(60).isBefore(tokenExpiresAt)) {
            return cachedToken;
        }

        HttpRequest request = HttpRequest.newBuilder(TOKEN_URI)
                .timeout(Duration.ofSeconds(3))
                .header("Metadata-Flavor", "Google")
                .GET()
                .build();

        HttpResponse<String> response = send(request);
        if (response.statusCode() != 200) {
            throw new CloudLoggingUnavailableException(
                    "GCP metadata token endpoint returned HTTP " + response.statusCode());
        }

        try {
            JsonNode json = objectMapper.readTree(response.body());
            String token = json.path("access_token").asText(null);
            long expiresIn = json.path("expires_in").asLong(0);
            if (token == null || token.isBlank() || expiresIn <= 0) {
                throw new CloudLoggingUnavailableException("GCP metadata token response was incomplete");
            }
            cachedToken = token;
            tokenExpiresAt = now.plusSeconds(expiresIn);
            return token;
        } catch (IOException e) {
            throw new CloudLoggingUnavailableException("Could not parse GCP metadata token", e);
        }
    }

    public synchronized String getProjectId() {
        String envProject = firstNonBlank(
                System.getenv("GOOGLE_CLOUD_PROJECT"),
                System.getenv("GCP_PROJECT_ID"));
        if (envProject != null) return envProject;

        if (cachedProjectId != null && !cachedProjectId.isBlank()) {
            return cachedProjectId;
        }

        HttpRequest request = HttpRequest.newBuilder(PROJECT_URI)
                .timeout(Duration.ofSeconds(3))
                .header("Metadata-Flavor", "Google")
                .GET()
                .build();

        HttpResponse<String> response = send(request);
        if (response.statusCode() != 200 || response.body() == null || response.body().isBlank()) {
            throw new CloudLoggingUnavailableException(
                    "Could not resolve Google Cloud project from metadata");
        }
        cachedProjectId = response.body().trim();
        return cachedProjectId;
    }

    private HttpResponse<String> send(HttpRequest request) {
        try {
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new CloudLoggingUnavailableException("GCP metadata service is unavailable", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CloudLoggingUnavailableException("GCP metadata request was interrupted", e);
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }
}
