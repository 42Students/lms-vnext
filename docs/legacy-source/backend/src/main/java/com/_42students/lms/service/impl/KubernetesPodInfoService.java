package com._42students.lms.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

/**
 * Reads this pod's own replicas' start times from the in-cluster Kubernetes API, using the
 * ServiceAccount token/CA cert every pod gets mounted automatically. Requires the pod's
 * ServiceAccount to be RBAC-bound to "get"/"list" on pods in its own namespace (see
 * k8s/prod-2026/lms-be-rbac.yaml) -- until that grant exists, or when not running in-cluster at all
 * (local dev, tests), every call here safely returns empty and the caller falls back to whatever
 * approximation it already had.
 */
@Slf4j
@Service
public class KubernetesPodInfoService {

    private static final String TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";
    private static final String CA_CERT_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";
    private static final String NAMESPACE_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/namespace";
    private static final String API_HOST = "https://kubernetes.default.svc";

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String namespace;
    /** Re-read on every call, not cached -- projected ServiceAccount tokens rotate roughly hourly. */
    private final Supplier<String> tokenSupplier;

    @Autowired
    public KubernetesPodInfoService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        HttpClient client;
        String ns;
        try {
            client = buildInClusterHttpClient();
            ns = Files.readString(Path.of(NAMESPACE_PATH)).trim();
        } catch (Exception e) {
            log.debug("Not running in-cluster (or Kubernetes API not reachable): {}", e.getMessage());
            client = null;
            ns = null;
        }
        this.httpClient = client;
        this.namespace = ns;
        this.tokenSupplier = () -> readTokenOrNull();
    }

    /** Package-private constructor for injecting test doubles, mirroring TelegramNotifierService's own pattern. */
    KubernetesPodInfoService(ObjectMapper objectMapper, HttpClient httpClient, String namespace, Supplier<String> tokenSupplier) {
        this.objectMapper = objectMapper;
        this.httpClient = httpClient;
        this.namespace = namespace;
        this.tokenSupplier = tokenSupplier;
    }

    private static String readTokenOrNull() {
        try {
            return Files.readString(Path.of(TOKEN_PATH)).trim();
        } catch (Exception e) {
            return null;
        }
    }

    private static HttpClient buildInClusterHttpClient() throws Exception {
        byte[] caCertBytes = Files.readAllBytes(Path.of(CA_CERT_PATH));
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        Certificate ca = cf.generateCertificate(new ByteArrayInputStream(caCertBytes));
        KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
        keyStore.load(null, null);
        keyStore.setCertificateEntry("kube-ca", ca);
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(keyStore);
        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, tmf.getTrustManagers(), null);
        return HttpClient.newBuilder().sslContext(sslContext).connectTimeout(Duration.ofSeconds(5)).build();
    }

    /**
     * @param labelSelector e.g. "component=lms-be"
     * @return empty if not running in-cluster, the RBAC grant isn't in place yet (403), or the call
     *         otherwise fails -- never throws.
     */
    public Optional<PodTimes> getOwnDeploymentPodTimes(String labelSelector) {
        if (httpClient == null || namespace == null) return Optional.empty();
        String token = tokenSupplier.get();
        if (token == null) return Optional.empty();
        try {
            String url = API_HOST + "/api/v1/namespaces/" + namespace + "/pods?labelSelector="
                    + URLEncoder.encode(labelSelector, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .header("Authorization", "Bearer " + token)
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Kubernetes pod list call failed: status={}", response.statusCode());
                return Optional.empty();
            }
            JsonNode root = objectMapper.readTree(response.body());
            List<Instant> starts = new ArrayList<>();
            for (JsonNode item : root.path("items")) {
                String startTime = item.path("status").path("startTime").asText(null);
                if (startTime != null) {
                    starts.add(Instant.parse(startTime));
                }
            }
            if (starts.isEmpty()) return Optional.empty();
            return Optional.of(new PodTimes(Collections.min(starts), Collections.max(starts), starts.size()));
        } catch (Exception e) {
            log.warn("Failed to read pod start times from the Kubernetes API: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public static final class PodTimes {
        public final Instant earliestStart;
        public final Instant latestStart;
        public final int podCount;

        public PodTimes(Instant earliestStart, Instant latestStart, int podCount) {
            this.earliestStart = earliestStart;
            this.latestStart = latestStart;
            this.podCount = podCount;
        }
    }
}
